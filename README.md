# KnowledgeMesh

**Your documents. One place to ask. Answers you can prove.**

KnowledgeMesh is a **team knowledge platform** that turns folders of PDFs, specs, and policies into a **natural-language Q&A** experience—every response tied to **real sources**, not a model making things up. Workspaces keep content **isolated by team or project**; heavy lifting runs **in the background** so uploads never block the UI.

### Why this project stands out

End-state we’re building toward (see milestones for what’s live today):

- **Citation-first answers** — see *which* document and *where* the model drew from.  
- **Production-shaped architecture** — separate services for auth, ingestion, workers, vector search, and LLM calls, not a single “toy” monolith.  
- **Semantic search** — ask how people actually talk; you don’t need the same keywords as the PDF.  
- **Modern stack** — Next.js and TypeScript on the front, FastAPI and Postgres **+ pgvector** on the back, Redis for queues, the whole thing **Docker Compose–ready**.

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Web app** | Next.js (App Router), React, TypeScript, Tailwind CSS |
| **APIs** | Python, FastAPI |
| **Data** | PostgreSQL 16 + pgvector (vector storage), Redis (queues / cache) |
| **Delivery** | Docker Compose, NGINX reverse proxy |
| **AI** | **OpenAI API** for embeddings in **worker-service**; chat/RAG wiring in later milestones |

**Target architecture:** **RAG** (retrieve relevant chunks, *then* generate) so answers stay **grounded in your files**. The **embedding** side of that loop runs in **worker-service** once `OPENAI_API_KEY` is set; **retrieval + chat** are still roadmapped.

## Where we are now

This README describes the **whole product**, not a single milestone. **Milestones 0–4** are done through **async ingestion** (worker consumes Redis jobs, **PDF/text** extraction, **chunk + embed**, **pgvector** rows, document status **indexed / failed**). **Semantic retrieval + RAG query UI** are **Milestone 5**. Details: [`docs/milestones.md`](docs/milestones.md).

## Engineers: go deeper

- [`docs/repository-structure.md`](docs/repository-structure.md) — services, data flow, repo map  
- [`docs/architecture.md`](docs/architecture.md) — architecture notes  
- [`docs/api-overview.md`](docs/api-overview.md) — API direction  
- [`docs/decisions.md`](docs/decisions.md) — decision log  

