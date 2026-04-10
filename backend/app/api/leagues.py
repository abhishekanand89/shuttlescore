"""League and Season endpoints."""
import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.league import League, Season, league_players
from app.models.player import Player
from app.schemas.league import (
    LeagueCreate, LeagueUpdate, LeagueResponse, LeagueListItem, LeaguePlayerItem,
    SeasonCreate, SeasonUpdate, SeasonStatusUpdate, SeasonResponse, SeasonSummary,
)

router = APIRouter(tags=["leagues"])


# ── League CRUD ──

@router.get("/leagues")
async def list_leagues(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(League).options(selectinload(League.seasons), selectinload(League.players))
        .order_by(League.created_at.desc())
    )
    leagues = result.scalars().all()
    items = []
    for lg in leagues:
        active = next((s.name for s in lg.seasons if s.status == "active"), None)
        items.append(LeagueListItem(
            id=lg.id, name=lg.name, description=lg.description,
            player_count=len(lg.players), season_count=len(lg.seasons),
            active_season=active, created_at=lg.created_at,
        ).model_dump())
    return {"success": True, "data": items}


@router.post("/leagues", status_code=201)
async def create_league(data: LeagueCreate, db: AsyncSession = Depends(get_db)):
    lg = League(id=str(uuid.uuid4()), name=data.name, description=data.description)
    if data.player_ids:
        result = await db.execute(select(Player).where(Player.id.in_(data.player_ids)))
        lg.players = list(result.scalars().all())
    db.add(lg)
    await db.flush()
    await db.refresh(lg, ["players", "seasons"])
    return {"success": True, "data": _league_response(lg)}


@router.get("/leagues/{league_id}")
async def get_league(league_id: str, db: AsyncSession = Depends(get_db)):
    lg = await _get_league(db, league_id)
    return {"success": True, "data": _league_response(lg)}


@router.put("/leagues/{league_id}")
async def update_league(league_id: str, data: LeagueUpdate, db: AsyncSession = Depends(get_db)):
    lg = await _get_league(db, league_id)
    if data.name is not None:
        lg.name = data.name
    if data.description is not None:
        lg.description = data.description
    await db.flush()
    await db.refresh(lg, ["players", "seasons"])
    return {"success": True, "data": _league_response(lg)}


@router.delete("/leagues/{league_id}")
async def delete_league(league_id: str, db: AsyncSession = Depends(get_db)):
    lg = await _get_league(db, league_id)
    # Block if any season has matches
    for s in lg.seasons:
        if s.matches:
            raise HTTPException(400, "Cannot delete league with existing match data")
    await db.delete(lg)
    return {"success": True, "data": {"deleted": True}}


# ── League player roster ──

@router.post("/leagues/{league_id}/players")
async def add_league_players(league_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Body: {"player_ids": ["id1", "id2"]}"""
    lg = await _get_league(db, league_id)
    existing_ids = {p.id for p in lg.players}
    new_ids = [pid for pid in data.get("player_ids", []) if pid not in existing_ids]
    if new_ids:
        result = await db.execute(select(Player).where(Player.id.in_(new_ids)))
        for p in result.scalars().all():
            lg.players.append(p)
        await db.flush()
        await db.refresh(lg, ["players", "seasons"])
    return {"success": True, "data": _league_response(lg)}


@router.delete("/leagues/{league_id}/players/{player_id}")
async def remove_league_player(league_id: str, player_id: str, db: AsyncSession = Depends(get_db)):
    lg = await _get_league(db, league_id)
    lg.players = [p for p in lg.players if p.id != player_id]
    await db.flush()
    await db.refresh(lg, ["players", "seasons"])
    return {"success": True, "data": _league_response(lg)}


# ── Season CRUD ──

@router.get("/leagues/{league_id}/seasons")
async def list_seasons(league_id: str, db: AsyncSession = Depends(get_db)):
    lg = await _get_league(db, league_id)
    items = [_season_summary(s) for s in lg.seasons]
    return {"success": True, "data": items}


@router.post("/leagues/{league_id}/seasons", status_code=201)
async def create_season(league_id: str, data: SeasonCreate, db: AsyncSession = Depends(get_db)):
    lg = await _get_league(db, league_id)
    if data.end_date <= data.start_date:
        raise HTTPException(422, "end_date must be after start_date")
    season = Season(
        id=str(uuid.uuid4()), league_id=lg.id,
        name=data.name, start_date=data.start_date, end_date=data.end_date,
    )
    db.add(season)
    await db.flush()
    await db.refresh(season, ["league", "matches"])
    return {"success": True, "data": _season_response(season)}


# ── Active seasons (for match creation dropdown) — must be before /{season_id} ──

@router.get("/seasons/active")
async def list_active_seasons(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Season).options(selectinload(Season.league))
        .where(Season.status == "active")
    )
    seasons = result.scalars().all()
    return {"success": True, "data": [_season_response(s) for s in seasons]}


@router.get("/seasons/{season_id}")
async def get_season(season_id: str, db: AsyncSession = Depends(get_db)):
    season = await _get_season(db, season_id)
    # Lazy auto-complete
    _auto_complete(season)
    return {"success": True, "data": _season_response(season)}


@router.put("/seasons/{season_id}")
async def update_season(season_id: str, data: SeasonUpdate, db: AsyncSession = Depends(get_db)):
    season = await _get_season(db, season_id)
    if data.name is not None:
        season.name = data.name
    if data.start_date is not None:
        season.start_date = data.start_date
    if data.end_date is not None:
        season.end_date = data.end_date
    await db.flush()
    await db.refresh(season, ["league", "matches"])
    return {"success": True, "data": _season_response(season)}


@router.delete("/seasons/{season_id}")
async def delete_season(season_id: str, db: AsyncSession = Depends(get_db)):
    season = await _get_season(db, season_id)
    if season.matches:
        raise HTTPException(400, "Cannot delete season with existing matches")
    await db.delete(season)
    return {"success": True, "data": {"deleted": True}}


@router.patch("/seasons/{season_id}/status")
async def update_season_status(season_id: str, data: SeasonStatusUpdate, db: AsyncSession = Depends(get_db)):
    season = await _get_season(db, season_id)
    valid = {"upcoming", "active", "completed"}
    if data.status not in valid:
        raise HTTPException(422, f"status must be one of {valid}")

    # Enforce only one active season per league
    if data.status == "active":
        result = await db.execute(
            select(Season).where(Season.league_id == season.league_id, Season.status == "active",
                                 Season.id != season.id)
        )
        if result.scalars().first():
            raise HTTPException(400, "Another season in this league is already active")

    season.status = data.status
    await db.flush()
    await db.refresh(season, ["league", "matches"])
    return {"success": True, "data": _season_response(season)}


# ── Helpers ──

async def _get_league(db: AsyncSession, league_id: str) -> League:
    result = await db.execute(
        select(League).options(selectinload(League.players), selectinload(League.seasons))
        .where(League.id == league_id)
    )
    lg = result.scalar_one_or_none()
    if not lg:
        raise HTTPException(404, "League not found")
    return lg


async def _get_season(db: AsyncSession, season_id: str) -> Season:
    result = await db.execute(
        select(Season).options(selectinload(Season.league), selectinload(Season.matches))
        .where(Season.id == season_id)
    )
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(404, "Season not found")
    return season


def _auto_complete(season: Season):
    """Lazy: mark season completed if past end_date."""
    if season.status == "active" and date.today() > season.end_date:
        season.status = "completed"


def _league_response(lg: League) -> dict:
    seasons = []
    for s in lg.seasons:
        _auto_complete(s)
        seasons.append(_season_summary(s))
    return LeagueResponse(
        id=lg.id, name=lg.name, description=lg.description, created_at=lg.created_at,
        players=[LeaguePlayerItem.model_validate(p) for p in lg.players],
        seasons=seasons,
    ).model_dump()


def _season_summary(s: Season) -> dict:
    return SeasonSummary(
        id=s.id, name=s.name, start_date=s.start_date, end_date=s.end_date,
        status=s.status, match_count=len(s.matches) if s.matches else 0,
    ).model_dump()


def _season_response(s: Season) -> dict:
    _auto_complete(s)
    return SeasonResponse(
        id=s.id, league_id=s.league_id,
        league_name=s.league.name if s.league else "Unknown",
        name=s.name, start_date=s.start_date, end_date=s.end_date,
        status=s.status, match_count=len(s.matches) if s.matches else 0,
        created_at=s.created_at,
    ).model_dump()
