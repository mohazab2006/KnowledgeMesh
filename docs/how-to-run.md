# How to run KnowledgeMesh

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose).

2. From the **repo root** (where `docker-compose.yml` is), copy the example env and edit `.env`:

   ```bash
   cp .env.example .env
   ```

   Fill in at least `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `JWT_SECRET` (see `.env.example`).

3. Start everything:

   ```bash
   docker compose up --build
   ```

4. Open **http://localhost:8080** in your browser.

Add **`OPENAI_API_KEY`** to `.env` if you want embeddings, search, and RAG answers to work.

Stop with `docker compose down`. Use `docker compose down -v` if you also want to wipe the database and uploaded files.
