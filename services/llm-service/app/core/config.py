from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    service_name: str = "llm-service"
    environment: str = "development"
    port: int = 8000
    openai_api_key: str = Field(default="")
    chat_model: str = "gpt-4o-mini"
    max_context_chars: int = 28000
    # openai: OpenAI Chat Completions. ollama: local Ollama /api/chat (JSON mode).
    llm_provider: str = Field(default="openai")
    ollama_base_url: str = Field(default="http://127.0.0.1:11434")
    ollama_model: str = Field(default="llama3.2")


settings = Settings()
