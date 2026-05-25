from collections.abc import AsyncGenerator
from urllib.parse import quote, unquote

from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()


def _sanitize_database_url(database_url: str) -> str:
    if "://" not in database_url or "@" not in database_url:
        return database_url

    scheme, remainder = database_url.split("://", 1)
    credentials, host_part = remainder.rsplit("@", 1)
    if ":" not in credentials:
        return database_url

    username, password = credentials.split(":", 1)
    if password.startswith("[") and password.endswith("]"):
        password = password[1:-1]

    # Re-encode password so special characters like @ are parsed correctly.
    password = quote(unquote(password), safe="")
    return f"{scheme}://{username}:{password}@{host_part}"


def _resolve_async_database_url(database_url: str) -> URL:
    raw_url = database_url.strip()
    if not raw_url:
        raise ValueError("DATABASE_URL is empty")

    raw_url = _sanitize_database_url(raw_url)

    try:
        url = make_url(raw_url)
    except Exception as exc:
        raise ValueError(
            "Invalid DATABASE_URL. Use format: "
            "postgresql+asyncpg://user:password@host:5432/database"
        ) from exc

    if url.drivername in {"postgresql", "postgres"}:
        url = url.set(drivername="postgresql+asyncpg")

    return url

engine = create_async_engine(
    _resolve_async_database_url(settings.database_url),
    echo=settings.debug and not settings.is_production,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_recycle=settings.db_pool_recycle,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
