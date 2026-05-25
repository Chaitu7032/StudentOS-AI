import re
from pathlib import Path

from app.config import get_settings

settings = get_settings()

INSECURE_SECRET_MARKERS = (
    "dev-secret",
    "change-me",
    "changeme",
    "secret_key",
)


def validate_production_settings() -> None:
    """Fail fast when production is misconfigured."""
    if settings.environment.lower() != "production":
        return
    key = settings.secret_key.strip()
    if len(key) < 32:
        raise RuntimeError("SECRET_KEY must be at least 32 characters in production")
    lower = key.lower()
    if any(marker in lower for marker in INSECURE_SECRET_MARKERS):
        raise RuntimeError("SECRET_KEY appears insecure for production")
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required in production")


def sanitize_filename(filename: str) -> str:
    """Prevent path traversal and unsafe upload names."""
    name = Path(filename).name
    name = re.sub(r"[^\w.\- ]", "_", name).strip()
    return name[:200] or "upload"


def safe_error_message(exc: Exception) -> str:
    """Avoid leaking internal details to clients in production."""
    if settings.debug:
        return str(exc)
    return "An internal error occurred. Please try again later."
