from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    workspace_id: UUID
    created_by_id: UUID
    original_filename: str
    content_type: str | None
    size_bytes: int
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime
