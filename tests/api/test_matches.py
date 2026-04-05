"""API tests for Match CRUD & game actions."""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_singles_match(client: AsyncClient, sample_player):
    """T-201: POST /api/matches creates a singles match."""
    pass

@pytest.mark.asyncio
async def test_create_doubles_match(client: AsyncClient, sample_player):
    """T-202: POST /api/matches creates a doubles match."""
    pass

@pytest.mark.asyncio
async def test_create_match_validation(client: AsyncClient):
    """T-203: POST /api/matches handles invalid formats or missing players."""
    pass

@pytest.mark.asyncio
async def test_list_matches(client: AsyncClient):
    """T-204: GET /api/matches returns active/completed match lists."""
    pass

@pytest.mark.asyncio
async def test_get_match(client: AsyncClient):
    """T-205: GET /api/matches/{id} returns full state restoring persistence."""
    pass

@pytest.mark.asyncio
async def test_score_point_api(client: AsyncClient):
    """T-206: POST /api/matches/{id}/points updates score."""
    pass

@pytest.mark.asyncio
async def test_undo_point_api(client: AsyncClient):
    """T-207: POST /api/matches/{id}/undo reverses last point."""
    pass
