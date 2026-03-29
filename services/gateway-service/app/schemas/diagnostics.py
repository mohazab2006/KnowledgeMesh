from pydantic import BaseModel


class ServiceProbeOut(BaseModel):
    name: str
    ok: bool
    detail: str | None = None


class DiagnosticsResponse(BaseModel):
    services: list[ServiceProbeOut]
