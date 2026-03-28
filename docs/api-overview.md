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
| POST | `/v1/workspaces/{id}/documents` | Ingestion (via gateway) | Multipart upload (`file` field); allowed types: PDF + text-friendly formats (see ingestion); enqueues Redis job |
| GET | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Document metadata |
| GET | `/v1/workspaces/{id}/documents/{document_id}/file` | Ingestion (via gateway) | Stream original bytes (`Content-Disposition: inline`; member only) |
| DELETE | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Remove row + stored file (member only) |

**Internal data (Milestone 4):** Postgres table **`document_chunks`** holds chunk text and **`pgvector`** embeddings per workspace/document; populated by **worker-service**, queried in **Milestone 5** retrieval—not a public HTTP resource yet.

## Planned (later milestones)

- **`/v1/workspaces/{id}/query`** — RAG query; gateway orchestrates retrieval + LLM  

OpenAPI: hit **`/docs`** on each service’s **direct** port during development; the gateway **proxies** paths to auth and ingestion without merging OpenAPI.
