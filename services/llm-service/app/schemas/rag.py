from uuid import UUID

from pydantic import BaseModel, Field


class RagContextChunk(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    content: str
    distance: float


class RagCompleteRequest(BaseModel):
    question: str = Field(min_length=1, max_length=8000)
    contexts: list[RagContextChunk] = Field(min_length=1)


class RagCitationOut(BaseModel):
    chunk_id: UUID
    document_id: UUID
    chunk_index: int
    document_title: str
    excerpt: str


class RagCompleteResponse(BaseModel):
    answer: str
    citations: list[RagCitationOut]
