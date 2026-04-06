"""Analytics endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services import analytics_service

router = APIRouter(tags=["analytics"])


@router.get("/analytics/players/{player_id}")
async def get_player_analytics(player_id: str, db: AsyncSession = Depends(get_db)):
    """Get win/loss record, games played, and tournament medals for a player."""
    analytics = await analytics_service.get_player_analytics(db, player_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"success": True, "data": analytics.model_dump()}


@router.get("/analytics/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Get all players ranked by wins."""
    entries = await analytics_service.get_leaderboard(db)
    return {"success": True, "data": [e.model_dump() for e in entries]}
