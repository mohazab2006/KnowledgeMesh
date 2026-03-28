# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 6 — UX polish + performance** (next)

Milestone 5 is **done**: **gateway** **`POST /v1/workspaces/{id}/query`** orchestrates **retrieval-service** (**OpenAI** query embed + **pgvector** similarity on **`document_chunks`**, JWT + workspace membership) and **llm-service** (**JSON** answer + **`cited_indices`**); **Query** UI calls the gateway with the active workspace.

## M6 goals

- Tighten **loading / error / empty** patterns across app routes  
- **Caching** or deduplication where it helps (e.g. dashboard stats, read-only lists)  
- **Responsive** and visual polish where still rough  

## Rules (project)

- README is a **short product + stack** summary; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M6 is complete

Update this file to **MILESTONE 7**, summarize work, and give a commit message. Then infra/docs polish per `docs/milestones.md`.
