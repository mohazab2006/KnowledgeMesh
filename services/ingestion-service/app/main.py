from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import documents
from app.core.config import settings
from app.db.session import init_db
from app.models import document  # noqa: F401 — register Document on Base.metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    app.state.redis = redis.from_url(
        settings.redis_url,
        decode_responses=True,
    )
    yield
    await app.state.redis.aclose()


app = FastAPI(title=settings.service_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    documents.router,
    prefix="/v1/workspaces/{workspace_id}/documents",
    tags=["documents"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.service_name}
