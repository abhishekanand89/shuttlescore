"""Pydantic schemas for analytics responses."""
from typing import List, Optional
from pydantic import BaseModel


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


class LeaderboardEntry(BaseModel):
    rank: int
    player_id: str
    player_name: str
    matches_played: int
    wins: int
    losses: int
    win_rate: float
