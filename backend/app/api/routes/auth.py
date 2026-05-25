from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import TokenResponse, UserCreate, UserLogin, UserResponse
from app.security.jwt import create_access_token, get_current_user
from app.services.auth import create_user, get_user_by_email, verify_password
from app.models.user import User
from app.security.rate_limit import AUTH_LIMIT, limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(AUTH_LIMIT)
async def signup(
    request: Request,
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    existing = await get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await create_user(db, data)
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit(AUTH_LIMIT)
async def login(
    request: Request,
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_by_email(db, data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
