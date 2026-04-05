"""Health check endpoint."""
from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Return service health status."""
    return {
        "success": True,
        "data": {"status": "healthy", "version": settings.app_version},
    }
