from __future__ import annotations

import math
import re

from app.schemas.search import RetrievedChunkOut

_VEC_RE = re.compile(r"^\s*\[(.*)\]\s*$", re.DOTALL)


def parse_pgvector_text(raw: str) -> list[float]:
    """Parse PostgreSQL vector::text like '[0.1,0.2,...]'."""
    s = raw.strip()
    m = _VEC_RE.match(s)
    if not m:
        raise ValueError("invalid vector text")
    inner = m.group(1).strip()
    if not inner:
        return []
    parts = [p.strip() for p in inner.split(",")]
    return [float(p) for p in parts]


def cosine_sim(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na < 1e-12 or nb < 1e-12:
        return 0.0
    return dot / (na * nb)


def mmr_select(
    query_vec: list[float],
    rows: list[tuple[RetrievedChunkOut, list[float]]],
    top_k: int,
    lambda_mult: float,
) -> list[RetrievedChunkOut]:
    """Maximal Marginal Relevance over embedding vectors."""
    if top_k <= 0 or not rows:
        return []
    lam = min(1.0, max(0.0, lambda_mult))
    remaining: list[tuple[RetrievedChunkOut, list[float]]] = list(rows)
    selected: list[RetrievedChunkOut] = []
    selected_embs: list[list[float]] = []

    while len(selected) < top_k and remaining:
        best_i = -1
        best_score = -1e9
        for i, (chunk, emb) in enumerate(remaining):
            rel = cosine_sim(query_vec, emb)
            if not selected_embs:
                div = 0.0
            else:
                div = max(cosine_sim(emb, s) for s in selected_embs)
            score = lam * rel - (1.0 - lam) * div
            if score > best_score:
                best_score = score
                best_i = i
        ch, emb = remaining.pop(best_i)
        selected.append(ch)
        selected_embs.append(emb)
    return selected
