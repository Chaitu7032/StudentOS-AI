import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import UserCreate


def hash_password(password: str) -> str:
    # bcrypt accepts up to 72 bytes; trim to avoid runtime errors.
    raw_password = password[:72].encode("utf-8")
    return bcrypt.hashpw(raw_password, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain[:72].encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    user = User(
        email=data.email.lower(),
        full_name=data.full_name.strip(),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
