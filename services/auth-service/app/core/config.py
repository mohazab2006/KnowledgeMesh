from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "auth-service"
    environment: str = "development"
    port: int = 8000
    database_url: str = Field(
        ...,
        description="Async SQLAlchemy URL, e.g. postgresql+asyncpg://user:pass@host:5432/db",
    )
    jwt_secret: str = Field(
        ...,
        min_length=16,
        description="HS256 secret; generate with a CSPRNG, never commit real values",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    password_reset_token_ttl_minutes: int = 60
    # When true, POST /forgot-password includes dev_reset_token if user exists (local only).
    password_reset_return_token: bool = False
    # Base URL for reset links in emails (no trailing slash required).
    frontend_public_url: str = "http://localhost:3000"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    # When True (or port 465), use SMTP_SSL instead of STARTTLS.
    smtp_use_ssl: bool = False


settings = Settings()
