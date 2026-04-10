"""League and Season schemas."""
from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field


class LeagueCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    player_ids: Optional[List[str]] = None


class LeagueUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class LeaguePlayerItem(BaseModel):
    id: str
    name: str
    model_config = {"from_attributes": True}


class SeasonSummary(BaseModel):
    id: str
    name: str
    start_date: date
    end_date: date
    status: str
    match_count: int = 0


class LeagueResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime
    players: List[LeaguePlayerItem]
    seasons: List[SeasonSummary]


class LeagueListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    player_count: int
    season_count: int
    active_season: Optional[str] = None
    created_at: datetime


class SeasonCreate(BaseModel):
    name: str = Field(..., max_length=100)
    start_date: date
    end_date: date


class SeasonUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SeasonStatusUpdate(BaseModel):
    status: str = Field(..., description="'upcoming', 'active', or 'completed'")


class SeasonResponse(BaseModel):
    id: str
    league_id: str
    league_name: str
    name: str
    start_date: date
    end_date: date
    status: str
    match_count: int = 0
    created_at: datetime
