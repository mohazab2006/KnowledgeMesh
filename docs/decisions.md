# Architectural decisions

Format: short ADR-style entries. New decisions are appended with a date.

---

### ADR-001 — Monorepo with root Docker context for Python (2026-03-28)

**Context:** Multiple Python services need identical health contracts and will share Pydantic schemas.  
**Decision:** Keep one repo; build each service image with `context: .` and copy `shared/` into `PYTHONPATH`.  
**Consequences:** Slightly larger build context; avoids premature packaging of `shared` as a private wheel. Revisit `pip install -e` or a small internal package if publishing or versioning shared code becomes painful.

---

### ADR-002 — NGINX path routing for single origin (2026-03-28)

**Context:** The browser should talk to one host/port for UI and API to simplify cookies, CORS, and demos.  
**Decision:** NGINX serves `/` → frontend and `/api/` → gateway with prefix strip.  
**Consequences:** Gateway routes must not assume a leading `/api` unless re-added by middleware; document for future contributors.

---

### ADR-003 — FastAPI per service from Milestone 0 (2026-03-28)

**Context:** Resume and interview narrative need visible service boundaries.  
**Decision:** Six Python services each run a minimal FastAPI app with `/health` only until features land.  
**Consequences:** Some duplication of bootstrap code; acceptable until a shared `create_app` factory earns its keep.

---

### ADR-004 — Frontend design tokens without a component library (2026-03-28)

**Context:** The UI must look premium and stay consistent across many screens; importing a heavy UI kit can obscure portfolio authorship.  
**Decision:** Use Tailwind CSS v4 theme tokens (CSS variables + `@theme inline`) and small local primitives in `frontend/src/components/ui/`.  
**Consequences:** We own accessibility and API surface area; Radix is used only where it clearly helps (`Slot` for polymorphic `Button`). Revisit shadcn-style full primitives if velocity drops.

---

### ADR-005 — Gateway proxies auth paths (2026-03-28)

**Context:** The browser should call one public API origin; auth is a separate deployable today and other `/v1` routes will land on other services later.  
**Decision:** Implement **path-scoped reverse proxy** in the gateway (`/v1/auth/*`, `/v1/workspaces/*` → auth service) using **httpx**, preserving method, body, and `Authorization`.  
**Consequences:** Gateway stays thin; OpenAPI is not merged yet. Order-dependent routes must stay explicit as more prefixes are added.

---

### ADR-006 — localStorage bearer token for SPA auth (Milestone 2) (2026-03-28)

**Context:** Protected UI routes need credentials without introducing Next.js cookie plumbing in the same milestone as backend auth.  
**Decision:** Store **JWT** in **`localStorage`** and send `Authorization: Bearer` on API calls; **`AuthGate`** handles client-side protection.  
**Consequences:** XSS can exfiltrate tokens; document move to **httpOnly** cookies or BFF pattern in a hardening milestone.

---

### ADR-007 — No credential defaults in tracked Compose or config (2026-03-28)

**Context:** Secret scanners (e.g. GitGuardian) flag **default passwords** and **JWT placeholders** committed in `docker-compose.yml`, `.env.example`, or Python defaults.  
**Decision:** Require **`POSTGRES_*`**, **`JWT_SECRET`**, and **`DATABASE_URL`** via a **local `.env`** (gitignored). Compose uses `${VAR:?message}` where substitution is needed; **`.env.example` uses empty values** and comments only. Auth **Settings** has **no default** for `database_url` or `jwt_secret`.  
**Consequences:** `docker compose up` fails until `.env` exists; developers copy `.env.example` and fill secrets. **If secrets were ever pushed, rotate them** and consider **history rewrite** (`git filter-repo` / BFG) because scanners and clones may still see old commits. See troubleshooting in [`how-to-run.md`](how-to-run.md).

---

### ADR-008 — Ingestion owns documents; gateway path split (Milestone 3) (2026-03-28)

**Context:** Workspace-scoped uploads need persistence and a queue hand-off without folding file I/O into the auth service.  
**Decision:** Add **ingestion-service** with **`documents`** rows + on-disk files under **`UPLOAD_DIR`**, **JWT + membership** checks aligned with auth, **Redis** enqueue for a future worker. The **gateway** proxies **`/v1/workspaces/{id}/documents*`** to ingestion and keeps **`/v1/workspaces`** (non-document paths) on auth; **document routes are registered before** the workspace catch-all.  
**Consequences:** Two services touch “workspace” URLs; ordering in the gateway must stay correct. File storage uses a named Docker volume in Compose; NGINX raises upload size on **`/api/`**.

---

### ADR-009 — Worker owns chunk rows and embedding writes (Milestone 4) (2026-03-28)

**Context:** Uploads must become searchable vectors without blocking the ingestion HTTP path.  
**Decision:** **worker-service** consumes **Redis** jobs, reads the shared **upload volume**, extracts text (**pypdf** / UTF-8), chunks, calls **OpenAI embeddings**, and inserts **`document_chunks`** with **pgvector** columns; **`documents.status`** transitions **`processing` → `indexed`** (or **`failed`**). **Ingestion** deletes matching chunk rows on document delete when the table exists.  
**Consequences:** **`OPENAI_API_KEY`** is required for successful indexing; worker and ingestion share **Postgres** and **uploads** but not code; embedding model/dimension are env-tunable and must stay aligned with the **`vector(n)`** column.

---

### ADR-010 — Gateway-orchestrated RAG (Milestone 5) (2026-03-28)

**Context:** Users need a single authenticated workspace query that combines vector retrieval and grounded generation without collapsing services into one binary.  
**Decision:** **`POST /v1/workspaces/{id}/query`** is implemented **on the gateway**: it forwards **`Authorization`** to **retrieval-service** **`POST .../search`** (OpenAI query embedding + pgvector `<=>` over **`document_chunks`** joined to **`documents`** for titles), then calls **llm-service** **`POST /v1/rag/complete`** with retrieved chunks (no end-user JWT on llm; internal HTTP only). Response merges **relevance distance** from retrieval into citations.  
**Consequences:** Gateway must start after retrieval and llm in Compose; **`RETRIEVAL_SERVICE_URL`** / **`LLM_SERVICE_URL`** required; query and index embedding **model + dimension** must stay aligned. LLM is not exposed as a public authenticated surface—only the gateway calls it.

---

### ADR-011 — Password reset tokens + optional SMTP (2026-03-28)

**Context:** Users need to recover access without database surgery; email is the standard channel but local dev often has no mail server.  
**Decision:** **`password_reset_tokens`** table stores **SHA-256** of a random token, **`POST /v1/auth/forgot-password`** always returns the same generic message shape, **`POST /v1/auth/reset-password`** consumes the token. **Optional SMTP** (`SMTP_*` + **`FRONTEND_PUBLIC_URL`**) sends a link to **`/reset-password?token=`**. When SMTP is unset, **`PASSWORD_RESET_RETURN_TOKEN=true`** may include **`dev_reset_token`** in the JSON response (disabled in production).  
**Consequences:** Dev mode can leak account existence via **`dev_reset_token`** presence—acceptable only when the flag is explicitly on. Operators must set **`PASSWORD_RESET_RETURN_TOKEN=false`** and configure SMTP for real deployments.

---

### ADR-012 — App shell vs page titles (Milestone 6) (2026-03-28)

**Context:** Duplicate headings (“Documents” in the sticky bar and again in the page) cluttered the UI.  
**Decision:** Primary routes (**dashboard**, **documents**, **query**) use **`PageHeader`** for the visible title; the sticky bar shows **active workspace** name + role (and a page title only for **New workspace** and similar routes without a page header).  
**Consequences:** Contributors adding app routes should either use **`PageHeader`** or register a **`headerTitles`** entry in **`app-shell.tsx`**.

---

### ADR-013 — Health-gated Compose startup (Milestone 7) (2026-03-28)

**Context:** On a cold **`docker compose up`**, browsers could hit **NGINX** while the gateway or backends were still booting, producing **502** responses and a poor demo experience.  
**Decision:** Add **Docker healthchecks** to every long-running service (Python **`/health`**, frontend **`fetch`**, NGINX **`wget`**) and set **`depends_on`** with **`condition: service_healthy`** for **gateway** → **frontend** → **nginx** (and gateway’s upstream services). Use a YAML anchor (**`x-fastapi-healthcheck`**) for identical FastAPI probes.  
**Consequences:** First start takes longer until all probes pass; **`start_period`** accommodates slow imports. Changing listen ports inside images requires updating healthcheck URLs.

---

### ADR-014 — Query analytics + gateway limits (Milestone 8 slice) (2026-03-28)

**Context:** Dashboard **`queries_24h`** was a placeholder; abuse of **`POST .../query`** could spike cost.  
**Decision:** **ingestion-service** owns append-only **`workspace_query_events`**; **`GET .../documents/stats`** counts rows in the last 24h. **Gateway** calls **`POST .../documents/query-events`** after each successful RAG response (including empty-chunk “no data” answers) and applies a **per-IP sliding-window** rate limit on **`POST .../query`** only (**`QUERY_RATE_LIMIT_PER_MINUTE`**, default 30). Request logging uses **`gateway.access`** at **INFO** (method, path, status, duration).  
**Consequences:** Analytics require gateway → ingestion path; failed upstream calls are not logged as queries. Rate limits are in-memory (single gateway replica assumption for Compose).
