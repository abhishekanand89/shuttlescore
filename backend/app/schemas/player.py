"""Player request/response schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

VALID_GENDERS = {"male", "female", "non_binary", "prefer_not_to_say"}
VALID_SKILL_LEVELS = {"beginner", "intermediate", "advanced", "competitive"}


class PlayerCreate(BaseModel):
    """Schema for creating a new player."""
    name: str = Field(..., min_length=2, max_length=50, description="Player display name")
    phone: str = Field(..., description="10-digit phone number")
    age: Optional[int] = Field(None, ge=5, le=100, description="Self-reported age")
    gender: Optional[str] = Field(None, description="'male' | 'female' | 'non_binary' | 'prefer_not_to_say'")
    skill_level: Optional[str] = Field(None, description="'beginner' | 'intermediate' | 'advanced' | 'competitive'")


class PlayerUpdate(BaseModel):
    """Schema for updating a player."""
    name: Optional[str] = Field(None, min_length=2, max_length=50, description="New display name")
    age: Optional[int] = Field(None, ge=5, le=100)
    gender: Optional[str] = None
    skill_level: Optional[str] = None


class PlayerResponse(BaseModel):
    """Full player response (detail view)."""
    id: str
    name: str
    phone: str
    age: Optional[int] = None
    gender: Optional[str] = None
    skill_level: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PlayerListItem(BaseModel):
    """Player in list view (phone masked)."""
    id: str
    name: str
    phone_masked: str

    model_config = {"from_attributes": True}
