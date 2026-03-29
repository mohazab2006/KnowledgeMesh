from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import assert_workspace_member, get_current_user_id
from app.core.mmr import mmr_select, parse_pgvector_text
from app.db.session import get_db
from app.schemas.search import RetrievedChunkOut, SearchRequest, SearchResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(str(float(x)) for x in values) + "]"


async def _embed_query(client: AsyncOpenAI, q: str) -> list[float]:
    resp = await client.embeddings.create(
        model=settings.embedding_model,
        input=[q],
        dimensions=settings.embedding_dimensions,
    )
    row = sorted(resp.data, key=lambda d: d.index)[0]
    return list(row.embedding)


def _row_to_chunk(row: dict) -> RetrievedChunkOut:
    content = str(row["content"])
    if len(content) > settings.max_chunk_chars:
        content = content[: settings.max_chunk_chars] + "…"
    return RetrievedChunkOut(
        chunk_id=row["chunk_id"],
        document_id=row["document_id"],
        chunk_index=int(row["chunk_index"]),
        document_title=str(row["document_title"]),
        content=content,
        distance=float(row["distance"]),
    )


@router.post("/search", response_model=SearchResponse)
async def search_workspace_chunks(
    workspace_id: UUID,
    body: SearchRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> SearchResponse:
    await assert_workspace_member(db, workspace_id, user_id)
    if not settings.openai_api_key.strip():
        raise HTTPException(
            status_code=503,
            detail="Retrieval is not configured (missing OPENAI_API_KEY for query embeddings).",
        )
    top_k = body.top_k or settings.default_top_k
    top_k = min(top_k, settings.max_top_k)
    use_mmr = (
        settings.mmr_enabled if body.use_mmr is None else bool(body.use_mmr)
    )

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        vec = await _embed_query(client, body.query)
    except Exception as e:
        logger.exception("query embedding failed")
        raise HTTPException(status_code=502, detail=f"Embedding failed: {e!s}") from e

    if len(vec) != settings.embedding_dimensions:
        raise HTTPException(status_code=500, detail="Unexpected embedding size")

    vlit = _vector_literal(vec)
    lim = top_k
    emb_select = ""
    if use_mmr:
        lim = min(
            top_k * max(2, settings.mmr_candidate_multiplier),
            settings.mmr_max_candidates,
        )
        emb_select = ", c.embedding::text AS emb_text"

    sql = text(
        f"""
        SELECT c.id AS chunk_id,
               c.document_id,
               c.chunk_index,
               d.original_filename AS document_title,
               c.content,
               (c.embedding <=> CAST(:vec AS vector)) AS distance
               {emb_select}
        FROM document_chunks c
        JOIN documents d ON d.id = c.document_id
        WHERE c.workspace_id = CAST(:wid AS uuid)
        ORDER BY c.embedding <=> CAST(:vec AS vector)
        LIMIT :lim
        """
    )
    result = await db.execute(
        sql,
        {"vec": vlit, "wid": str(workspace_id), "lim": lim},
    )
    raw_rows = result.mappings().all()

    if not use_mmr or not raw_rows:
        chunks: list[RetrievedChunkOut] = []
        for row in raw_rows:
            chunks.append(_row_to_chunk(dict(row)))
        return SearchResponse(chunks=chunks)

    mmr_rows: list[tuple[RetrievedChunkOut, list[float]]] = []
    for row in raw_rows:
        r = dict(row)
        try:
            emb = parse_pgvector_text(str(r.pop("emb_text")))
        except (ValueError, TypeError) as e:
            logger.warning("skip chunk %s: bad embedding text: %s", r.get("chunk_id"), e)
            continue
        if len(emb) != settings.embedding_dimensions:
            continue
        mmr_rows.append((_row_to_chunk(r), emb))

    if not mmr_rows:
        chunks = [_row_to_chunk(dict(r)) for r in raw_rows][:top_k]
        return SearchResponse(chunks=chunks)

    if len(mmr_rows) <= top_k:
        chunks = [c for c, _ in mmr_rows]
    else:
        chunks = mmr_select(vec, mmr_rows, top_k, settings.mmr_lambda)

    return SearchResponse(chunks=chunks)
