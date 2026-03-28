import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.db.session import init_db
from app.worker.loop import worker_loop
from shared.schemas.health import HealthResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import app.models.document_chunk  # noqa: F401
    import app.models.document_ref  # noqa: F401

    await init_db()
    task = asyncio.create_task(worker_loop(), name="ingestion-worker")
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="KnowledgeMesh Worker Service",
    version="0.2.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)
