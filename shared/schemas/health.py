from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Standard health payload returned by every service."""

    status: str = Field(default="ok", description="Process liveness indicator")
    service: str = Field(..., description="Logical service name")
