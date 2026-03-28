# Milestones

| # | Name | Status | Summary |
|---|------|--------|---------|
| 0 | Foundation | **Complete** | Monorepo layout, Next.js app, FastAPI service stubs, shared health schema, Docker Compose + NGINX skeleton, README and docs |
| 1 | Design system + UI foundation | **Complete** | App shell (sidebar + header), Tailwind tokens, UI primitives, auth pages UI, dashboard/documents/query layouts, empty/loading/error patterns |
| 2 | Auth + workspace domain | **Complete** | Auth service + Postgres models, bcrypt + JWT, workspace CRUD/membership, gateway proxy, Next.js auth/workspace context, protected app shell, localStorage token |
| 3 | Document management + upload | **Complete** | `documents` table, ingestion upload/list/detail, Redis enqueue stub, gateway split-routing, Documents UI |
| 4 | Async ingestion pipeline | **Complete** | Worker `BRPOP`, PDF/text extract, chunk, OpenAI embed, `document_chunks` + pgvector, status + errors |
| 5 | Retrieval + RAG query flow | **Complete** | Retrieval pgvector search + LLM JSON citations; gateway **`POST .../query`**; Query UI wired |
| 6 | UX polish + performance | **Complete** | PageHeader + skeletons; retry/error banners; sidebar icons; card/page chrome; query loading overlay; documents refresh |
| 7 | Infra polish + docs | **Complete** | Compose health-gated startup; NGINX + `.env.example` + how-to-run; README/architecture/repo docs aligned |
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

## Milestone 2 — decisions

- **Auth service owns** users, workspaces, and memberships; **gateway reverse-proxies** `/v1/auth/*` and `/v1/workspaces/*` with `httpx` (other `/v1` prefixes reserved for later services).  
- **JWT** is HS256 with shared `JWT_SECRET`; access tokens embed `sub` (user UUID) and `type=access`.  
- **Schema** uses UUID PKs, `workspace_memberships` with `role` (`owner` first), and a **Personal** workspace on every registration.  
- **Frontend** stores the bearer token in **`localStorage`** (`km_access_token`) and active workspace in **`km_workspace_id`**; **`AuthGate`** protects `(app)/` routes.  
- **Next.js** `rewrites()` forwards `/api/*` to the gateway during `next dev` so the browser stays same-origin.

## Milestone 3 — decisions

- **Ingestion service** creates the **`documents`** table (SQLAlchemy `create_all`) with FKs to **`users`** and **`workspaces`**; Compose starts **auth** before **ingestion** so base tables exist.  
- **Authorization** reuses **HS256 JWT** (`sub` = user id); **workspace membership** is checked with a **parameterized SQL** query against **`workspace_memberships`** (no duplicated user/workspace ORM in ingestion).  
- **Files** live under **`UPLOAD_DIR` / `{workspace_id}` / `{document_id}{ext}`**; **Redis** list **`km:ingestion:jobs`** receives a JSON payload for the future worker (Milestone 4).  
- **Gateway** registers **`/v1/workspaces/{id}/documents`** routes **before** the **`/v1/workspaces/{path}`** catch-all so traffic fans out correctly; **httpx** timeout raised for large uploads; **NGINX** **`client_max_body_size 100m`** on **`/api/`**.

## Milestone 4 — decisions

- **worker-service** runs a background **`asyncio`** loop alongside FastAPI **`/health`**: **`redis.asyncio` `BRPOP`** on **`INGESTION_QUEUE_NAME`** (default **`km:ingestion:jobs`**), same JSON payload as ingestion **`LPUSH`**.  
- **Postgres:** `CREATE EXTENSION IF NOT EXISTS vector` on startup; **`document_chunks`** (`id`, `document_id`, `workspace_id`, `chunk_index`, `content`, **`embedding vector(1536)`**) created via SQLAlchemy + **pgvector**; worker uses a slim **`Document`** ORM mapping to the existing **`documents`** table for status updates only.  
- **Files:** **`UPLOAD_DIR`** volume shared with ingestion (**read-only** on worker). **Extraction:** **pypdf** for PDF; UTF-8 text for **`.txt` / `.md` / `.csv` / `.json`** and fallback; **chunking** sliding windows (`chunk_size` / `chunk_overlap` from env). **Embeddings:** **OpenAI** **`text-embedding-3-small`** with **`dimensions=1536`**, batched (32) with retries.  
- **Failures** set **`documents.status=failed`** and **`error_message`** (truncated); empty extract → **indexed** with zero chunks. **Ingestion DELETE** removes **`document_chunks`** rows when that table exists (checks **`information_schema`** so fresh DBs without worker yet still work).

## Next up

**Milestone 8:** Optional advanced backlog (streaming, reranking, Ollama, analytics, admin).

## Milestone 5 — decisions

- **retrieval-service** uses the same **`DATABASE_URL`**, **`JWT_SECRET`**, and **OpenAI** embedding settings as the worker (**`text-embedding-3-small`**, **1536** dimensions) for query vectors; **pgvector** **`<=>`** orders nearest chunks per workspace with a **`documents`** join for filenames.  
- **llm-service** exposes **`POST /v1/rag/complete`** with **`response_format=json_object`**; prompts enumerate context blocks **`[1]…[n]`** and expect **`answer`** + **`cited_indices`**.  
- **gateway** implements **`POST /v1/workspaces/{id}/query`** before the workspace catch-all; **`RETRIEVAL_SERVICE_URL`** and **`LLM_SERVICE_URL`** in Compose.

## Milestone 6 — decisions

- **Page titles** live in route content via **`PageHeader`**; the app shell sticky bar emphasizes **active workspace** (and a title only for routes without a page header, e.g. **New workspace**).  
- **Loading**: **`Skeleton`** for dashboard metrics and document table first paint; **`LoadingState`** for workspace bootstrap; **query** uses an in-card **backdrop + Spinner** while the RAG request runs.  
- **Errors**: **`ErrorState`** + **Try again** on metrics and documents list; query errors are dismissible inline.  
- **Visual**: **`rounded-xl`** cards, light **radial accent** on `body`, **`max-w-6xl`** on main column; sidebar **icons** and **ring** on active nav.

## Milestone 7 — decisions

- **Compose** uses a shared **`x-fastapi-healthcheck`** anchor (**`urllib.request`** to **`/health`**) on Python services plus **Node `fetch`** on **frontend** and **`wget`** on **NGINX**; **gateway** / **frontend** / **nginx** use **`depends_on: condition: service_healthy`** to reduce cold **502**s.  
- **Service order** in the compose file follows dependency layers (data → core APIs → worker parallel to gateway chain → edge).  
- **Documentation:** root **README** is the recruiter-facing product summary; **`.env.example`** and **`docs/how-to-run.md`** carry operator detail; **`infra/nginx/nginx.conf`** documents routing and upload size inline.
