# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 5 — Retrieval + RAG query flow** (next)

Milestone 4 is **done**: **worker-service** **`BRPOP`** on **`km:ingestion:jobs`**, **PDF** (pypdf) + **text** extraction, character chunking, **OpenAI** embeddings, **`document_chunks`** table + **`vector`** extension, **`documents.status`** → **indexed** / **failed**; Compose mounts **`ingestion_uploads`** read-only on the worker; **`OPENAI_API_KEY`** in `.env`.

## M5 goals

- **Retrieval service** (or gateway path): similarity search over **`document_chunks`** scoped by **workspace**  
- **LLM path** for grounded answers + **citations**  
- **Query** UI wired to real API  

## Rules (project)

- README is a **short product + stack** summary; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M5 is complete

Update this file to **MILESTONE 6**, summarize work, and give a commit message. Then UX polish per `docs/milestones.md`.
