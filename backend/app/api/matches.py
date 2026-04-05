"""Match endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.player import Player
from app.schemas.match import MatchCreate, MatchScoreUpdate, MatchResponse, MatchListItem, PointResponse, UndoResponse
from app.services import match_service

router = APIRouter(tags=["matches"])

async def _build_match_response(db: AsyncSession, match) -> dict:
    state = match_service.construct_match_state(match)
    
    # get players
    all_player_ids = match.team_a_player_ids + match.team_b_player_ids
    result = await db.execute(select(Player).where(Player.id.in_(all_player_ids)))
    players = {p.id: p for p in result.scalars().all()}
    
    return {
        "id": match.id,
        "match_type": match.match_type,
        "status": match.status,
        "team_a": {
            "players": [{"id": p, "name": players[p].name} for p in match.team_a_player_ids if p in players],
            "games_won": state.games_won_a
        },
        "team_b": {
            "players": [{"id": p, "name": players[p].name} for p in match.team_b_player_ids if p in players],
            "games_won": state.games_won_b
        },
        "current_game": state.current_game.__dict__ if state.current_game else None,
        "games": [{"game_number": g.game_number, "score_a": g.score_a, "score_b": g.score_b, "winner_side": g.winner_side} for g in match.games],
        "points": [p for p in match.points if p.scoring_side != "start"],
        "winner_side": match.winner_side,
        "created_at": match.created_at
    }

@router.post("/matches", status_code=201)
async def create_match(data: MatchCreate, db: AsyncSession = Depends(get_db)):
    try:
        match = await match_service.create_match(db, data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
        
    return {"success": True, "data": await _build_match_response(db, match)}

@router.get("/matches")
async def list_matches(db: AsyncSession = Depends(get_db)):
    matches = await match_service.list_matches(db)
    items = []
    
    for match in matches:
        state = match_service.construct_match_state(match)
        all_player_ids = match.team_a_player_ids + match.team_b_player_ids
        result = await db.execute(select(Player).where(Player.id.in_(all_player_ids)))
        players = {p.id: p for p in result.scalars().all()}
        
        items.append({
            "id": match.id,
            "match_type": match.match_type,
            "status": match.status,
            "team_a": {
                "player_names": [players[p].name for p in match.team_a_player_ids if p in players],
                "games_won": state.games_won_a
            },
            "team_b": {
                "player_names": [players[p].name for p in match.team_b_player_ids if p in players],
                "games_won": state.games_won_b
            },
            "current_score": {"a": state.current_game.score_a, "b": state.current_game.score_b} if state.current_game else None,
            "winner_side": match.winner_side,
            "created_at": match.created_at
        })
        
    return {"success": True, "data": items}

@router.get("/matches/{match_id}")
async def get_match_by_id(match_id: str, db: AsyncSession = Depends(get_db)):
    match = await match_service.get_match(db, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"success": True, "data": await _build_match_response(db, match)}

@router.post("/matches/{match_id}/points")
async def score_point(match_id: str, data: MatchScoreUpdate, db: AsyncSession = Depends(get_db)):
    try:
        match = await match_service.score_point(db, match_id, data.scoring_side)
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))
        
    res = await _build_match_response(db, match)
    last_p = res["points"][-1] if res["points"] else None
    
    return {
        "success": True,
        "data": {
            "point": last_p,
            "current_game": res["current_game"],
            "game_ended": getattr(res["current_game"], "is_finished", False),
            "match_ended": match.status == "completed",
            "winner_side": match.winner_side
        }
    }

@router.post("/matches/{match_id}/undo")
async def undo_point(match_id: str, db: AsyncSession = Depends(get_db)):
    try:
        match = await match_service.undo_point(db, match_id)
    except ValueError as e:
        status = 404 if "not found" in str(e).lower() else 400
        raise HTTPException(status_code=status, detail=str(e))
        
    res = await _build_match_response(db, match)
    return {
        "success": True, 
        "data": {
            "undone": True,
            "current_game": res["current_game"],
            "game_restored": True # Simplification
        }
    }
