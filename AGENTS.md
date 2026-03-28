# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 8 — Optional advanced** (backlog / pick items as needed)

Milestone 7 is **done**: **Compose** health-gated startup (**`x-fastapi-healthcheck`**, frontend + NGINX probes, **`depends_on: service_healthy`**); **`infra/nginx/nginx.conf`** documented; **`.env.example`** and **`docs/how-to-run.md`** tightened; **README**, **`docs/architecture.md`**, **`docs/repository-structure.md`**, **`docs/api-overview.md`** aligned for showcase review.

Milestone 6 is **done**: **PageHeader**, **Skeleton**, loading/error patterns, sidebar polish, query overlay.

Milestone 5 is **done**: gateway **`POST /v1/workspaces/{id}/query`**, retrieval + LLM, Query UI.

## M8 direction (when you choose to implement)

- Streaming answers, reranking, optional **Ollama** / local LLM path  
- Query **analytics**, admin surfaces, stronger **DB least-privilege** per service  

## Rules (project)

- README is a **short product + stack** summary; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M8 items ship

Update `docs/milestones.md` and this file; summarize, commit, push.
