from uuid import UUID

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=8000)
    top_k: int | None = Field(default=None, ge=1, le=32)
    use_mmr: bool | None = Field(
        default=None,
        description="If set, override default MMR reranking for this request.",
    )


class RetrievedChunkOut(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    content: str
    distance: float


class SearchResponse(BaseModel):
    chunks: list[RetrievedChunkOut]
