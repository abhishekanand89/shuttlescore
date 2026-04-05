import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_type: Mapped[str] = mapped_column(String(20), nullable=False) # "singles" or "doubles"
    status: Mapped[str] = mapped_column(String(20), default="in_progress")
    team_a_player_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    team_b_player_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    current_game_number: Mapped[int] = mapped_column(Integer, default=1)
    winner_side: Mapped[Optional[str]] = mapped_column(String(10), nullable=True) # "a" or "b"
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    games = relationship("GameResult", back_populates="match", cascade="all, delete-orphan", lazy="selectin")
    points = relationship("Point", back_populates="match", cascade="all, delete-orphan", lazy="selectin", order_by="Point.id")

class GameResult(Base):
    __tablename__ = "game_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(String(36), ForeignKey("matches.id"), nullable=False)
    game_number: Mapped[int] = mapped_column(Integer, nullable=False)
    score_a: Mapped[int] = mapped_column(Integer, nullable=False)
    score_b: Mapped[int] = mapped_column(Integer, nullable=False)
    winner_side: Mapped[str] = mapped_column(String(10), nullable=False) # "a" or "b"

    match = relationship("Match", back_populates="games")

class Point(Base):
    __tablename__ = "points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[str] = mapped_column(String(36), ForeignKey("matches.id"), nullable=False)
    game_number: Mapped[int] = mapped_column(Integer, nullable=False)
    scoring_side: Mapped[str] = mapped_column(String(10), nullable=False) # "a" or "b"
    score_a_after: Mapped[int] = mapped_column(Integer, nullable=False)
    score_b_after: Mapped[int] = mapped_column(Integer, nullable=False)
    server_id: Mapped[str] = mapped_column(String(36), ForeignKey("players.id"), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    match = relationship("Match", back_populates="points")
