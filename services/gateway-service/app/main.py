from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.schemas.query import (
    QueryCitationOut,
    WorkspaceQueryRequest,
    WorkspaceQueryResponse,
)
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
    timeout = httpx.Timeout(600.0, connect=30.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        app.state.http = client
        yield


app = FastAPI(
    title="KnowledgeMesh API Gateway",
    version="0.4.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(service=settings.service_name)


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

    r_base = settings.retrieval_service_url.rstrip("/")
    l_base = settings.llm_service_url.rstrip("/")
    try:
        sr = await request.app.state.http.post(
            f"{r_base}/v1/workspaces/{workspace_id}/search",
            json={"query": body.query, "top_k": body.top_k},
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
        lr = await request.app.state.http.post(
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

    return WorkspaceQueryResponse(
        answer=str(out.get("answer", "")),
        citations=citations,
        chunks_retrieved=len(chunks),
    )


@app.api_route("/v1/workspaces/{path:path}", methods=_METHODS)
async def proxy_workspaces_sub(request: Request, path: str) -> Response:
    return await _forward(
        request,
        f"v1/workspaces/{path}",
        base_url=settings.auth_service_url,
        service_label="auth service",
    )
