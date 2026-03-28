from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from shared.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="KnowledgeMesh Retrieval Service",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)
