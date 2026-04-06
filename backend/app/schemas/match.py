"""Match request/response schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

VALID_TRACKING_LEVELS = {"summary", "sequence", "detailed"}
VALID_MATCH_FORMATS = {"bo1", "bo3"}
VALID_END_REASONS = {"winner", "unforced_error", "forced_error", "serve_error", "net_error", "line_out"}
VALID_SHOT_TYPES = {"smash", "drop", "clear", "lob", "drive", "net_shot", "serve", "flick", "push", "lift"}

class MatchCreate(BaseModel):
    match_type: str = Field(..., description="'singles' or 'doubles'")
    team_a_player_ids: List[str]
    team_b_player_ids: List[str]
    first_server_id: str
    tournament_id: Optional[str] = Field(None, description="Optional association with a tournament")
    tracking_level: str = Field("sequence", description="'summary' | 'sequence' | 'detailed'")
    match_format: str = Field("bo3", description="'bo1' (single game) | 'bo3' (best of 3)")

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
    rally_duration_seconds: Optional[int] = None
    point_end_reason: Optional[str] = None
    shot_type: Optional[str] = None
    winning_player_id: Optional[str] = None
    model_config = {"from_attributes": True, "populate_by_name": True}

class TeamBase(BaseModel):
    players: List[dict]  # Simplified player representation
    games_won: int

class MatchResponse(BaseModel):
    id: str
    match_type: str
    match_format: str
    status: str
    tracking_level: str
    team_a: TeamBase
    team_b: TeamBase
    current_game: Optional[GameStateBase]
    games: List[GameResultBase]
    points: List[PointBase]
    winner_side: Optional[str]
    tournament_id: Optional[str]
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

class PointMetadataUpdate(BaseModel):
    rally_duration_seconds: Optional[int] = None
    point_end_reason: Optional[str] = None
    shot_type: Optional[str] = None
    winning_player_id: Optional[str] = None


class GameScoreInput(BaseModel):
    score_a: int
    score_b: int


class MatchSummarySubmit(BaseModel):
    games: List[GameScoreInput]


class MatchListItem(BaseModel):
    id: str
    match_type: str
    status: str
    team_a: dict
    team_b: dict
    current_score: Optional[dict]
    winner_side: Optional[str]
    tournament_id: Optional[str]
    created_at: datetime
