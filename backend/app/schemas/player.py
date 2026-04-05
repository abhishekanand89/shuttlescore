"""Player request/response schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PlayerCreate(BaseModel):
    """Schema for creating a new player."""
    name: str = Field(..., min_length=2, max_length=50, description="Player display name")
    phone: str = Field(..., description="10-digit phone number")


class PlayerUpdate(BaseModel):
    """Schema for updating a player."""
    name: Optional[str] = Field(None, min_length=2, max_length=50, description="New display name")


class PlayerResponse(BaseModel):
    """Full player response (detail view)."""
    id: str
    name: str
    phone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PlayerListItem(BaseModel):
    """Player in list view (phone masked)."""
    id: str
    name: str
    phone_masked: str

    model_config = {"from_attributes": True}
