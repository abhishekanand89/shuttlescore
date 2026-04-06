"""Tests for FEAT-009: Match Format (bo1/bo3) and Rally Gate."""
import pytest
from httpx import AsyncClient


async def create_two_players(client: AsyncClient, suffix: str):
    p1 = (await client.post("/api/players", json={"name": f"P1-{suffix}", "phone": f"9300{suffix}001"})).json()["data"]["id"]
    p2 = (await client.post("/api/players", json={"name": f"P2-{suffix}", "phone": f"9300{suffix}002"})).json()["data"]["id"]
    return p1, p2


async def create_match(client: AsyncClient, p1: str, p2: str, match_format: str = "bo3") -> str:
    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "match_format": match_format,
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
    })
    assert res.status_code == 201
    return res.json()["data"]["id"]


# ── T-901: bo1 match completed after 1 game ────────────────────────────────

@pytest.mark.asyncio
async def test_bo1_match_ends_after_one_game(client: AsyncClient):
    """A bo1 match must be completed once one player wins a single game."""
    p1, p2 = await create_two_players(client, "901")
    m = await create_match(client, p1, p2, match_format="bo1")

    # score 21 points for side A — should complete the match
    for _ in range(21):
        res = await client.post(f"/api/matches/{m}/points", json={"scoring_side": "a"})
        assert res.status_code == 200

    match_res = await client.get(f"/api/matches/{m}")
    assert match_res.status_code == 200
    data = match_res.json()["data"]
    assert data["status"] == "completed"
    assert data["winner_side"] == "a"


# ── T-902: bo3 match requires 2 games won ─────────────────────────────────

@pytest.mark.asyncio
async def test_bo3_match_requires_two_game_wins(client: AsyncClient):
    """A bo3 match should still be in_progress after one game is won."""
    p1, p2 = await create_two_players(client, "902")
    m = await create_match(client, p1, p2, match_format="bo3")

    # score 21 points for side A — should NOT complete the match
    for _ in range(21):
        await client.post(f"/api/matches/{m}/points", json={"scoring_side": "a"})

    match_res = await client.get(f"/api/matches/{m}")
    data = match_res.json()["data"]
    assert data["status"] == "in_progress"
    assert data["winner_side"] is None


# ── T-903: match_format is returned in response ────────────────────────────

@pytest.mark.asyncio
async def test_match_format_in_response(client: AsyncClient):
    """match_format field is present and correct in GET /api/matches/:id."""
    p1, p2 = await create_two_players(client, "903")
    m_bo1 = await create_match(client, p1, p2, match_format="bo1")
    m_bo3 = await create_match(client, p1, p2, match_format="bo3")

    r1 = (await client.get(f"/api/matches/{m_bo1}")).json()["data"]
    r2 = (await client.get(f"/api/matches/{m_bo3}")).json()["data"]

    assert r1["match_format"] == "bo1"
    assert r2["match_format"] == "bo3"


# ── T-904: invalid match_format rejected ──────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_match_format_rejected(client: AsyncClient):
    """An unknown match_format value returns 422."""
    p1, p2 = await create_two_players(client, "904")
    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "match_format": "bo5",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
    })
    assert res.status_code == 422


# ── T-905: bo1 match completes in 1 game even after deuce ─────────────────

@pytest.mark.asyncio
async def test_bo1_with_deuce(client: AsyncClient):
    """bo1 match respects deuce rules within the single game."""
    p1, p2 = await create_two_players(client, "905")
    m = await create_match(client, p1, p2, match_format="bo1")

    # bring score to 20-20
    for _ in range(20):
        await client.post(f"/api/matches/{m}/points", json={"scoring_side": "a"})
    for _ in range(20):
        await client.post(f"/api/matches/{m}/points", json={"scoring_side": "b"})

    # at 20-20 game should still be in progress
    mid = (await client.get(f"/api/matches/{m}")).json()["data"]
    assert mid["status"] == "in_progress"

    # two more for a to win 22-20
    await client.post(f"/api/matches/{m}/points", json={"scoring_side": "a"})
    await client.post(f"/api/matches/{m}/points", json={"scoring_side": "a"})

    final = (await client.get(f"/api/matches/{m}")).json()["data"]
    assert final["status"] == "completed"
    assert final["winner_side"] == "a"
