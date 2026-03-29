from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import assert_workspace_member, get_current_user_id
from app.db.session import get_db
from app.models.document import Document
from app.models.workspace_query_event import WorkspaceQueryEvent
from app.schemas.document import DocumentOut, WorkspaceDocumentStatsOut

router = APIRouter()

# Keep in sync with worker extractors (PDF + UTF-8 text-friendly types).
_ALLOWED_SUFFIXES = frozenset(
    {
        ".pdf",
        ".txt",
        ".md",
        ".markdown",
        ".csv",
        ".tsv",
        ".json",
        ".log",
        ".html",
        ".htm",
        ".xml",
        ".rst",
    }
)


def _upload_allowed(original_name: str | None, content_type: str | None) -> bool:
    ext = Path((original_name or "").lower()).suffix
    if ext in _ALLOWED_SUFFIXES:
        return True
    ct = (content_type or "").lower().strip()
    if ct.startswith("application/pdf"):
        return True
    if ct.startswith("text/"):
        return True
    if ct in ("application/json", "application/xml"):
        return True
    if ct == "application/octet-stream" and ext in _ALLOWED_SUFFIXES:
        return True
    return False


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


_PIPELINE_STATUSES = ("queued", "processing", "uploaded")


@router.get("/stats", response_model=WorkspaceDocumentStatsOut)
async def workspace_document_stats(
    workspace_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> WorkspaceDocumentStatsOut:
    await assert_workspace_member(db, workspace_id, user_id)
    indexed = await db.scalar(
        select(func.count())
        .select_from(Document)
        .where(
            Document.workspace_id == workspace_id,
            Document.status == "indexed",
        )
    )
    processing = await db.scalar(
        select(func.count())
        .select_from(Document)
        .where(
            Document.workspace_id == workspace_id,
            Document.status.in_(_PIPELINE_STATUSES),
        )
    )
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    qcount = await db.scalar(
        select(func.count())
        .select_from(WorkspaceQueryEvent)
        .where(
            WorkspaceQueryEvent.workspace_id == workspace_id,
            WorkspaceQueryEvent.created_at >= cutoff,
        )
    )
    return WorkspaceDocumentStatsOut(
        indexed_count=int(indexed or 0),
        processing_count=int(processing or 0),
        queries_24h=int(qcount or 0),
    )


@router.post("/query-events", status_code=204)
async def record_query_event(
    workspace_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Response:
    """Append-only log of a completed query (called by gateway after RAG)."""
    await assert_workspace_member(db, workspace_id, user_id)
    db.add(WorkspaceQueryEvent(workspace_id=workspace_id))
    await db.commit()
    return Response(status_code=204)


def _response_media_type(doc: Document) -> str:
    ct = (doc.content_type or "").strip()
    if ct and ct != "application/octet-stream":
        return ct
    fn = doc.original_filename.lower()
    if fn.endswith(".pdf"):
        return "application/pdf"
    if fn.endswith((".md", ".markdown")):
        return "text/markdown"
    if fn.endswith(".html") or fn.endswith(".htm"):
        return "text/html"
    if fn.endswith(".json"):
        return "application/json"
    if fn.endswith(".csv") or fn.endswith(".tsv"):
        return "text/csv"
    if fn.endswith(".xml"):
        return "application/xml"
    if fn.endswith(".txt") or fn.endswith(".log") or fn.endswith(".rst"):
        return "text/plain"
    return "application/octet-stream"


@router.get("/{document_id}/file")
async def get_document_file(
    workspace_id: UUID,
    document_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> FileResponse:
    await assert_workspace_member(db, workspace_id, user_id)
    doc = await db.get(Document, document_id)
    if doc is None or doc.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Document not found")
    abs_path = Path(settings.upload_dir) / doc.storage_path
    if not abs_path.is_file():
        raise HTTPException(status_code=404, detail="File not found on disk")
    media = _response_media_type(doc)
    return FileResponse(
        abs_path,
        media_type=media,
        filename=doc.original_filename,
        content_disposition_type="inline",
    )


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
    if not _upload_allowed(file.filename, file.content_type):
        raise HTTPException(
            status_code=415,
            detail=(
                "Unsupported file type. Allowed: PDF, and text-friendly types "
                "(txt, md, csv, json, html, xml, log, rst, tsv)."
            ),
        )
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
    chk = await db.execute(
        text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = 'document_chunks'"
        )
    )
    if chk.first() is not None:
        await db.execute(
            text(
                "DELETE FROM document_chunks WHERE document_id = CAST(:did AS uuid)"
            ),
            {"did": str(document_id)},
        )
    await db.delete(doc)
    await db.commit()
    if abs_path.is_file():
        abs_path.unlink()
