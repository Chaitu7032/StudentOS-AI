from pathlib import Path
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
_TRUE_VALUES = {"1", "true", "yes", "on", "debug", "dev", "development"}
_FALSE_VALUES = {"0", "false", "no", "off", "release", "prod", "production"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_BACKEND_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "StudentOS AI"
    environment: str = "development"
    debug: bool = True
    secret_key: str = "dev-secret-change-in-production"
    cors_origins: str = "http://localhost:3000"
    allowed_hosts: str = "*"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/studentos"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    rate_limit_per_minute: int = 60
    auth_rate_limit_per_minute: int = 10
    auto_create_tables: bool = True
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle: int = 1800
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    rag_top_k: int = 5
    rag_min_score: float = 0.35
    chunk_size: int = 500
    chunk_overlap: int = 50
    max_upload_mb: int = 5
    max_mermaid_chars: int = 12000

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        # Prefer project .env values over machine-wide env vars to avoid collisions
        # like DEBUG=warn from unrelated tools.
        return (
            init_settings,
            dotenv_settings,
            env_settings,
            file_secret_settings,
        )

    @field_validator("debug", mode="before")
    @classmethod
    def _parse_debug_flag(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in _TRUE_VALUES:
                return True
            if normalized in _FALSE_VALUES:
                return False
            if normalized in {"warn", "warning", "info", "error", "critical"}:
                return False
            return False
        return value

    @field_validator("auto_create_tables", mode="before")
    @classmethod
    def _parse_auto_create_tables_flag(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in _TRUE_VALUES:
                return True
            if normalized in _FALSE_VALUES:
                return False
        return value

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_host_list(self) -> List[str]:
        hosts = [h.strip() for h in self.allowed_hosts.split(",") if h.strip()]
        return hosts if hosts else ["*"]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
