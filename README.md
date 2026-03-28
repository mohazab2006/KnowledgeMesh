# KnowledgeMesh

**Your documents. One place to ask. Answers you can prove.**

## Problem

Teams store knowledge in PDFs, specs, and policies, but **finding an answer** means search keywords and opening many files. KnowledgeMesh is a **workspace-scoped knowledge platform**: upload documents, wait for **background indexing**, then ask in **natural language** and get answers **grounded in retrieved chunks** with **citations**—not free-form hallucination.

## Architecture (summary)

**Edge:** NGINX on **`HTTP_PORT`** (default **8080**) terminates browser traffic: **`/`** → Next.js, **`/api/`** → gateway ( **`/api` stripped** so the gateway keeps **`/v1/...`** paths).

**Service boundaries:** **auth** (identity, workspaces, JWT), **ingestion** (uploads, metadata, Redis enqueue), **worker** (extract → chunk → embed → **pgvector**), **retrieval** (query embedding + vector search), **llm** (JSON RAG completion with **`cited_indices`**), **gateway** (public API + **orchestrated query**). **Postgres + pgvector** and **Redis** are the shared coordination and persistence layers; **no in-memory singletons** across replicas.

**Methods:** REST over HTTP from browser to gateway; **async work** via Redis list **`km:ingestion:jobs`** (`LPUSH` / **`BRPOP`**). **JWT** (HS256) propagates on workspace-scoped calls.

**RAG flow:** Upload → document row + file on disk → job queued → worker indexes chunks → user **`POST .../query`** → gateway → retrieval (top‑k chunks) → llm (answer + citations) → merged response.

**Distributed systems:** **Health-gated startup** in Compose (each FastAPI service **`GET /health`** before gateway/frontend/NGINX) reduces cold 502s; **volumes** isolate durable state (**`pgdata`**, **`ingestion_uploads`**); services scale independently in principle (single-machine Compose is the reference deployment).

## Tech stack

| Layer | Technologies |
|--------|----------------|
| **Web app** | Next.js (App Router), React, TypeScript, Tailwind CSS |
| **APIs** | Python, FastAPI |
| **Data** | PostgreSQL 16 + pgvector, Redis |
| **Delivery** | Docker Compose, NGINX |
| **AI** | OpenAI API (embeddings + chat) |

## Key features (shipped)

Citation-oriented **RAG** query path, **async ingestion** with status, **workspace isolation**, **premium minimal UI** (app shell, loading/error patterns). Milestone tracker: [`docs/milestones.md`](docs/milestones.md).

## Future improvements

Streaming answers, reranking, optional local LLMs (e.g. Ollama), query analytics, stronger per-service DB roles, and managed-vector-store options—see **Milestone 8** in [`docs/milestones.md`](docs/milestones.md).

## Engineers: go deeper

- [`docs/how-to-run.md`](docs/how-to-run.md) — Docker Compose, ports, troubleshooting  
- [`docs/architecture.md`](docs/architecture.md) — request paths, data stores, security notes  
- [`docs/repository-structure.md`](docs/repository-structure.md) — repo map, RAG sequence diagram  
- [`docs/api-overview.md`](docs/api-overview.md) — HTTP surface  
- [`docs/decisions.md`](docs/decisions.md) — ADRs  
