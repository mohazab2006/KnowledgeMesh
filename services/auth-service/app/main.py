from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.workspaces import router as workspaces_router
from app.core.config import settings
from app.db.session import init_db
from shared.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import app.models  # noqa: F401 — register metadata

    await init_db()
    yield


app = FastAPI(
    title="KnowledgeMesh Auth Service",
    version="0.3.0",
    lifespan=lifespan,
)

app.include_router(auth_router, prefix="/v1/auth", tags=["auth"])
app.include_router(workspaces_router, prefix="/v1/workspaces", tags=["workspaces"])


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)
