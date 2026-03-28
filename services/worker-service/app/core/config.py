from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "worker-service"
    environment: str = "development"
    port: int = 8000
    database_url: str = Field(...)
    redis_url: str = Field(default="redis://127.0.0.1:6379/0")
    ingestion_queue_name: str = "km:ingestion:jobs"
    upload_dir: str = Field(default="/data/uploads")
    openai_api_key: str = Field(default="")
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    chunk_size: int = 1200
    chunk_overlap: int = 180
    openai_max_retries: int = 3


settings = Settings()
