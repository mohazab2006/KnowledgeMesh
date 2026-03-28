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
