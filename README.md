# KnowledgeMesh

**Your documents. One place to ask. Answers you can prove.**

## The problem

Team knowledge lives in PDFs, specs, and policies, but **getting an answer** still means guessing keywords and opening file after file. KnowledgeMesh is a **workspace-scoped** knowledge product: upload content, let it **index in the background**, then **ask in natural language** and get responses **tied to real passages**—with **citations**, not unchecked model text.

## What you’re looking at

A **multi-service RAG platform**: a **gateway** orchestrates **auth**, **ingestion**, **retrieval**, and **LLM** services. **PostgreSQL + pgvector** holds identities, workspaces, documents, and chunk embeddings; **Redis** backs the ingestion queue. A **worker** pulls jobs, extracts text, chunks, embeds, and writes vectors. Queries run **retrieve → generate**: top‑k chunks feed an LLM that returns **JSON** with **`answer`** + **`cited_indices`**; the gateway merges **citation metadata** for the UI.

**Edge:** NGINX serves the **Next.js** app and proxies **`/api/*`** to the gateway (the **`/api`** prefix is stripped so internal routes stay **`/v1/...`**). **Docker Compose** is the reference way to run the full stack, with **health-gated** startup so cold **502**s are rare.

## Stack

| Layer | Technologies |
|--------|----------------|
| **Web** | Next.js (App Router), React, TypeScript, Tailwind |
| **APIs** | Python, FastAPI, Pydantic, httpx |
| **Data** | PostgreSQL 16, **pgvector**, Redis |
| **AI** | OpenAI (embeddings + chat completions) |
| **Delivery** | Docker Compose, NGINX |

## What’s implemented

- **Identity & workspaces** — JWT auth, workspace membership, isolated libraries  
- **Documents** — upload, pipeline status, preview  
- **Ingestion** — async **Redis** queue; worker **extract → chunk → embed**  
- **Query** — semantic search + **citation-backed** answers  
- **Dashboard** — indexed/processing counts + **queries in the last 24h**  
- **Ops-shaped** — gateway **rate limit** on expensive query paths, access logging, Compose health ordering  

## Scope (intentional)

This repo is a **strong portfolio / demo** of RAG architecture and service boundaries—not a full SaaS. **Optional** follow-ups (streaming, reranking, local LLMs, admin, etc.) are tracked in [`docs/milestones.md`](docs/milestones.md), not implied as shipped.

## Go deeper

| Doc | Purpose |
|-----|---------|
| [`docs/how-to-run.md`](docs/how-to-run.md) | Run with Docker Compose |
| [`docs/architecture.md`](docs/architecture.md) | Paths, stores, security notes |
| [`docs/repository-structure.md`](docs/repository-structure.md) | Repo map, RAG sequence |
| [`docs/api-overview.md`](docs/api-overview.md) | HTTP surface |
| [`docs/decisions.md`](docs/decisions.md) | ADRs |
