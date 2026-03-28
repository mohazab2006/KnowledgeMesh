from __future__ import annotations

import json
import logging
import re

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.rag import (
    RagCitationOut,
    RagCompleteRequest,
    RagCompleteResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

_JSON_FENCE = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)


def _parse_llm_json(raw: str) -> dict:
    raw = raw.strip()
    m = _JSON_FENCE.search(raw)
    if m:
        raw = m.group(1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start >= 0 and end > start:
            return json.loads(raw[start : end + 1])
        raise


@router.post("/complete", response_model=RagCompleteResponse)
async def rag_complete(body: RagCompleteRequest) -> RagCompleteResponse:
    if not settings.openai_api_key.strip():
        raise HTTPException(
            status_code=503,
            detail="LLM service is not configured (missing OPENAI_API_KEY).",
        )

    blocks: list[str] = []
    index_to_chunk: dict[int, RagCitationOut] = {}
    total = 0
    for i, c in enumerate(body.contexts, start=1):
        block = (
            f"[{i}] document={c.document_title!r} "
            f"document_id={c.document_id} chunk_id={c.chunk_id} "
            f"chunk_index={c.chunk_index}\n{c.content}"
        )
        if total + len(block) > settings.max_context_chars:
            break
        blocks.append(block)
        index_to_chunk[i] = RagCitationOut(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            chunk_index=c.chunk_index,
            document_title=c.document_title,
            excerpt=(c.content[:280] + "…") if len(c.content) > 280 else c.content,
        )
        total += len(block)

    context_text = "\n\n".join(blocks)
    system = (
        "You answer using ONLY the numbered CONTEXT passages. "
        "If the context does not contain the answer, say so clearly. "
        "Do not invent facts. "
        "Respond with a single JSON object (no markdown outside JSON) with keys: "
        '`answer` (string, markdown allowed inside the string), '
        '`cited_indices` (array of integers) listing which [n] passages you relied on.'
    )
    user = f"QUESTION:\n{body.question}\n\nCONTEXT:\n{context_text}"

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        resp = await client.chat.completions.create(
            model=settings.chat_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"},
        )
        raw = (resp.choices[0].message.content or "").strip()
        data = _parse_llm_json(raw)
    except Exception as e:
        logger.exception("LLM completion failed")
        raise HTTPException(status_code=502, detail=f"LLM failed: {e!s}") from e

    answer = str(data.get("answer", "")).strip()
    if not answer:
        answer = raw if raw else "No answer produced."

    cited_raw = data.get("cited_indices", [])
    citations: list[RagCitationOut] = []
    if isinstance(cited_raw, list):
        seen: set[str] = set()
        for x in cited_raw:
            try:
                idx = int(x)
            except (TypeError, ValueError):
                continue
            ch = index_to_chunk.get(idx)
            if ch is None:
                continue
            key = str(ch.chunk_id)
            if key in seen:
                continue
            seen.add(key)
            citations.append(ch)

    if not citations and index_to_chunk:
        citations = [index_to_chunk[1]]

    return RagCompleteResponse(answer=answer, citations=citations)
