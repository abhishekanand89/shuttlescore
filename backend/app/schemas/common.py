"""Common response schemas."""
from typing import Any, Optional
from pydantic import BaseModel


class SuccessResponse(BaseModel):
    """Standard success response wrapper."""
    success: bool = True
    data: Any


class ErrorResponse(BaseModel):
    """Standard error response wrapper."""
    success: bool = False
    error: str
    code: Optional[str] = None
