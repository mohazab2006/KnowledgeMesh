# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 7 — Infra polish + docs** (next)

Milestone 6 is **done**: shared **`PageHeader`**, **`Skeleton`**, consistent **loading / error / retry** on dashboard metrics, documents, and query; **sidebar icons** and active states; **card** depth and subtle **page background**; **main** max width; sticky header shows **workspace** on primary routes (no duplicate titles with page headers); **Refresh** on documents; query **overlay** while running.

Milestone 5 is **done**: **gateway** **`POST /v1/workspaces/{id}/query`** orchestrates retrieval + LLM; Query UI wired.

## M7 goals

- Finalize **Compose / NGINX / env** documentation and demo readiness  
- **Showcase-ready** README and architecture notes where gaps remain  

## Rules (project)

- README is a **short product + stack** summary; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M7 is complete

Update this file to **MILESTONE 8** (optional advanced backlog) or keep M7 closed; summarize work, commit, push.
