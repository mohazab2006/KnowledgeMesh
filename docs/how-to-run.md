# How to run KnowledgeMesh

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose v2)

## Start the stack

1. From the **repo root** (where `docker-compose.yml` lives), create `.env`:

   ```bash
   cp .env.example .env
   ```

2. Set **at least**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `JWT_SECRET`.

3. For **indexing and RAG**, set **`OPENAI_API_KEY`**. Without it, the API and UI still run, but documents stay queued or fail embedding and queries cannot complete.

4. Build and start:

   ```bash
   docker compose up --build
   ```

   Use `-d` for detached mode. On Windows PowerShell, chain commands with `;` instead of `&&` if needed.

5. Open **http://localhost:8080** (or the host port you set in **`HTTP_PORT`**).

Compose waits for **Postgres**, **Redis**, and each **FastAPI** service to pass **`GET /health`** before starting **gateway**, **frontend**, and **NGINX**, so the first page load is less likely to hit a cold 502.

## Ports (defaults)

| Port | Service        | Notes                          |
|------|----------------|--------------------------------|
| 8080 | NGINX          | **Primary URL** for the app    |
| 8000 | Gateway        | Direct API (same paths as `/api` without prefix) |
| 8001 | Auth           |                                |
| 8002 | Ingestion      |                                |
| 8003 | Retrieval      |                                |
| 8004 | LLM            |                                |
| 8005 | Worker         |                                |
| 3000 | Next.js        | Direct frontend (bypass NGINX) |
| 5432 | Postgres       |                                |
| 6379 | Redis          |                                |

Override with the `*_PORT` variables in `.env`.

## Stop and reset

- **Stop:** `docker compose down`
- **Stop and wipe DB + uploads volume:** `docker compose down -v`

## Troubleshooting

- **`dependency failed to start`:** Check `docker compose logs <service>` — usually Postgres credentials or a missing required `.env` field.
- **Uploads fail with 413:** NGINX allows **100m** on `/api/`; raise `client_max_body_size` in `infra/nginx/nginx.conf` if you need larger files.
- **Documents stuck queued:** Ensure **worker-service** is up and **`OPENAI_API_KEY`** is set.

## Local frontend dev (without Docker for Next)

Create **`frontend/.env.local`** with `GATEWAY_INTERNAL_URL=http://127.0.0.1:8000` (or your gateway port), run `npm run dev` in `frontend/`, and keep backend services running (Compose or individual Uvicorn processes). See `docs/architecture.md` for `/api` rewrites.
