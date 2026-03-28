# API overview

Public HTTP entry (via NGINX): **`/api/*`** → **gateway service** (prefix stripped).

## Current (Milestone 0)

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| GET | `/health` | All services | Liveness; JSON `HealthResponse` |

## Planned surface (evolving)

- **`/v1/auth/*`** — register, login, refresh, workspace membership checks (gateway → auth service)  
- **`/v1/workspaces/*`** — workspace CRUD and membership  
- **`/v1/workspaces/{id}/documents/*`** — upload, list, status (gateway → ingestion)  
- **`/v1/workspaces/{id}/query`** — ask question; gateway orchestrates retrieval + LLM  

OpenAPI: each FastAPI app exposes `/docs` on its **direct** port during development; the gateway will aggregate or proxy documented contracts in a later milestone.
