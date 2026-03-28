from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from app.core.config import settings
from shared.schemas.health import HealthResponse

_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
}

_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]


def _filter_headers(headers) -> dict[str, str]:
    return {
        k: v
        for k, v in headers.items()
        if k.lower() not in _HOP_BY_HOP
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient(timeout=60.0) as client:
        app.state.http = client
        yield


app = FastAPI(
    title="KnowledgeMesh API Gateway",
    version="0.2.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)


async def _forward(request: Request, upstream_path: str) -> Response:
    base = settings.auth_service_url.rstrip("/")
    url = f"{base}/{upstream_path}"
    q = request.url.query
    if q:
        url = f"{url}?{q}"
    body = await request.body()
    headers = _filter_headers(request.headers)
    try:
        resp = await request.app.state.http.request(
            request.method,
            url,
            headers=headers,
            content=body if body else None,
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"detail": f"Upstream auth service unreachable: {exc!s}"},
        )
    out_headers = {
        k: v
        for k, v in resp.headers.items()
        if k.lower()
        not in {"content-encoding", "transfer-encoding", "connection", "server"}
    }
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=out_headers,
        media_type=resp.headers.get("content-type"),
    )


@app.api_route("/v1/auth/{path:path}", methods=_METHODS)
async def proxy_auth(request: Request, path: str) -> Response:
    return await _forward(request, f"v1/auth/{path}")


@app.api_route("/v1/workspaces", methods=_METHODS)
async def proxy_workspaces_root(request: Request) -> Response:
    return await _forward(request, "v1/workspaces")


@app.api_route("/v1/workspaces/{path:path}", methods=_METHODS)
async def proxy_workspaces_sub(request: Request, path: str) -> Response:
    return await _forward(request, f"v1/workspaces/{path}")
