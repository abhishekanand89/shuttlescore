"""API tests for player CRUD endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import get_db, engine
from app.db.base import Base


@pytest.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def sample_player(client: AsyncClient):
    """Create and return a sample player."""
    response = await client.post("/api/players", json={
        "name": "John Doe",
        "phone": "9876543210"
    })
    return response.json()["data"]


# --- AC-1: Player Registration ---

@pytest.mark.asyncio
async def test_create_player_success(client: AsyncClient):
    """T-001: POST /api/players with valid data → 201."""
    response = await client.post("/api/players", json={
        "name": "Jane Smith",
        "phone": "9123456789"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "Jane Smith"
    assert data["data"]["phone"] == "9123456789"
    assert "id" in data["data"]
    assert "created_at" in data["data"]


@pytest.mark.asyncio
async def test_create_player_invalid_name(client: AsyncClient):
    """T-002: POST with name < 2 chars → 422."""
    response = await client.post("/api/players", json={
        "name": "J",
        "phone": "9123456789"
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_player_invalid_phone(client: AsyncClient):
    """T-003: POST with malformed phone → 422."""
    response = await client.post("/api/players", json={
        "name": "Jane Smith",
        "phone": "123"
    })
    assert response.status_code == 422


# --- AC-2: Duplicate Phone Prevention ---

@pytest.mark.asyncio
async def test_create_player_duplicate_phone(client: AsyncClient, sample_player):
    """T-004: POST with existing phone → 409."""
    response = await client.post("/api/players", json={
        "name": "Another Person",
        "phone": "9876543210"
    })
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False


# --- AC-3: Player List ---

@pytest.mark.asyncio
async def test_list_players(client: AsyncClient, sample_player):
    """T-005: GET /api/players → 200, masked phones."""
    response = await client.get("/api/players")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) >= 1
    assert "phone_masked" in data["data"][0]
    assert "phone" not in data["data"][0]


@pytest.mark.asyncio
async def test_list_players_search(client: AsyncClient, sample_player):
    """T-006: GET /api/players?search=john → filtered."""
    response = await client.get("/api/players?search=john")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["name"] == "John Doe"


@pytest.mark.asyncio
async def test_list_players_empty(client: AsyncClient):
    """T-007: GET /api/players with no data → empty array."""
    response = await client.get("/api/players")
    assert response.status_code == 200
    data = response.json()
    assert data["data"] == []


# --- AC-4: Player Profile View ---

@pytest.mark.asyncio
async def test_get_player_by_id(client: AsyncClient, sample_player):
    """T-008: GET /api/players/{id} → 200, full data."""
    player_id = sample_player["id"]
    response = await client.get(f"/api/players/{player_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["name"] == "John Doe"
    assert data["data"]["phone"] == "9876543210"


@pytest.mark.asyncio
async def test_get_player_not_found(client: AsyncClient):
    """T-009: GET /api/players/{bad-id} → 404."""
    response = await client.get("/api/players/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


# --- AC-5: Player Name Update ---

@pytest.mark.asyncio
async def test_update_player_name(client: AsyncClient, sample_player):
    """T-010: PUT /api/players/{id} with new name → 200."""
    player_id = sample_player["id"]
    response = await client.put(f"/api/players/{player_id}", json={
        "name": "John Updated"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["name"] == "John Updated"


@pytest.mark.asyncio
async def test_update_player_not_found(client: AsyncClient):
    """T-011: PUT /api/players/{bad-id} → 404."""
    response = await client.put(
        "/api/players/00000000-0000-0000-0000-000000000000",
        json={"name": "Nobody"}
    )
    assert response.status_code == 404
