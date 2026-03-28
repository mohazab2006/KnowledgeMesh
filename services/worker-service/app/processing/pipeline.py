from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy import delete

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.document_chunk import DocumentChunk
from app.models.document_ref import Document
from app.processing.chunk_text import chunk_text
from app.processing.extract import extract_text_from_file

logger = logging.getLogger(__name__)


async def _embed_all(client: AsyncOpenAI, chunks: list[str]) -> list[list[float]]:
    result: list[list[float]] = []
    batch_size = 32
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        last_err: Exception | None = None
        for attempt in range(settings.openai_max_retries):
            try:
                resp = await client.embeddings.create(
                    model=settings.embedding_model,
                    input=batch,
                    dimensions=settings.embedding_dimensions,
                )
                ordered = sorted(resp.data, key=lambda d: d.index)
                for row in ordered:
                    result.append(list(row.embedding))
                break
            except Exception as e:
                last_err = e
                await asyncio.sleep(min(8.0, 2.0**attempt))
        else:
            if last_err is not None:
                raise last_err
            raise RuntimeError("embedding failed with no error")
    return result


async def _mark_failed(doc_id: UUID, message: str) -> None:
    async with AsyncSessionLocal() as session:
        doc = await session.get(Document, doc_id)
        if doc:
            doc.status = "failed"
            doc.error_message = message[:2000]
            await session.commit()


async def process_ingestion_job(payload: dict) -> None:
    doc_id = UUID(payload["document_id"])
    ws = UUID(payload["workspace_id"])

    async with AsyncSessionLocal() as session:
        doc = await session.get(Document, doc_id)
        if doc is None or doc.workspace_id != ws:
            logger.warning("skip job: doc %s missing or workspace mismatch", doc_id)
            return
        if doc.status not in ("queued", "uploaded"):
            logger.info("skip job: doc %s status=%s", doc_id, doc.status)
            return
        storage_path = doc.storage_path
        filename = doc.original_filename
        content_type = doc.content_type
        doc.status = "processing"
        doc.error_message = None
        await session.commit()

    file_path = Path(settings.upload_dir) / storage_path

    try:
        if not settings.openai_api_key.strip():
            raise RuntimeError("OPENAI_API_KEY is not set")
        if not file_path.is_file():
            raise FileNotFoundError(f"missing file {file_path}")

        text_content = await asyncio.to_thread(
            extract_text_from_file, file_path, filename, content_type
        )
        chunks = chunk_text(
            text_content,
            max_chars=settings.chunk_size,
            overlap=settings.chunk_overlap,
        )

        if not chunks:
            async with AsyncSessionLocal() as session:
                await session.execute(
                    delete(DocumentChunk).where(DocumentChunk.document_id == doc_id)
                )
                doc = await session.get(Document, doc_id)
                if doc:
                    doc.status = "indexed"
                    doc.error_message = None
                    await session.commit()
            return

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        embeddings = await _embed_all(client, chunks)

        async with AsyncSessionLocal() as session:
            await session.execute(
                delete(DocumentChunk).where(DocumentChunk.document_id == doc_id)
            )
            doc = await session.get(Document, doc_id)
            if not doc:
                return
            for i, (content, emb) in enumerate(zip(chunks, embeddings, strict=True)):
                session.add(
                    DocumentChunk(
                        document_id=doc_id,
                        workspace_id=ws,
                        chunk_index=i,
                        content=content,
                        embedding=emb,
                    )
                )
            doc.status = "indexed"
            doc.error_message = None
            await session.commit()

    except Exception as exc:
        logger.exception("ingestion failed for %s", doc_id)
        await _mark_failed(doc_id, str(exc))
