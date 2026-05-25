"""Centralized rate limiting — import limiter here to avoid circular imports."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60/minute"],
)

# Route-specific limits (per client IP)
AUTH_LIMIT = "10/minute"
CHAT_STREAM_LIMIT = "30/minute"
UPLOAD_LIMIT = "8/minute"
AI_PLAN_LIMIT = "5/minute"
DEFAULT_LIMIT = "60/minute"
