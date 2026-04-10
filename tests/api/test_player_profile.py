"""Tests for FEAT-010: Player profile fields (age, gender, skill_level) and match location."""
import pytest
from httpx import AsyncClient


# ── T-1001: Create player with all profile fields ──────────────────────────

@pytest.mark.asyncio
async def test_create_player_with_profile(client: AsyncClient):
    res = await client.post("/api/players", json={
        "name": "Profile Player",
        "phone": "9400000001",
        "age": 25,
        "gender": "male",
        "skill_level": "intermediate",
    })
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["age"] == 25
    assert data["gender"] == "male"
    assert data["skill_level"] == "intermediate"


# ── T-1002: Profile fields are optional ────────────────────────────────────

@pytest.mark.asyncio
async def test_create_player_minimal(client: AsyncClient):
    res = await client.post("/api/players", json={"name": "Minimal Player", "phone": "9400000002"})
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["age"] is None
    assert data["gender"] is None
    assert data["skill_level"] is None


# ── T-1003: Invalid gender rejected ────────────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_gender_rejected(client: AsyncClient):
    res = await client.post("/api/players", json={
        "name": "Bad Gender", "phone": "9400000003", "gender": "alien"
    })
    assert res.status_code == 422


# ── T-1004: Invalid skill_level rejected ───────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_skill_level_rejected(client: AsyncClient):
    res = await client.post("/api/players", json={
        "name": "Bad Skill", "phone": "9400000004", "skill_level": "pro"
    })
    assert res.status_code == 422


# ── T-1005: Update player profile fields ───────────────────────────────────

@pytest.mark.asyncio
async def test_update_player_profile(client: AsyncClient):
    create = await client.post("/api/players", json={"name": "Update Test", "phone": "9400000005"})
    pid = create.json()["data"]["id"]

    res = await client.put(f"/api/players/{pid}", json={
        "age": 30, "gender": "female", "skill_level": "advanced"
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["age"] == 30
    assert data["gender"] == "female"
    assert data["skill_level"] == "advanced"


# ── T-1006: GET player returns profile fields ──────────────────────────────

@pytest.mark.asyncio
async def test_get_player_returns_profile(client: AsyncClient):
    create = await client.post("/api/players", json={
        "name": "Get Profile", "phone": "9400000006", "age": 22, "skill_level": "beginner"
    })
    pid = create.json()["data"]["id"]

    res = await client.get(f"/api/players/{pid}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["age"] == 22
    assert data["skill_level"] == "beginner"


# ── T-1007: Match with location_name ──────────────────────────────────────

@pytest.mark.asyncio
async def test_create_match_with_location_name(client: AsyncClient):
    p1 = (await client.post("/api/players", json={"name": "Loc P1", "phone": "9400000007"})).json()["data"]["id"]
    p2 = (await client.post("/api/players", json={"name": "Loc P2", "phone": "9400000008"})).json()["data"]["id"]

    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
        "location_name": "Mumbai Sports Club",
    })
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["location_name"] == "Mumbai Sports Club"
    assert data["latitude"] is None
    assert data["longitude"] is None


# ── T-1008: Match with GPS coordinates ────────────────────────────────────

@pytest.mark.asyncio
async def test_create_match_with_gps(client: AsyncClient):
    p1 = (await client.post("/api/players", json={"name": "GPS P1", "phone": "9400000009"})).json()["data"]["id"]
    p2 = (await client.post("/api/players", json={"name": "GPS P2", "phone": "9400000010"})).json()["data"]["id"]

    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
        "location_name": "Bangalore Indoor",
        "latitude": 12.9716,
        "longitude": 77.5946,
    })
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["location_name"] == "Bangalore Indoor"
    assert abs(data["latitude"] - 12.9716) < 0.001
    assert abs(data["longitude"] - 77.5946) < 0.001


# ── T-1009: Location is optional ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_match_without_location(client: AsyncClient):
    p1 = (await client.post("/api/players", json={"name": "NoLoc P1", "phone": "9400000011"})).json()["data"]["id"]
    p2 = (await client.post("/api/players", json={"name": "NoLoc P2", "phone": "9400000012"})).json()["data"]["id"]

    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
    })
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["location_name"] is None
    assert data["latitude"] is None
    assert data["longitude"] is None
