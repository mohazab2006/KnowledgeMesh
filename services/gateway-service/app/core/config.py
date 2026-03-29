from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "gateway-service"
    environment: str = "development"
    port: int = 8000
    auth_service_url: str = "http://127.0.0.1:8001"
    ingestion_service_url: str = "http://127.0.0.1:8002"
    retrieval_service_url: str = "http://127.0.0.1:8003"
    llm_service_url: str = "http://127.0.0.1:8004"
    worker_service_url: str = ""
    # Per-IP sliding window for POST .../query and .../query/stream (60s window).
    query_rate_limit_per_minute: int = 30


settings = Settings()
