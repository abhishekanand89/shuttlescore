"""Tests for analytics endpoints (FEAT-006)."""
import pytest
from httpx import AsyncClient


# --- Helpers ---

async def create_player(client: AsyncClient, name: str, phone: str) -> str:
    res = await client.post("/api/players", json={"name": name, "phone": phone})
    assert res.status_code == 201
    return res.json()["data"]["id"]


async def create_match(client: AsyncClient, p1_id: str, p2_id: str, tournament_id: str = None) -> str:
    body = {
        "match_type": "singles",
        "team_a_player_ids": [p1_id],
        "team_b_player_ids": [p2_id],
        "first_server_id": p1_id,
    }
    if tournament_id:
        body["tournament_id"] = tournament_id
    res = await client.post("/api/matches", json=body)
    assert res.status_code == 201
    return res.json()["data"]["id"]


async def win_match_for_team_a(client: AsyncClient, match_id: str):
    """Score enough points for team A to win 2-0 (two games, 21-0 each)."""
    for _ in range(2):
        for _ in range(21):
            await client.post(f"/api/matches/{match_id}/points", json={"scoring_side": "a"})


# --- Test ID: T-601 ---

@pytest.mark.asyncio
async def test_player_stats_no_matches(client: AsyncClient):
    """Player with no matches returns all zeros and empty medals."""
    p_id = await create_player(client, "New Player", "8000000001")
    res = await client.get(f"/api/analytics/players/{p_id}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["player_id"] == p_id
    assert data["matches"]["total"] == 0
    assert data["matches"]["wins"] == 0
    assert data["matches"]["losses"] == 0
    assert data["matches"]["win_rate"] == 0.0
    assert data["games"]["total"] == 0
    assert data["tournaments"]["participated"] == 0
    assert data["tournaments"]["medals"] == []


# --- Test ID: T-602 ---

@pytest.mark.asyncio
async def test_player_stats_win_loss(client: AsyncClient):
    """Win/loss record correctly computed after completed matches."""
    p1 = await create_player(client, "Player A", "8000000002")
    p2 = await create_player(client, "Player B", "8000000003")

    # Match 1: p1 wins
    m1 = await create_match(client, p1, p2)
    await win_match_for_team_a(client, m1)

    # Match 2: p2 wins (p2 is team_a in this match)
    m2 = await create_match(client, p2, p1)
    await win_match_for_team_a(client, m2)

    res = await client.get(f"/api/analytics/players/{p1}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["matches"]["total"] == 2
    assert data["matches"]["wins"] == 1
    assert data["matches"]["losses"] == 1
    assert data["matches"]["win_rate"] == 0.5


# --- Test ID: T-603 ---

@pytest.mark.asyncio
async def test_player_stats_games_played(client: AsyncClient):
    """Games played count matches number of game results for the player."""
    p1 = await create_player(client, "Game Counter", "8000000004")
    p2 = await create_player(client, "Opponent GC", "8000000005")

    m1 = await create_match(client, p1, p2)
    await win_match_for_team_a(client, m1)  # 2-game win → 2 games

    res = await client.get(f"/api/analytics/players/{p1}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["games"]["total"] == 2
    assert data["games"]["wins"] == 2
    assert data["games"]["losses"] == 0


# --- Test ID: T-604 ---

@pytest.mark.asyncio
async def test_player_stats_tournament_medals(client: AsyncClient):
    """Tournament medals populated for player with tournament matches."""
    p1 = await create_player(client, "Medalist", "8000000006")
    p2 = await create_player(client, "Runner Up", "8000000007")

    # Create a tournament
    t_res = await client.post("/api/tournaments", json={"name": "Cup 2026"})
    t_id = t_res.json()["data"]["id"]

    # Play and win a match in the tournament
    m1 = await create_match(client, p1, p2, tournament_id=t_id)
    await win_match_for_team_a(client, m1)

    res = await client.get(f"/api/analytics/players/{p1}")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["tournaments"]["participated"] == 1
    medals = data["tournaments"]["medals"]
    assert len(medals) == 1
    assert medals[0]["tournament_id"] == t_id
    assert medals[0]["tournament_name"] == "Cup 2026"
    assert medals[0]["wins"] == 1
    assert medals[0]["losses"] == 0
    assert medals[0]["medal"] == "gold"


# --- Test ID: T-605 ---

@pytest.mark.asyncio
async def test_player_stats_not_found(client: AsyncClient):
    """Non-existent player returns 404."""
    res = await client.get("/api/analytics/players/nonexistent-id")
    assert res.status_code == 404
    assert res.json()["success"] is False


# --- Test ID: T-606 ---

@pytest.mark.asyncio
async def test_leaderboard_empty(client: AsyncClient):
    """Leaderboard returns empty list when no players."""
    res = await client.get("/api/analytics/leaderboard")
    assert res.status_code == 200
    assert res.json()["data"] == []


# --- Test ID: T-607 ---

@pytest.mark.asyncio
async def test_leaderboard_sorted_by_wins(client: AsyncClient):
    """Leaderboard ranks players by wins descending."""
    p1 = await create_player(client, "Top Player", "8000000008")
    p2 = await create_player(client, "Mid Player", "8000000009")
    p3 = await create_player(client, "New Player", "8000000010")

    # p1 wins 2 matches (vs p3 twice)
    m1 = await create_match(client, p1, p3)
    await win_match_for_team_a(client, m1)
    m2 = await create_match(client, p1, p3)
    await win_match_for_team_a(client, m2)

    # p2 wins 1 match (vs p3)
    m3 = await create_match(client, p2, p3)
    await win_match_for_team_a(client, m3)

    res = await client.get("/api/analytics/leaderboard")
    assert res.status_code == 200
    entries = res.json()["data"]

    # Verify response structure
    assert len(entries) == 3
    for e in entries:
        assert "rank" in e
        assert "player_id" in e
        assert "wins" in e
        assert "win_rate" in e

    # p1 should be rank 1 with 2 wins
    top = next(e for e in entries if e["player_id"] == p1)
    assert top["rank"] == 1
    assert top["wins"] == 2

    # p2 rank 2 with 1 win
    mid = next(e for e in entries if e["player_id"] == p2)
    assert mid["rank"] == 2
    assert mid["wins"] == 1
