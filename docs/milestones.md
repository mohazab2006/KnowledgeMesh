# Milestones

| # | Name | Status | Summary |
|---|------|--------|---------|
| 0 | Foundation | **Complete** | Monorepo layout, Next.js app, FastAPI service stubs, shared health schema, Docker Compose + NGINX skeleton, README and docs |
| 1 | Design system + UI foundation | **Complete** | App shell (sidebar + header), Tailwind tokens, UI primitives, auth pages UI, dashboard/documents/query layouts, empty/loading/error patterns |
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

## Milestone 1 — decisions

- **Tailwind v4 `@theme inline`** maps CSS variables (`--background`, `--foreground`, `--radius-*`, etc.) to utilities for a single source of truth.  
- **`clsx` + `tailwind-merge` + `class-variance-authority`** back composable primitives without adopting a full component library.  
- **`@radix-ui/react-slot`** enables `Button asChild` for accessible link-styled actions.  
- **Route groups:** `(marketing)/`, `(auth)/`, `(app)/` separate layouts without polluting URLs.  
- **Mobile navigation:** CSS transform + backdrop; menu closes via nav link `onClick` (no route-sync effect to satisfy React 19 lint rules).

## Next up

**Milestone 2:** Auth service, JWT, workspace domain, frontend integration, protected routes.
