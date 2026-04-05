"""Match request/response schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class MatchCreate(BaseModel):
    match_type: str = Field(..., description="'singles' or 'doubles'")
    team_a_player_ids: List[str]
    team_b_player_ids: List[str]
    first_server_id: str

class GameStateBase(BaseModel):
    game_number: int
    score_a: int
    score_b: int
    server_id: str
    serving_side: str

class GameResultBase(BaseModel):
    game_number: int
    score_a: int
    score_b: int
    winner_side: str

class PointBase(BaseModel):
    id: int
    scoring_side: str
    game_number: int
    score_a_after: int
    score_b_after: int
    server_id: str
    timestamp: datetime = Field(..., alias="created_at")
    model_config = {"from_attributes": True, "populate_by_name": True}

class TeamBase(BaseModel):
    players: List[dict]  # Simplified player representation
    games_won: int

class MatchResponse(BaseModel):
    id: str
    match_type: str
    status: str
    team_a: TeamBase
    team_b: TeamBase
    current_game: Optional[GameStateBase]
    games: List[GameResultBase]
    points: List[PointBase]
    winner_side: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

class MatchScoreUpdate(BaseModel):
    scoring_side: str = Field(..., description="'a' or 'b'")

class PointResponse(BaseModel):
    point: PointBase
    current_game: Optional[GameStateBase]
    game_ended: bool
    match_ended: bool
    winner_side: Optional[str]

class UndoResponse(BaseModel):
    undone_point: dict
    current_game: Optional[GameStateBase]
    game_restored: bool

class MatchListItem(BaseModel):
    id: str
    match_type: str
    status: str
    team_a: dict
    team_b: dict
    current_score: Optional[dict]
    winner_side: Optional[str]
    created_at: datetime
