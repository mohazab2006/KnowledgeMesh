from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import search
from app.core.config import settings
from shared.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="KnowledgeMesh Retrieval Service",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    search.router,
    prefix="/v1/workspaces/{workspace_id}",
    tags=["search"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)
