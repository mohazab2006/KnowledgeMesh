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
