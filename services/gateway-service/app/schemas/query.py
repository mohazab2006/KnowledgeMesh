from uuid import UUID

from pydantic import BaseModel, Field


class WorkspaceQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=8000)
    top_k: int | None = Field(default=None, ge=1, le=32)


class QueryCitationOut(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    excerpt: str
    relevance_distance: float | None = None


class WorkspaceQueryResponse(BaseModel):
    answer: str
    citations: list[QueryCitationOut]
    chunks_retrieved: int
