from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "retrieval-service"
    environment: str = "development"
    port: int = 8000
    database_url: str = Field(...)
    jwt_secret: str = Field(..., min_length=16)
    jwt_algorithm: str = "HS256"
    openai_api_key: str = Field(default="")
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    default_top_k: int = 8
    max_top_k: int = 16
    max_chunk_chars: int = 3000


settings = Settings()
