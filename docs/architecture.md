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
- **Gateway → retrieval-service** for **`POST /v1/workspaces/{id}/search`** (internal; user-facing **`POST /v1/workspaces/{id}/query`** orchestrates retrieval then LLM).  
- **Gateway → llm-service** for **`POST /v1/rag/complete`** and **`POST /v1/rag/complete/stream`** (internal; trust boundary is the Docker network).  
- **Local dev:** `next dev` rewrites **`/api/*`** to the gateway so the UI can use relative `/api` URLs without CORS.  

## Data stores

| Store | Role |
|-------|------|
| **PostgreSQL + pgvector** | Users, workspaces, documents, chunks, vectors, sessions (evolving schema) |
| **Redis** | Ingestion job queue (`LPUSH` / worker `BRPOP`) |

## Service communication

- **Synchronous HTTP** from gateway to backend services for request/response paths.  
- **RAG query:** gateway calls **retrieval** (query embedding + pgvector similarity over **`document_chunks`**, optional **MMR** rerank, JWT forwarded) then **llm** (chat completion with JSON **`answer`** + **`cited_indices`**, or **SSE** stream with the same contract at end), merges **citation metadata** for the client. **NGINX** disables **`proxy_buffering`** on **`/api/`** so **SSE** reaches browsers promptly.  
- **Asynchronous** ingestion via **Redis** (`LPUSH` in ingestion, **`BRPOP`** in worker): worker reads files from shared **`UPLOAD_DIR`**, writes **`document_chunks`** with **`pgvector`** embeddings (`text-embedding-3-small`, 1536-d), updates **`documents.status`**.  
- **No shared in-memory state** between API replicas; coordination goes through Postgres/Redis.  

## Docker Compose orchestration

- **Order:** **Postgres** and **Redis** become healthy first. **auth-service**, **llm-service**, and **retrieval-service** start and pass **`GET /health`**. **ingestion-service** waits for **auth** (DB migrations / shared schema expectations). **worker-service** waits for **ingestion** healthy (upload volume and queue contract). **gateway-service** waits for **auth**, **ingestion**, **retrieval**, and **llm** healthy. **frontend** waits for **gateway** healthy; **NGINX** waits for **frontend** and **gateway** healthy.
- **NGINX** config lives at **`infra/nginx/nginx.conf`** (comments describe **`/api/`** vs **`/`** and upload size).
- **Volumes:** **`pgdata`** (database), **`ingestion_uploads`** (ingestion read/write, worker read-only).

## Health and configuration

Each FastAPI service exposes **`GET /health`** (ingestion returns a small JSON shape consistent with the others). Docker healthchecks call **`http://127.0.0.1:8000/health`** inside each container; the **frontend** image uses **Node `fetch`** against port **3000**. Configuration uses **environment variables** (see **`.env.example`**); secrets stay out of Git.

## Local Python development (single service)

From the repo root, set `PYTHONPATH` to include the repo and the service directory so both `shared` and `app` resolve—for example:

`PYTHONPATH=<repo_root>;<repo_root>/services/gateway-service`

Then run Uvicorn with working directory `services/gateway-service` and module `app.main:app`.

## Security

- **JWT (HS256):** Gateway forwards **`Authorization`** to auth-backed routes; ingestion, retrieval, and orchestrated query paths validate the token and **workspace membership** in service code.  
- **Workspace isolation** is enforced in SQL / vector queries, not only in the UI.  
- **Internal-only** URLs (**`RETRIEVAL_SERVICE_URL`**, **`LLM_SERVICE_URL`**) are reachable on the Docker network; do not expose them on public interfaces without an additional control plane.  
- **Least privilege** DB roles per service are a future hardening step for production deployments.  

## Related docs

[`decisions.md`](decisions.md) — ADRs. [`milestones.md`](milestones.md) — delivery phase index.
