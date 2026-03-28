import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=120)]


class WorkspaceOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}
