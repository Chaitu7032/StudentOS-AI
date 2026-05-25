import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User

settings = get_settings()
security_scheme = HTTPBearer(auto_error=False)

UNAUTHORIZED_HEADERS = {"WWW-Authenticate": "Bearer"}


def create_access_token(subject: uuid.UUID) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers=UNAUTHORIZED_HEADERS,
        )
    token = credentials.credentials
    if len(token) > 4096:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers=UNAUTHORIZED_HEADERS,
        )
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "exp"]},
        )
        if payload.get("type") and payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_uuid = uuid.UUID(str(user_id))
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers=UNAUTHORIZED_HEADERS,
        ) from exc

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers=UNAUTHORIZED_HEADERS,
        )
    return user
