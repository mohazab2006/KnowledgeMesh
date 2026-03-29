# Milestones

Delivery phases for KnowledgeMesh (all **complete**). Rationale and tradeoffs live in [`decisions.md`](decisions.md) (ADR-001 through ADR-015)—not duplicated here.

| # | Name | Summary |
|---|------|---------|
| 0 | Foundation | Monorepo, Next.js + FastAPI stubs, shared health schema, Compose + NGINX skeleton |
| 1 | Design system + UI foundation | App shell, Tailwind tokens, primitives, auth pages, dashboard/documents/query layouts |
| 2 | Auth + workspace domain | JWT, workspaces, gateway proxy, frontend auth/workspace context |
| 3 | Document management + upload | `documents` table, ingestion, Redis enqueue, Documents UI |
| 4 | Async ingestion pipeline | Worker extract → chunk → embed → `document_chunks` + pgvector |
| 5 | Retrieval + RAG query flow | pgvector search, LLM JSON citations, gateway `POST .../query`, Query UI |
| 6 | UX polish | PageHeader, skeletons, error/retry patterns, query loading overlay |
| 7 | Infra polish + docs | Health-gated Compose, NGINX, `.env.example`, operator docs |
| 8 | Advanced RAG + ops | MMR reranking, SSE `query/stream`, optional Ollama chat, `GET /v1/diagnostics`, Compose `ollama` profile |

Optional hardening (DB roles per service, distributed rate limits, etc.) is out of scope unless reopened—see [`AGENTS.md`](../AGENTS.md).
