from __future__ import annotations

import json
import logging
import re
from collections.abc import AsyncIterator

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
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

_SYSTEM = (
    "You answer using ONLY the numbered CONTEXT passages. "
    "If the context does not contain the answer, say so clearly. "
    "Do not invent facts. "
    "Respond with a single JSON object (no markdown outside JSON) with keys: "
    '`answer` (string, markdown allowed inside the string), '
    '`cited_indices` (array of integers) listing which [n] passages you relied on.'
)


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


def _build_context(
    body: RagCompleteRequest,
) -> tuple[str, dict[int, RagCitationOut], str]:
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
    user = f"QUESTION:\n{body.question}\n\nCONTEXT:\n{context_text}"
    return context_text, index_to_chunk, user


def _citations_from_parsed(
    data: dict,
    raw_fallback: str,
    index_to_chunk: dict[int, RagCitationOut],
) -> tuple[str, list[RagCitationOut]]:
    answer = str(data.get("answer", "")).strip()
    if not answer:
        answer = raw_fallback.strip() if raw_fallback else "No answer produced."

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

    return answer, citations


async def _openai_complete_json(user: str) -> tuple[dict, str]:
    if not settings.openai_api_key.strip():
        raise HTTPException(
            status_code=503,
            detail="LLM service is not configured (missing OPENAI_API_KEY).",
        )
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    resp = await client.chat.completions.create(
        model=settings.chat_model,
        messages=[
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
        max_tokens=2048,
        response_format={"type": "json_object"},
    )
    raw = (resp.choices[0].message.content or "").strip()
    return _parse_llm_json(raw), raw


async def _ollama_complete_json(user: str) -> tuple[dict, str]:
    base = settings.ollama_base_url.rstrip("/")
    url = f"{base}/api/chat"
    payload = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": _SYSTEM},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2},
    }
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
    except httpx.HTTPError as e:
        logger.exception("Ollama request failed")
        raise HTTPException(status_code=502, detail=f"Ollama failed: {e!s}") from e
    except Exception as e:
        logger.exception("Ollama request failed")
        raise HTTPException(status_code=502, detail=f"Ollama failed: {e!s}") from e

    raw = (data.get("message") or {}).get("content") or ""
    raw = str(raw).strip()
    try:
        return _parse_llm_json(raw), raw
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned non-JSON: {e!s}",
        ) from e


def _provider() -> str:
    p = (settings.llm_provider or "openai").strip().lower()
    return "ollama" if p == "ollama" else "openai"


@router.post("/complete", response_model=RagCompleteResponse)
async def rag_complete(body: RagCompleteRequest) -> RagCompleteResponse:
    _, index_to_chunk, user = _build_context(body)
    if not index_to_chunk:
        raise HTTPException(status_code=400, detail="No context passages after trimming.")

    try:
        if _provider() == "ollama":
            data, raw = await _ollama_complete_json(user)
        else:
            data, raw = await _openai_complete_json(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("LLM completion failed")
        raise HTTPException(status_code=502, detail=f"LLM failed: {e!s}") from e

    answer, citations = _citations_from_parsed(data, raw, index_to_chunk)
    return RagCompleteResponse(answer=answer, citations=citations)


def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, default=str)}\n\n"


async def _stream_openai(user: str, index_to_chunk: dict[int, RagCitationOut]) -> AsyncIterator[str]:
    if not settings.openai_api_key.strip():
        yield _sse({"type": "error", "detail": "missing OPENAI_API_KEY"})
        return
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        stream = await client.chat.completions.create(
            model=settings.chat_model,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"},
            stream=True,
        )
        accum = ""
        async for event in stream:
            ch = event.choices[0]
            delta = (ch.delta.content or "") if ch.delta else ""
            if delta:
                accum += delta
                yield _sse({"type": "delta", "text": delta})
        data = _parse_llm_json(accum)
        answer, citations = _citations_from_parsed(data, accum, index_to_chunk)
        yield _sse(
            {
                "type": "done",
                "answer": answer,
                "citations": [c.model_dump(mode="json") for c in citations],
            }
        )
    except Exception as e:
        logger.exception("LLM stream failed")
        yield _sse({"type": "error", "detail": str(e)})


async def _stream_ollama_synthetic(
    user: str,
    index_to_chunk: dict[int, RagCitationOut],
) -> AsyncIterator[str]:
    try:
        data, raw = await _ollama_complete_json(user)
    except HTTPException as e:
        d = e.detail
        yield _sse({"type": "error", "detail": d if isinstance(d, str) else str(d)})
        return
    except Exception as e:
        logger.exception("Ollama completion failed")
        yield _sse({"type": "error", "detail": str(e)})
        return

    answer, citations = _citations_from_parsed(data, raw, index_to_chunk)
    step = 48
    for i in range(0, len(answer), step):
        yield _sse({"type": "delta", "text": answer[i : i + step]})
    yield _sse(
        {
            "type": "done",
            "answer": answer,
            "citations": [c.model_dump(mode="json") for c in citations],
        }
    )


@router.post("/complete/stream")
async def rag_complete_stream(body: RagCompleteRequest) -> StreamingResponse:
    _, index_to_chunk, user = _build_context(body)
    if not index_to_chunk:
        async def empty_err() -> AsyncIterator[str]:
            yield _sse({"type": "error", "detail": "No context passages after trimming."})

        return StreamingResponse(empty_err(), media_type="text/event-stream")

    if _provider() == "ollama":
        gen = _stream_ollama_synthetic(user, index_to_chunk)
    else:
        gen = _stream_openai(user, index_to_chunk)

    return StreamingResponse(gen, media_type="text/event-stream")
