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
| POST | `/v1/workspaces/{id}/documents` | Ingestion (via gateway) | Multipart upload (`file` field); enqueues Redis job stub |
| GET | `/v1/workspaces/{id}/documents/{document_id}` | Ingestion (via gateway) | Document metadata |

## Planned (later milestones)

- **`/v1/workspaces/{id}/query`** — RAG query; gateway orchestrates retrieval + LLM  

OpenAPI: hit **`/docs`** on each service’s **direct** port during development; the gateway **proxies** paths to auth and ingestion without merging OpenAPI.
