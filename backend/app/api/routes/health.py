from fastapi import APIRouter

from app.config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
    }
