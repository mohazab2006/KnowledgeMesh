# KnowledgeMesh — agent brief

## Status

**Showcase product is feature-complete through Milestone 8** (streaming, MMR, optional Ollama, diagnostics). Treat further work as optional hardening or product iteration unless the user reopens scope—see [`docs/milestones.md`](docs/milestones.md).

## Rules

- Root [**`README.md`**](README.md) is the recruiter-facing overview; deeper detail lives in **`docs/`**.
- Keep **service boundaries** honest (no collapsing into one monolith for convenience).
- After substantive changes: review diffs, update docs if behavior changed, **one clear commit**, **push to `main`**.

## Optional follow-ups

Stronger DB roles per service, distributed rate limiting, cross-encoder reranking, richer admin RBAC—only if the user asks.
