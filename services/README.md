# Backend services

Each service is a **FastAPI** application with its own `Dockerfile`, `requirements.txt`, and `app/` package. Build context for Docker is the **repository root** so `shared/` can be copied into the image and placed on `PYTHONPATH`.

Target internal layout (filled in across milestones):

- `app/main.py` — application entry
- `app/api/` — routers
- `app/core/` — config, security helpers
- `app/models/`, `app/schemas/`, `app/services/`, `app/db/` — domain and persistence layers

All services expose `GET /health` using the shared `HealthResponse` schema for consistent orchestration probes.
