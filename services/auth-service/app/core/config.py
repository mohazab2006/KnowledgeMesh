from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "auth-service"
    environment: str = "development"
    port: int = 8000
    database_url: str = "postgresql+asyncpg://km_local_dev:redacted@localhost:5432/km_local_dev"
    jwt_secret: str = "JWT_PLACEHOLDER_REMOVED"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7


settings = Settings()
