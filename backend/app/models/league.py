"""League and Season SQLAlchemy models."""
import uuid
from datetime import datetime, timezone, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


# Many-to-many: league <-> player
league_players = Table(
    "league_players",
    Base.metadata,
    Column("league_id", String(36), ForeignKey("leagues.id", ondelete="CASCADE"), primary_key=True),
    Column("player_id", String(36), ForeignKey("players.id", ondelete="CASCADE"), primary_key=True),
    Column("joined_at", DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)),
)


class League(Base):
    __tablename__ = "leagues"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    seasons = relationship("Season", back_populates="league", cascade="all, delete-orphan", lazy="selectin",
                           order_by="Season.start_date.desc()")
    players = relationship("Player", secondary=league_players, lazy="selectin")


class Season(Base):
    __tablename__ = "seasons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    league_id: Mapped[str] = mapped_column(String(36), ForeignKey("leagues.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="upcoming", nullable=False)
    # "upcoming" | "active" | "completed"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    league = relationship("League", back_populates="seasons")
    matches = relationship("Match", back_populates="season", lazy="selectin")
