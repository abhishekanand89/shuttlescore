"""API tests for Match CRUD & game actions."""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_singles_match(client: AsyncClient, sample_player):
    """T-201: POST /api/matches creates a singles match."""
    # Create another player
    res = await client.post("/api/players", json={"name": "Player 2", "phone": "1234567890"})
    p2 = res.json()["data"]

    response = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [sample_player["id"]],
        "team_b_player_ids": [p2["id"]],
        "first_server_id": sample_player["id"]
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["match_type"] == "singles"
    assert "current_game" in data["data"]
    
@pytest.mark.asyncio
async def test_create_doubles_match(client: AsyncClient, sample_player):
    """T-202: POST /api/matches creates a doubles match."""
    # create more
    p2 = (await client.post("/api/players", json={"name": "A2", "phone": "1111111111"})).json()["data"]
    p3 = (await client.post("/api/players", json={"name": "B1", "phone": "2222222222"})).json()["data"]
    p4 = (await client.post("/api/players", json={"name": "B2", "phone": "3333333333"})).json()["data"]

    response = await client.post("/api/matches", json={
        "match_type": "doubles",
        "team_a_player_ids": [sample_player["id"], p2["id"]],
        "team_b_player_ids": [p3["id"], p4["id"]],
        "first_server_id": p3["id"]
    })
    
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True

@pytest.mark.asyncio
async def test_create_match_validation(client: AsyncClient, sample_player):
    """T-203: POST /api/matches handles invalid formats or missing players."""
    response = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [sample_player["id"]],
        "team_b_player_ids": ["invalid_id"],
        "first_server_id": sample_player["id"]
    })
    assert response.status_code == 422
    assert response.json()["success"] is False

@pytest.mark.asyncio
async def test_list_matches(client: AsyncClient, sample_player):
    """T-204: GET /api/matches returns active/completed match lists."""
    response = await client.get("/api/matches")
    assert response.status_code == 200
    assert type(response.json()["data"]) == list

@pytest.mark.asyncio
async def test_get_match(client: AsyncClient, sample_player):
    """T-205: GET /api/matches/{id} returns full state restoring persistence."""
    p2 = (await client.post("/api/players", json={"name": "Player 2", "phone": "1234567890"})).json()["data"]
    match_res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [sample_player["id"]],
        "team_b_player_ids": [p2["id"]],
        "first_server_id": sample_player["id"]
    })
    m_id = match_res.json()["data"]["id"]
    
    response = await client.get(f"/api/matches/{m_id}")
    assert response.status_code == 200
    assert response.json()["data"]["id"] == m_id

@pytest.mark.asyncio
async def test_score_point_api(client: AsyncClient, sample_player):
    """T-206: POST /api/matches/{id}/points updates score."""
    p2 = (await client.post("/api/players", json={"name": "Player 2", "phone": "1234567890"})).json()["data"]
    match_res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [sample_player["id"]],
        "team_b_player_ids": [p2["id"]],
        "first_server_id": sample_player["id"]
    })
    m_id = match_res.json()["data"]["id"]

    response = await client.post(f"/api/matches/{m_id}/points", json={"scoring_side": "a"})
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["current_game"]["score_a"] == 1
    assert data["current_game"]["score_b"] == 0

@pytest.mark.asyncio
async def test_undo_point_api(client: AsyncClient, sample_player):
    """T-207: POST /api/matches/{id}/undo reverses last point."""
    p2 = (await client.post("/api/players", json={"name": "Player 2", "phone": "1234567890"})).json()["data"]
    match_res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [sample_player["id"]],
        "team_b_player_ids": [p2["id"]],
        "first_server_id": sample_player["id"]
    })
    m_id = match_res.json()["data"]["id"]

    await client.post(f"/api/matches/{m_id}/points", json={"scoring_side": "a"})
    
    response = await client.post(f"/api/matches/{m_id}/undo")
    assert response.status_code == 200
    
    # check state goes back to 0-0
    get_res = await client.get(f"/api/matches/{m_id}")
    assert get_res.json()["data"]["current_game"]["score_a"] == 0
