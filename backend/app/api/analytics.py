"""Analytics endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services import analytics_service

router = APIRouter(tags=["analytics"])


@router.get("/analytics/players/{player_id}")
async def get_player_analytics(
    player_id: str,
    league_id: Optional[str] = None,
    season_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    analytics = await analytics_service.get_player_analytics(db, player_id, league_id, season_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"success": True, "data": analytics.model_dump()}


@router.get("/analytics/players/{player_id}/shots")
async def get_player_shot_analytics(
    player_id: str,
    league_id: Optional[str] = None,
    season_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    shot_analytics = await analytics_service.get_player_shot_analytics(db, player_id, league_id, season_id)
    if shot_analytics is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"success": True, "data": shot_analytics.model_dump()}


@router.get("/analytics/players/{player_id}/shapley")
async def get_player_shapley(
    player_id: str,
    league_id: Optional[str] = None,
    season_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_player_shapley(db, player_id, league_id, season_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"success": True, "data": data.model_dump()}


@router.get("/analytics/players/{player_id}/errors")
async def get_player_error_prone_shots(
    player_id: str,
    league_id: Optional[str] = None,
    season_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_player_error_prone_shots(db, player_id, league_id, season_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return {"success": True, "data": data.model_dump()}


@router.get("/analytics/leaderboard")
async def get_leaderboard(
    league_id: Optional[str] = None,
    season_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    entries = await analytics_service.get_leaderboard(db, league_id, season_id)
    return {"success": True, "data": [e.model_dump() for e in entries]}
