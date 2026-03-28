# Architecture

## Goals

- **Clean boundaries** between ingestion, retrieval, generation, and identity  
- **Real async processing** (queue + worker), not inline embedding on upload  
- **Citation-backed** answers tied to retrieved chunks  
- **Portfolio-grade** clarity: a reviewer can trace data flow end-to-end  

## Monorepo

The repository is a **monorepo**: one Git history, multiple deployable units. Python services share the `shared/` tree via `PYTHONPATH` inside Docker images (build context = repo root). The frontend is an independent Node application under `frontend/`.

## Request paths

- **Browser → NGINX → Next.js** for UI assets and navigation.  
- **Browser → NGINX → `/api/...` → gateway** for API calls; NGINX strips the `/api` prefix when forwarding to the gateway so internal routes stay **`/v1/...`**.  
- **Gateway → auth service** for **`/v1/auth/*`** and **`/v1/workspaces/*`** except the **documents** subtree (HTTP reverse proxy).  
- **Gateway → ingestion service** for **`/v1/workspaces/{id}/documents`** (list, upload, detail); same JWT and membership rules as other workspace APIs.  
- **Retrieval / query / LLM** routes will attach to the gateway the same way as milestones land.  
- **Local dev:** `next dev` rewrites **`/api/*`** to the gateway so the UI can use relative `/api` URLs without CORS.  

## Data stores

| Store | Role |
|-------|------|
| **PostgreSQL + pgvector** | Users, workspaces, documents, chunks, vectors, sessions (evolving schema) |
| **Redis** | Job queue, short-lived cache for repeated retrievals (optional, milestone-driven) |

## Service communication

- **Synchronous HTTP** from gateway to backend services for request/response paths.  
- **Asynchronous** ingestion via **Redis** (`LPUSH` in ingestion, **`BRPOP`** in worker): worker reads files from shared **`UPLOAD_DIR`**, writes **`document_chunks`** with **`pgvector`** embeddings (`text-embedding-3-small`, 1536-d), updates **`documents.status`**.  
- **No shared in-memory state** between API replicas; coordination goes through Postgres/Redis.  

## Health and configuration

Each FastAPI service exposes **`GET /health`** returning a shared **`HealthResponse`** (`status`, `service`) for load balancers and Compose health checks (extended in later milestones). Configuration uses **environment variables** (see root `.env.example`); secrets are never committed.

## Local Python development (single service)

From the repo root, set `PYTHONPATH` to include the repo and the service directory so both `shared` and `app` resolve—for example:

`PYTHONPATH=<repo_root>;<repo_root>/services/gateway-service`

Then run Uvicorn with working directory `services/gateway-service` and module `app.main:app`.

## Security (directional)

- **JWT** validation at gateway and/or services (refined in Milestone 2).  
- **Workspace isolation** enforced in retrieval and ingestion queries, not only in the UI.  
- **Least privilege** DB roles per service as the deployment model matures.  

## Evolution

This document is updated when milestones add persistence, queue names, OpenAPI surfaces, or change routing. See `docs/decisions.md` for rationale on major forks.
