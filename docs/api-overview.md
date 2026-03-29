# API overview

Public HTTP entry (via NGINX): **`/api/*`** → **gateway service** (prefix stripped). Local Next.js dev uses **`/api/*` rewrites** to the gateway (see `GATEWAY_INTERNAL_URL` in `.env.example`).

## Public API (current)

| Method | Path | Routed to | Description |
|--------|------|-----------|-------------|
| GET | `/health` | Gateway, Auth, … | Liveness (`HealthResponse`) |
| POST | `/v1/auth/register` | Auth (via gateway) | Create user, default **Personal** workspace, JWT |
| POST | `/v1/auth/login` | Auth | Email/password → JWT |
| POST | `/v1/auth/forgot-password` | Auth | Request reset; email if SMTP configured, else optional `dev_reset_token` when enabled |
| POST | `/v1/auth/reset-password` | Auth | Body `{ token, new_password }` — consumes one-time token |
| GET | `/v1/auth/me` | Auth | Current user (Bearer JWT) |
| GET | `/v1/workspaces` | Auth | List workspaces for caller |
| POST | `/v1/workspaces` | Auth | Create workspace (caller = owner) |
| GET | `/v1/workspaces/{id}` | Auth | Workspace detail if member |
| GET | `/v1/workspaces/{id}/documents` | Ingestion (via gateway) | List documents in workspace |
| GET | `/v1/workspaces/{id}/documents/stats` | Ingestion (via gateway) | Workspace document aggregates (`indexed_count`, `processing_count`, `queries_24h` rolling 24h) |
| POST | `/v1/workspaces/{id}/documents` | Ingestion (via gateway) | Multipart upload (`file` field); allowed types: PDF + text-friendly formats (see ingestion); enqueues Redis job |
| GET | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Document metadata |
| GET | `/v1/workspaces/{id}/documents/{document_id}/file` | Ingestion (via gateway) | Stream original bytes (`Content-Disposition: inline`; member only) |
| DELETE | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Remove row + stored file (member only) |
| POST | `/v1/workspaces/{id}/query` | **Gateway** (native route) | RAG: retrieval search + LLM; JSON `{ "query", "top_k?", "use_mmr?" }` → `{ answer, citations[], chunks_retrieved }` (Bearer JWT) |
| POST | `/v1/workspaces/{id}/query/stream` | **Gateway** (native route) | Same body as **`/query`**; **SSE** (`text/event-stream`): optional **`meta`** (`chunks_retrieved`), **`delta`** (JSON token fragments), **`done`** (`answer`, `citations`), or **`error`** |
| GET | `/v1/diagnostics` | **Gateway** (native route) | After **`GET /v1/auth/me`** succeeds: parallel **`/health`** probes on upstream services (Bearer JWT) |

**Internal (not for browsers directly):** **`POST /v1/workspaces/{id}/search`** on **retrieval-service** (gateway forwards JWT). **`POST /v1/rag/complete`** and **`POST /v1/rag/complete/stream`** on **llm-service** (gateway only, Docker network). **`POST /v1/workspaces/{id}/documents/query-events`** on **ingestion** (gateway calls after each query or stream completes; same JWT).

**Data:** Postgres **`document_chunks`** stores text + **`pgvector`** embeddings; **retrieval-service** reads them (optional **MMR** rerank).

OpenAPI: hit **`/docs`** on each service’s **direct** port during development; the gateway **proxies** paths to auth and ingestion without merging OpenAPI.
