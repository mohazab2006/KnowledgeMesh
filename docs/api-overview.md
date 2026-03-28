# API overview

Public HTTP entry (via NGINX): **`/api/*`** → **gateway service** (prefix stripped). Local Next.js dev uses **`/api/*` rewrites** to the gateway (see `GATEWAY_INTERNAL_URL` in `.env.example`).

## Live (Milestone 2)

| Method | Path | Routed to | Description |
|--------|------|-----------|-------------|
| GET | `/health` | Gateway, Auth, … | Liveness (`HealthResponse`) |
| POST | `/v1/auth/register` | Auth (via gateway) | Create user, default **Personal** workspace, JWT |
| POST | `/v1/auth/login` | Auth | Email/password → JWT |
| GET | `/v1/auth/me` | Auth | Current user (Bearer JWT) |
| GET | `/v1/workspaces` | Auth | List workspaces for caller |
| POST | `/v1/workspaces` | Auth | Create workspace (caller = owner) |
| GET | `/v1/workspaces/{id}` | Auth | Workspace detail if member |
| GET | `/v1/workspaces/{id}/documents` | Ingestion (via gateway) | List documents in workspace |
| GET | `/v1/workspaces/{id}/documents/stats` | Ingestion (via gateway) | Workspace document aggregates (`indexed_count`, `processing_count`; `queries_24h` reserved) |
| POST | `/v1/workspaces/{id}/documents` | Ingestion (via gateway) | Multipart upload (`file` field); allowed types: PDF + text-friendly formats (see ingestion); enqueues Redis job |
| GET | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Document metadata |
| GET | `/v1/workspaces/{id}/documents/{document_id}/file` | Ingestion (via gateway) | Stream original bytes (`Content-Disposition: inline`; member only) |
| DELETE | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Remove row + stored file (member only) |
| POST | `/v1/workspaces/{id}/query` | **Gateway** (native route) | RAG: retrieval search + LLM; JSON body `{ "query", "top_k?" }` → `{ answer, citations[], chunks_retrieved }` (Bearer JWT) |

**Internal (not for browsers directly):** **`POST /v1/workspaces/{id}/search`** on **retrieval-service** (gateway forwards JWT). **`POST /v1/rag/complete`** on **llm-service** (gateway only, Docker network).

**Internal data (Milestone 4):** Postgres **`document_chunks`** holds chunk text and **`pgvector`** embeddings; **Milestone 5** reads them via retrieval-service.

## Planned (later milestones)

- **Query analytics** (e.g. **`queries_24h`**) and optional **streaming** answers  

OpenAPI: hit **`/docs`** on each service’s **direct** port during development; the gateway **proxies** paths to auth and ingestion without merging OpenAPI.
