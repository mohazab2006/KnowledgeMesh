# Milestones

| # | Name | Status | Summary |
|---|------|--------|---------|
| 0 | Foundation | **Complete** | Monorepo layout, Next.js app, FastAPI service stubs, shared health schema, Docker Compose + NGINX skeleton, README and docs |
| 1 | Design system + UI foundation | Planned | App shell, sidebar, dashboard layout, auth pages UI, primitives (buttons, inputs, cards, tables, badges) |
| 2 | Auth + workspace domain | Planned | Auth service implementation, JWT, workspace CRUD/membership, protected routes |
| 3 | Document management + upload | Planned | Models, upload API, list/detail UI, status badges, job registration |
| 4 | Async ingestion pipeline | Planned | Redis queue, worker extraction/chunking/embedding, pgvector persistence, retries |
| 5 | Retrieval + RAG query flow | Planned | Retrieval + LLM integration, citations, query UI |
| 6 | UX polish + performance | Planned | Loading/error/empty states, cache where useful, responsive polish |
| 7 | Infra polish + docs | Planned | Finalize Compose/NGINX/env, showcase-ready documentation |
| 8 | Optional advanced | Backlog | Streaming, reranking, Ollama, analytics, admin |

## Milestone 0 — decisions

- **Docker build context** is the repository root for Python services so `shared/` is copied without publishing a package yet.  
- **NGINX** listens on host port **8080** by default to avoid clashing with local port 80.  
- **Next.js `output: "standalone"`** enables a small production image for `frontend`.  
- **pgvector/pgvector:pg16** image used for Postgres to align embedding storage with production expectations.  

## Next up

**Milestone 1:** Premium minimal UI foundation—layout system, design tokens via Tailwind, reusable primitives, auth and dashboard shells (no full backend auth yet unless explicitly pulled forward).
