"""Pydantic schemas for analytics responses."""
from typing import List, Optional
from pydantic import BaseModel

SHOT_LABELS = {
    "smash": "Smash", "drop": "Drop", "clear": "Clear", "lob": "Lob",
    "drive": "Drive", "net_shot": "Net Shot", "serve": "Serve",
    "flick": "Flick", "push": "Push", "lift": "Lift",
}

END_REASON_LABELS = {
    "winner": "Winner", "unforced_error": "Unforced Error",
    "forced_error": "Forced Error", "serve_error": "Serve Error",
    "net_error": "Net Error", "line_out": "Line Out",
}


class MatchStats(BaseModel):
    total: int
    wins: int
    losses: int
    win_rate: float


class GameStats(BaseModel):
    total: int
    wins: int
    losses: int


class TournamentMedal(BaseModel):
    tournament_id: str
    tournament_name: str
    wins: int
    losses: int
    medal: str  # "gold" | "silver" | "bronze"


class TournamentStats(BaseModel):
    participated: int
    medals: List[TournamentMedal]


class PlayerAnalytics(BaseModel):
    player_id: str
    player_name: str
    matches: MatchStats
    games: GameStats
    tournaments: TournamentStats


class ShotBreakdown(BaseModel):
    shot_type: str
    label: str
    count: int
    wins: int
    win_rate: float


class EndReasonBreakdown(BaseModel):
    reason: str
    label: str
    count: int
    percentage: float


class ShotAnalytics(BaseModel):
    total_detailed_points: int
    avg_rally_duration_seconds: Optional[float]
    shots: List[ShotBreakdown]
    end_reasons: List[EndReasonBreakdown]
    serve_error_rate: Optional[float]


class LeaderboardEntry(BaseModel):
    rank: int
    player_id: str
    player_name: str
    matches_played: int
    wins: int
    losses: int
    win_rate: float
    avg_rally_duration_seconds: Optional[float] = None
