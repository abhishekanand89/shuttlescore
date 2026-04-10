"""Player CRUD endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse, PlayerListItem
from app.services import player_service

router = APIRouter(tags=["players"])


@router.post("/players", status_code=201)
async def create_player(data: PlayerCreate, db: AsyncSession = Depends(get_db)):
    """Register a new player."""
    # Validate phone format first
    try:
        player_service.validate_phone(data.phone)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        player = await player_service.create_player(db, data)
    except ValueError as e:
        msg = str(e)
        status = 409 if "already registered" in msg else 422
        raise HTTPException(status_code=status, detail=msg)

    return {
        "success": True,
        "data": PlayerResponse.model_validate(player).model_dump(),
    }


@router.get("/players")
async def list_players(
    search: Optional[str] = None, db: AsyncSession = Depends(get_db)
):
    """List all players with masked phone numbers."""
    players = await player_service.get_players(db, search=search)
    items = [
        PlayerListItem(
            id=p.id,
            name=p.name,
            phone_masked=player_service.mask_phone(p.phone),
        )
        for p in players
    ]
    return {"success": True, "data": [item.model_dump() for item in items]}


@router.get("/players/{player_id}")
async def get_player(player_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single player by ID."""
    player = await player_service.get_player_by_id(db, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "success": True,
        "data": PlayerResponse.model_validate(player).model_dump(),
    }


@router.put("/players/{player_id}")
async def update_player(
    player_id: str, data: PlayerUpdate, db: AsyncSession = Depends(get_db)
):
    """Update a player's information."""
    try:
        player = await player_service.update_player(db, player_id, data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return {
        "success": True,
        "data": PlayerResponse.model_validate(player).model_dump(),
    }
