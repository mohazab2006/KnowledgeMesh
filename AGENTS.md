# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 3 — Document management + upload** (next)

Milestone 2 is **done**: auth service (users, workspaces, JWT), gateway proxy, protected app shell, workspace switcher + create flow.

## M3 goals

- **Document** models (metadata, processing state) in Postgres  
- **Ingestion service:** upload/register endpoint, persist metadata, enqueue job stub  
- **Frontend:** real upload UX, document list from API, status badges  
- **Gateway:** route document APIs to ingestion (keep auth paths proxied as today)

## Rules (project)

- README is a **short product + stack** summary; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M3 is complete

Update this file to **MILESTONE 4**, summarize work, and give a commit message. Then build the async ingestion pipeline per `docs/milestones.md`.
