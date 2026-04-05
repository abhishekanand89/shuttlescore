"""Unit tests for phone utility functions."""
import pytest


# --- Edge Cases ---

def test_phone_normalization():
    """T-E01: Phone normalization strips whitespace, dashes, +91 prefix."""
    from app.services.player_service import normalize_phone

    assert normalize_phone("  +91-98765 43210 ") == "9876543210"
    assert normalize_phone("9876543210") == "9876543210"
    assert normalize_phone("+919876543210") == "9876543210"
    assert normalize_phone("098765-43210") == "9876543210"


def test_phone_masking():
    """T-E02: Phone masking shows only last 4 digits."""
    from app.services.player_service import mask_phone

    assert mask_phone("9876543210") == "******3210"
    assert mask_phone("1234567890") == "******7890"
