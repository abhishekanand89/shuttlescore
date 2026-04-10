"""Player business logic service."""
import re
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.player import Player
from app.schemas.player import PlayerCreate, PlayerUpdate, VALID_GENDERS, VALID_SKILL_LEVELS


def normalize_phone(phone: str) -> str:
    """Normalize phone number: strip whitespace, dashes, +91 prefix → 10 digits."""
    # Remove all non-digit characters
    digits = re.sub(r"\D", "", phone)
    # Strip leading 0 or country code 91
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits


def validate_phone(phone: str) -> str:
    """Validate and return normalized phone. Raises ValueError if invalid."""
    normalized = normalize_phone(phone)
    if len(normalized) != 10 or not normalized.isdigit():
        raise ValueError(f"Invalid phone number: must be 10 digits, got '{phone}'")
    return normalized


def mask_phone(phone: str) -> str:
    """Mask phone number, showing only last 4 digits."""
    if len(phone) <= 4:
        return phone
    return "*" * (len(phone) - 4) + phone[-4:]


async def create_player(db: AsyncSession, data: PlayerCreate) -> Player:
    """Create a new player. Raises ValueError for duplicate phone."""
    normalized_phone = validate_phone(data.phone)

    if data.gender is not None and data.gender not in VALID_GENDERS:
        raise ValueError(f"Invalid gender. Must be one of: {', '.join(sorted(VALID_GENDERS))}")
    if data.skill_level is not None and data.skill_level not in VALID_SKILL_LEVELS:
        raise ValueError(f"Invalid skill_level. Must be one of: {', '.join(sorted(VALID_SKILL_LEVELS))}")

    # Check for duplicate
    existing = await db.execute(
        select(Player).where(Player.phone == normalized_phone)
    )
    if existing.scalar_one_or_none():
        raise ValueError("Phone number already registered")

    player = Player(
        name=data.name,
        phone=normalized_phone,
        age=data.age,
        gender=data.gender,
        skill_level=data.skill_level,
    )
    db.add(player)
    await db.flush()
    await db.refresh(player)
    return player


async def get_players(db: AsyncSession, search: Optional[str] = None) -> list[Player]:
    """List all players, optionally filtered by name search."""
    query = select(Player).order_by(Player.name)
    if search:
        query = query.where(Player.name.ilike(f"%{search}%"))
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_player_by_id(db: AsyncSession, player_id: str) -> Optional[Player]:
    """Get a single player by ID."""
    result = await db.execute(select(Player).where(Player.id == player_id))
    return result.scalar_one_or_none()


async def update_player(
    db: AsyncSession, player_id: str, data: PlayerUpdate
) -> Optional[Player]:
    """Update a player's information. Returns None if not found."""
    player = await get_player_by_id(db, player_id)
    if not player:
        return None
    if data.gender is not None and data.gender not in VALID_GENDERS:
        raise ValueError(f"Invalid gender. Must be one of: {', '.join(sorted(VALID_GENDERS))}")
    if data.skill_level is not None and data.skill_level not in VALID_SKILL_LEVELS:
        raise ValueError(f"Invalid skill_level. Must be one of: {', '.join(sorted(VALID_SKILL_LEVELS))}")
    if data.name is not None:
        player.name = data.name
    if data.age is not None:
        player.age = data.age
    if data.gender is not None:
        player.gender = data.gender
    if data.skill_level is not None:
        player.skill_level = data.skill_level
    await db.flush()
    await db.refresh(player)
    return player
