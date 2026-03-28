from __future__ import annotations

from pathlib import Path

from pypdf import PdfReader


def guess_kind(filename: str, content_type: str | None) -> str:
    fn = filename.lower()
    ct = (content_type or "").lower()
    if "pdf" in ct:
        return "pdf"
    if any(x in ct for x in ("text/", "json", "markdown", "csv")):
        return "text"
    if fn.endswith(".pdf"):
        return "pdf"
    if fn.endswith((".txt", ".md", ".csv", ".json", ".log")):
        return "text"
    return "unknown"


def extract_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n\n".join(parts).strip()


def extract_text_from_file(
    path: Path, filename: str, content_type: str | None
) -> str:
    kind = guess_kind(filename, content_type)
    if kind == "pdf":
        return extract_pdf(path)
    if kind == "text":
        return path.read_text(encoding="utf-8", errors="replace")
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError as e:
        raise ValueError(f"cannot read file as text ({kind}): {e}") from e
