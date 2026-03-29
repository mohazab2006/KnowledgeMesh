from __future__ import annotations

import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from time import monotonic

import httpx
import json

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse

from app.core.config import settings
from app.schemas.diagnostics import DiagnosticsResponse, ServiceProbeOut
from app.schemas.query import (
    QueryCitationOut,
    WorkspaceQueryRequest,
    WorkspaceQueryResponse,
)
from shared.schemas.health import HealthResponse

logger = logging.getLogger("gateway.access")

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


class _SlidingWindowLimiter:
    """Per-key sliding window (monotonic clock)."""

    def __init__(self, max_requests: int, window_sec: float) -> None:
        self.max_requests = max_requests
        self.window_sec = window_sec
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = monotonic()
        dq = self._hits[key]
        while dq and now - dq[0] > self.window_sec:
            dq.popleft()
        if len(dq) >= self.max_requests:
            return False
        dq.append(now)
        return True


_query_limiter = _SlidingWindowLimiter(
    max(1, settings.query_rate_limit_per_minute),
    60.0,
)


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _is_rag_query_post(request: Request) -> bool:
    if request.method != "POST":
        return False
    parts = request.url.path.strip("/").split("/")
    if (
        len(parts) < 4
        or parts[0] != "v1"
        or parts[1] != "workspaces"
    ):
        return False
    if parts[-1] == "query" and len(parts) == 4:
        return True
    return bool(
        len(parts) >= 5
        and parts[-1] == "stream"
        and parts[-2] == "query"
    )


def _filter_headers(headers) -> dict[str, str]:
    return {
        k: v
        for k, v in headers.items()
        if k.lower() not in _HOP_BY_HOP
    }


async def _record_query_event(
    http: httpx.AsyncClient, workspace_id: str, auth: str,
) -> None:
    ing = settings.ingestion_service_url.rstrip("/")
    try:
        await http.post(
            f"{ing}/v1/workspaces/{workspace_id}/documents/query-events",
            headers={"Authorization": auth},
            timeout=5.0,
        )
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    timeout = httpx.Timeout(600.0, connect=30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        app.state.http = client
        yield


app = FastAPI(
    title="KnowledgeMesh API Gateway",
    version="0.6.0",
    lifespan=lifespan,
)


@app.middleware("http")
async def access_log_and_rate_limit(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    if _is_rag_query_post(request) and not _query_limiter.allow(
        _client_ip(request),
    ):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many queries. Try again in a minute."},
            headers={"Retry-After": "60"},
        )
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %s %.1fms",
        request.method,
        request.url.path,
        response.status_code,
        ms,
    )
    return response


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@app.get("/v1/diagnostics", response_model=DiagnosticsResponse)
async def diagnostics(request: Request) -> DiagnosticsResponse | JSONResponse:
    auth = request.headers.get("authorization") or request.headers.get(
        "Authorization",
    )
    if not auth:
        return JSONResponse(status_code=401, content={"detail": "Missing authorization"})
    http = request.app.state.http
    a_base = settings.auth_service_url.rstrip("/")
    try:
        me = await http.get(
            f"{a_base}/v1/auth/me",
            headers={"Authorization": auth},
            timeout=10.0,
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"detail": f"Auth service unreachable: {exc!s}"},
        )
    if me.status_code != 200:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    services: list[tuple[str, str]] = [
        ("auth", f"{a_base}/health"),
        (
            "ingestion",
            f"{settings.ingestion_service_url.rstrip('/')}/health",
        ),
        (
            "retrieval",
            f"{settings.retrieval_service_url.rstrip('/')}/health",
        ),
        ("llm", f"{settings.llm_service_url.rstrip('/')}/health"),
    ]
    wurl = settings.worker_service_url.strip()
    if wurl:
        services.append(("worker", f"{wurl.rstrip('/')}/health"))

    out: list[ServiceProbeOut] = []
    for name, url in services:
        try:
            r = await http.get(url, timeout=5.0)
            ok = r.status_code == 200
            detail = None if ok else (r.text or "")[:240]
            out.append(ServiceProbeOut(name=name, ok=ok, detail=detail))
        except httpx.RequestError as exc:
            out.append(ServiceProbeOut(name=name, ok=False, detail=str(exc)))

    return DiagnosticsResponse(services=out)


async def _forward(
    request: Request,
    upstream_path: str,
    *,
    base_url: str,
    service_label: str,
) -> Response:
    base = base_url.rstrip("/")
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
            content={
                "detail": f"Upstream {service_label} unreachable: {exc!s}",
            },
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
    return await _forward(
        request,
        f"v1/auth/{path}",
        base_url=settings.auth_service_url,
        service_label="auth service",
    )


@app.api_route("/v1/workspaces", methods=_METHODS)
async def proxy_workspaces_root(request: Request) -> Response:
    return await _forward(
        request,
        "v1/workspaces",
        base_url=settings.auth_service_url,
        service_label="auth service",
    )


@app.api_route("/v1/workspaces/{workspace_id}/documents/{path:path}", methods=_METHODS)
async def proxy_workspace_documents_sub(
    request: Request,
    workspace_id: str,
    path: str,
) -> Response:
    return await _forward(
        request,
        f"v1/workspaces/{workspace_id}/documents/{path}",
        base_url=settings.ingestion_service_url,
        service_label="ingestion service",
    )


@app.api_route("/v1/workspaces/{workspace_id}/documents", methods=_METHODS)
async def proxy_workspace_documents(
    request: Request,
    workspace_id: str,
) -> Response:
    return await _forward(
        request,
        f"v1/workspaces/{workspace_id}/documents",
        base_url=settings.ingestion_service_url,
        service_label="ingestion service",
    )


@app.post(
    "/v1/workspaces/{workspace_id}/query",
    response_model=WorkspaceQueryResponse,
)
async def workspace_rag_query(
    workspace_id: str,
    body: WorkspaceQueryRequest,
    request: Request,
) -> WorkspaceQueryResponse | JSONResponse:
    auth = request.headers.get("authorization") or request.headers.get(
        "Authorization"
    )
    if not auth:
        return JSONResponse(status_code=401, content={"detail": "Missing authorization"})

    http = request.app.state.http
    r_base = settings.retrieval_service_url.rstrip("/")
    l_base = settings.llm_service_url.rstrip("/")
    try:
        sr = await http.post(
            f"{r_base}/v1/workspaces/{workspace_id}/search",
            json={
                "query": body.query,
                "top_k": body.top_k,
                "use_mmr": body.use_mmr,
            },
            headers={"Authorization": auth},
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"detail": f"Retrieval service unreachable: {exc!s}"},
        )

    if sr.status_code != 200:
        try:
            payload = sr.json()
        except Exception:
            payload = {"detail": (sr.text or "")[:500] or "Upstream error"}
        return JSONResponse(status_code=sr.status_code, content=payload)

    search_data = sr.json()
    chunks = search_data.get("chunks") or []
    if not chunks:
        await _record_query_event(http, workspace_id, auth)
        return WorkspaceQueryResponse(
            answer=(
                "No indexed chunks were found for this workspace yet. "
                "Upload and index documents first."
            ),
            citations=[],
            chunks_retrieved=0,
        )

    dist_by_chunk: dict[str, float] = {}
    for c in chunks:
        cid = c.get("chunk_id")
        if cid is not None and "distance" in c:
            dist_by_chunk[str(cid)] = float(c["distance"])

    try:
        lr = await http.post(
            f"{l_base}/v1/rag/complete",
            json={"question": body.query, "contexts": chunks},
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"detail": f"LLM service unreachable: {exc!s}"},
        )

    if lr.status_code != 200:
        try:
            payload = lr.json()
        except Exception:
            payload = {"detail": (lr.text or "")[:500] or "Upstream error"}
        return JSONResponse(status_code=lr.status_code, content=payload)

    out = lr.json()
    raw_citations = out.get("citations") or []
    citations: list[QueryCitationOut] = []
    for item in raw_citations:
        if not isinstance(item, dict):
            continue
        try:
            cid = str(item["chunk_id"])
            citations.append(
                QueryCitationOut(
                    chunk_id=item["chunk_id"],
                    document_id=item["document_id"],
                    chunk_index=int(item["chunk_index"]),
                    document_title=str(item.get("document_title", "")),
                    excerpt=str(item.get("excerpt", "")),
                    relevance_distance=dist_by_chunk.get(cid),
                )
            )
        except (KeyError, TypeError, ValueError):
            continue

    await _record_query_event(http, workspace_id, auth)
    return WorkspaceQueryResponse(
        answer=str(out.get("answer", "")),
        citations=citations,
        chunks_retrieved=len(chunks),
    )


@app.post(
    "/v1/workspaces/{workspace_id}/query/stream",
    response_model=None,
)
async def workspace_rag_query_stream(
    workspace_id: str,
    body: WorkspaceQueryRequest,
    request: Request,
) -> StreamingResponse | JSONResponse:
    auth = request.headers.get("authorization") or request.headers.get(
        "Authorization",
    )
    if not auth:
        return JSONResponse(status_code=401, content={"detail": "Missing authorization"})

    http = request.app.state.http
    r_base = settings.retrieval_service_url.rstrip("/")
    l_base = settings.llm_service_url.rstrip("/")

    try:
        sr = await http.post(
            f"{r_base}/v1/workspaces/{workspace_id}/search",
            json={
                "query": body.query,
                "top_k": body.top_k,
                "use_mmr": body.use_mmr,
            },
            headers={"Authorization": auth},
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            status_code=502,
            content={"detail": f"Retrieval service unreachable: {exc!s}"},
        )

    if sr.status_code != 200:
        try:
            payload = sr.json()
        except Exception:
            payload = {"detail": (sr.text or "")[:500] or "Upstream error"}
        return JSONResponse(status_code=sr.status_code, content=payload)

    search_data = sr.json()
    chunks = search_data.get("chunks") or []

    async def sse_gen():
        try:
            if not chunks:
                yield (
                    "data: "
                    + json.dumps({"type": "meta", "chunks_retrieved": 0}, default=str)
                    + "\n\n"
                )
                yield (
                    "data: "
                    + json.dumps(
                        {
                            "type": "done",
                            "answer": (
                                "No indexed chunks were found for this workspace yet. "
                                "Upload and index documents first."
                            ),
                            "citations": [],
                        },
                        default=str,
                    )
                    + "\n\n"
                )
                return
            try:
                async with http.stream(
                    "POST",
                    f"{l_base}/v1/rag/complete/stream",
                    json={"question": body.query, "contexts": chunks},
                ) as lr:
                    if lr.status_code != 200:
                        err_body = await lr.aread()
                        try:
                            payload = json.loads(err_body.decode())
                            det = payload.get("detail", lr.text)
                            if not isinstance(det, str):
                                det = str(det)
                        except Exception:
                            det = (
                                err_body.decode(errors="replace") or lr.text or ""
                            )[:500]
                        yield (
                            "data: "
                            + json.dumps({"type": "error", "detail": det}, default=str)
                            + "\n\n"
                        )
                        return
                    yield (
                        "data: "
                        + json.dumps(
                            {
                                "type": "meta",
                                "chunks_retrieved": len(chunks),
                            },
                            default=str,
                        )
                        + "\n\n"
                    )
                    async for part in lr.aiter_bytes():
                        yield part
            except httpx.RequestError as exc:
                yield (
                    "data: "
                    + json.dumps(
                        {
                            "type": "error",
                            "detail": f"LLM service unreachable: {exc!s}",
                        },
                        default=str,
                    )
                    + "\n\n"
                )
        finally:
            await _record_query_event(http, workspace_id, auth)

    return StreamingResponse(
        sse_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.api_route("/v1/workspaces/{path:path}", methods=_METHODS)
async def proxy_workspaces_sub(request: Request, path: str) -> Response:
    return await _forward(
        request,
        f"v1/workspaces/{path}",
        base_url=settings.auth_service_url,
        service_label="auth service",
    )
