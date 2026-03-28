def chunk_text(text: str, max_chars: int, overlap: int) -> list[str]:
    t = text.strip()
    if not t:
        return []
    if len(t) <= max_chars:
        return [t]
    step = max(1, max_chars - overlap)
    out: list[str] = []
    i = 0
    n = len(t)
    while i < n:
        piece = t[i : i + max_chars].strip()
        if piece:
            out.append(piece)
        if i + max_chars >= n:
            break
        i += step
    return out
