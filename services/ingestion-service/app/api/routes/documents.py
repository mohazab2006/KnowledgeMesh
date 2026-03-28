from __future__ import annotations

import json
import re
import uuid
from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import assert_workspace_member, get_current_user_id
from app.db.session import get_db
from app.models.document import Document
from app.schemas.document import DocumentOut

router = APIRouter()


def _safe_filename(name: str | None) -> str:
    base = Path(name or "upload").name
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", base)[:200]
    return cleaned or "upload.bin"


@router.get("", response_model=list[DocumentOut])
async def list_documents(
    workspace_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[Document]:
    await assert_workspace_member(db, workspace_id, user_id)
    result = await db.scalars(
        select(Document)
        .where(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
    )
    return list(result.all())


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    workspace_id: UUID,
    document_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Document:
    await assert_workspace_member(db, workspace_id, user_id)
    doc = await db.get(Document, document_id)
    if doc is None or doc.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("", response_model=DocumentOut, status_code=201)
async def upload_document(
    request: Request,
    workspace_id: UUID,
    file: UploadFile,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Document:
    await assert_workspace_member(db, workspace_id, user_id)
    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large")

    doc_id = uuid.uuid4()
    safe_name = _safe_filename(file.filename)
    ext = Path(safe_name).suffix[:32] if Path(safe_name).suffix else ""
    rel_path = f"{workspace_id}/{doc_id}{ext}"
    abs_path = Path(settings.upload_dir) / str(workspace_id) / f"{doc_id}{ext}"
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    abs_path.write_bytes(content)

    doc = Document(
        id=doc_id,
        workspace_id=workspace_id,
        created_by_id=user_id,
        original_filename=safe_name,
        content_type=file.content_type,
        size_bytes=len(content),
        storage_path=rel_path,
        status="queued",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    r = request.app.state.redis
    await r.lpush(
        settings.ingestion_queue_name,
        json.dumps(
            {"document_id": str(doc.id), "workspace_id": str(workspace_id)}
        ),
    )
    return doc


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    workspace_id: UUID,
    document_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    await assert_workspace_member(db, workspace_id, user_id)
    doc = await db.get(Document, document_id)
    if doc is None or doc.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Document not found")

    abs_path = Path(settings.upload_dir) / doc.storage_path
    await db.delete(doc)
    await db.commit()
    if abs_path.is_file():
        abs_path.unlink()
