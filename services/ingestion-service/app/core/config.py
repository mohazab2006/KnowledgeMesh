from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "ingestion-service"
    environment: str = "development"
    port: int = 8000
    database_url: str = Field(...)
    jwt_secret: str = Field(..., min_length=16)
    jwt_algorithm: str = "HS256"
    redis_url: str = Field(default="redis://127.0.0.1:6379/0")
    ingestion_queue_name: str = "km:ingestion:jobs"
    upload_dir: str = Field(default="/data/uploads")
    max_upload_bytes: int = Field(default=50 * 1024 * 1024)


settings = Settings()
