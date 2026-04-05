from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class TournamentCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field("upcoming", description="upcoming, active, or completed")

class TournamentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
