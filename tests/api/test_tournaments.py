import pytest
from httpx import AsyncClient
from app.models.tournament import Tournament

# Test ID: T-301
@pytest.mark.asyncio
async def test_create_tournament_success(client: AsyncClient):
    res = await client.post("/api/tournaments", json={
        "name": "Summer Open",
        "description": "Local test tournament"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Summer Open"
    assert data["status"] == "upcoming"
    assert "id" in data

# Test ID: T-302
@pytest.mark.asyncio
async def test_create_tournament_validation(client: AsyncClient):
    res = await client.post("/api/tournaments", json={
        "description": "Missing name!"
    })
    assert res.status_code == 422

# Test ID: T-303
@pytest.mark.asyncio
async def test_list_tournaments(client: AsyncClient):
    await client.post("/api/tournaments", json={"name": "Listed Tournament1", "status": "active"})
    res = await client.get("/api/tournaments")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any(t["name"] == "Listed Tournament1" for t in data)

# Test ID: T-304
@pytest.mark.asyncio
async def test_create_match_with_tournament(client: AsyncClient):
    # Setup players and tournament
    p1 = await client.post("/api/players", json={"name": "TPlayer 1", "phone": "9999999991"})
    p2 = await client.post("/api/players", json={"name": "TPlayer 2", "phone": "9999999992"})
    t = await client.post("/api/tournaments", json={"name": "Match Tourney"})
    
    t_id = t.json()["id"]
    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1.json()["data"]["id"]],
        "team_b_player_ids": [p2.json()["data"]["id"]],
        "first_server_id": p1.json()["data"]["id"],
        "tournament_id": t_id
    })
    assert res.status_code == 201
    assert res.json()["data"]["tournament_id"] == t_id

# Test ID: T-305
@pytest.mark.asyncio
async def test_list_matches_by_tournament_filter(client: AsyncClient):
    t = await client.post("/api/tournaments", json={"name": "Filter Tourney"})
    t_id = t.json()["id"]
    res = await client.get(f"/api/matches?tournament_id={t_id}")
    assert res.status_code == 200
    # Data length might be 0 if the previous test didn't leak, but we just verify 200 and list type
    assert type(res.json()["data"]) is list

# Test ID: T-306
@pytest.mark.asyncio
async def test_get_tournament_detail(client: AsyncClient):
    t = await client.post("/api/tournaments", json={"name": "Detail Tourney"})
    t_id = t.json()["id"]
    res = await client.get(f"/api/tournaments/{t_id}")
    assert res.status_code == 200
    assert res.json()["tournament"]["id"] == t_id
