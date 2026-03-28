# KnowledgeMesh — agent brief

## Current milestone

**MILESTONE 1 — Design system + UI foundation** (next)

Milestone 0 is **done**: monorepo, frontend scaffold, service stubs, Docker Compose + NGINX, docs, README.

## M1 goals

- Premium minimal **app shell** (layout, sidebar, top nav)
- **Dashboard** layout structure (placeholder content OK)
- **Auth pages UI** (sign in / sign up — can be non-functional until M2)
- Reusable primitives: **buttons, inputs, cards, tables, badges**
- Tailwind-based **design tokens** (radius, spacing, typography rhythm)
- Solid **empty**, **loading**, and **error** patterns (at least stubs)

## Rules (project)

- README is a **short product + stack** summary (recruiter/portfolio friendly), not a setup tutorial; deeper structure is in `docs/repository-structure.md` and `docs/architecture.md`.
- After **each completed milestone**: review diffs, clean dead code, update docs, **one clear commit**, **push to GitHub**.
- Do not collapse services into one process; keep boundaries honest.

## When M1 is complete

Update this file to **MILESTONE 2**, summarize work, and give a commit message. Then implement auth + workspace domain per `docs/milestones.md`.
