# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 4 — Async ingestion pipeline** (next)

Milestone 3 is **done**: **`documents`** metadata + file storage, **ingestion-service** (upload/list/detail, Redis enqueue stub), **gateway** document path routing, **Documents** UI wired to the API.

## M4 goals

- **Worker** consumes **`km:ingestion:jobs`** (or configured queue name)  
- **Pipeline:** extract text, chunk, embed, write **pgvector** rows; update document status  
- **Retries / failure** paths surfaced in UI status

## Rules (project)

- README is a **short product + stack** summary; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M4 is complete

Update this file to **MILESTONE 5**, summarize work, and give a commit message. Then implement retrieval + RAG query per `docs/milestones.md`.
