import errno
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import auth, chat, health, knowledge, progress
from app.config import get_settings
from app.core.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.database import Base, engine
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.security.rate_limit import limiter
from app.security.validators import validate_production_settings

settings = get_settings()

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("studentos")


def _is_network_unreachable_error(exc: Exception) -> bool:
    """Detect ENETUNREACH even when wrapped by SQLAlchemy/async context layers."""
    current: BaseException | None = exc
    seen: set[int] = set()

    while current is not None and id(current) not in seen:
        seen.add(id(current))
        if isinstance(current, OSError) and current.errno == errno.ENETUNREACH:
            return True
        current = current.__cause__ or current.__context__

    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_production_settings()
    if settings.auto_create_tables:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables verified")
        except Exception as exc:
            if settings.is_production and _is_network_unreachable_error(exc):
                logger.exception(
                    "Database network unreachable during startup. "
                    "Starting API without auto table creation. "
                    "Use Supabase pooler DATABASE_URL on Render (port 6543)."
                )
            else:
                raise
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="AI-powered learning operating system API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Middleware order: last added = outermost (runs first on request)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(SlowAPIMiddleware)

if settings.is_production and "*" not in settings.allowed_host_list:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_host_list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")
