"""Tests for FEAT-008: Shot & Rally Analytics."""
import pytest
from httpx import AsyncClient


# --- Helpers ---

async def create_player(client: AsyncClient, name: str, phone: str) -> str:
    res = await client.post("/api/players", json={"name": name, "phone": phone})
    assert res.status_code == 201
    return res.json()["data"]["id"]


async def create_detailed_match(client: AsyncClient, p1: str, p2: str) -> str:
    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
        "tracking_level": "detailed",
    })
    assert res.status_code == 201
    return res.json()["data"]["id"]


async def score_and_tag(client: AsyncClient, match_id: str, side: str, p1: str,
                         shot_type: str = None, end_reason: str = None,
                         duration: int = None, winning_player: str = None) -> int:
    """Score a point then PATCH metadata. Returns point id."""
    res = await client.post(f"/api/matches/{match_id}/points", json={"scoring_side": side})
    point_id = res.json()["data"]["point"]["id"]
    if any([shot_type, end_reason, duration, winning_player]):
        patch = {}
        if shot_type: patch["shot_type"] = shot_type
        if end_reason: patch["point_end_reason"] = end_reason
        if duration: patch["rally_duration_seconds"] = duration
        if winning_player: patch["winning_player_id"] = winning_player
        await client.patch(f"/api/matches/{match_id}/points/{point_id}", json=patch)
    return point_id


async def win_match_a(client, match_id):
    for _ in range(2):
        for _ in range(21):
            await client.post(f"/api/matches/{match_id}/points", json={"scoring_side": "a"})


# ── T-801: No detailed data returns zeros ────────────────────────────────────

@pytest.mark.asyncio
async def test_shot_analytics_no_data(client: AsyncClient):
    """Player with no matches returns empty shot analytics."""
    p1 = await create_player(client, "T801A", "9200000001")
    res = await client.get(f"/api/analytics/players/{p1}/shots")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_detailed_points"] == 0
    assert data["avg_rally_duration_seconds"] is None
    assert data["shots"] == []
    assert data["end_reasons"] == []
    assert data["serve_error_rate"] is None


# ── T-802: Shot type breakdown populated ─────────────────────────────────────

@pytest.mark.asyncio
async def test_shot_breakdown(client: AsyncClient):
    """Shot types recorded as winning_player shots appear in breakdown."""
    p1 = await create_player(client, "T802A", "9200000002")
    p2 = await create_player(client, "T802B", "9200000003")
    m = await create_detailed_match(client, p1, p2)

    # p1 wins 3 points with tagged shots
    await score_and_tag(client, m, "a", p1, shot_type="smash", winning_player=p1)
    await score_and_tag(client, m, "a", p1, shot_type="smash", winning_player=p1)
    await score_and_tag(client, m, "a", p1, shot_type="drop", winning_player=p1)
    # complete match
    await win_match_a(client, m)

    res = await client.get(f"/api/analytics/players/{p1}/shots")
    assert res.status_code == 200
    data = res.json()["data"]

    shots = {s["shot_type"]: s for s in data["shots"]}
    assert "smash" in shots
    assert shots["smash"]["count"] == 2
    assert "drop" in shots
    assert shots["drop"]["count"] == 1
    # smash should be first (sorted by count desc)
    assert data["shots"][0]["shot_type"] == "smash"


# ── T-803: End reason breakdown ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_end_reason_breakdown(client: AsyncClient):
    """End reasons recorded across match appear correctly."""
    p1 = await create_player(client, "T803A", "9200000004")
    p2 = await create_player(client, "T803B", "9200000005")
    m = await create_detailed_match(client, p1, p2)

    await score_and_tag(client, m, "a", p1, end_reason="winner")
    await score_and_tag(client, m, "a", p1, end_reason="winner")
    await score_and_tag(client, m, "b", p1, end_reason="unforced_error")
    await win_match_a(client, m)

    res = await client.get(f"/api/analytics/players/{p1}/shots")
    assert res.status_code == 200
    reasons = {r["reason"]: r for r in res.json()["data"]["end_reasons"]}
    assert reasons["winner"]["count"] == 2
    assert reasons["unforced_error"]["count"] == 1
    # percentages sum to 100
    total_pct = sum(r["percentage"] for r in res.json()["data"]["end_reasons"])
    assert abs(total_pct - 100.0) < 0.2


# ── T-804: Average rally duration ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_avg_rally_duration(client: AsyncClient):
    """Average rally duration computed correctly from tagged points."""
    p1 = await create_player(client, "T804A", "9200000006")
    p2 = await create_player(client, "T804B", "9200000007")
    m = await create_detailed_match(client, p1, p2)

    await score_and_tag(client, m, "a", p1, duration=4)
    await score_and_tag(client, m, "a", p1, duration=8)
    await score_and_tag(client, m, "a", p1, duration=12)
    await win_match_a(client, m)

    res = await client.get(f"/api/analytics/players/{p1}/shots")
    data = res.json()["data"]
    assert data["avg_rally_duration_seconds"] == 8.0


# ── T-805: Serve error rate ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_serve_error_rate(client: AsyncClient):
    """Serve error rate = serve_error points where player served / total serves."""
    p1 = await create_player(client, "T805A", "9200000008")
    p2 = await create_player(client, "T805B", "9200000009")
    m = await create_detailed_match(client, p1, p2)

    # p1 serves first; tag one serve error out of two serves
    await score_and_tag(client, m, "a", p1, end_reason="serve_error")  # p1 serves, error
    # after a scores, p1 still serves; normal point
    await score_and_tag(client, m, "a", p1, end_reason="winner")
    await win_match_a(client, m)

    res = await client.get(f"/api/analytics/players/{p1}/shots")
    data = res.json()["data"]
    # 1 serve error out of 2 serves where p1 was server
    assert data["serve_error_rate"] is not None
    assert 0.0 < data["serve_error_rate"] <= 1.0


# ── T-806: 404 for unknown player ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_shot_analytics_player_not_found(client: AsyncClient):
    res = await client.get("/api/analytics/players/no-such-id/shots")
    assert res.status_code == 404


# ── T-807: Leaderboard includes avg_rally_duration_seconds ────────────────────

@pytest.mark.asyncio
async def test_leaderboard_includes_rally_time(client: AsyncClient):
    """Leaderboard entry has avg_rally_duration_seconds field (null if no data)."""
    p1 = await create_player(client, "T807A", "9200000010")
    p2 = await create_player(client, "T807B", "9200000011")
    m = await create_detailed_match(client, p1, p2)
    await score_and_tag(client, m, "a", p1, duration=6)
    await win_match_a(client, m)

    res = await client.get("/api/analytics/leaderboard")
    assert res.status_code == 200
    entries = res.json()["data"]
    for entry in entries:
        assert "avg_rally_duration_seconds" in entry

    p1_entry = next(e for e in entries if e["player_id"] == p1)
    assert p1_entry["avg_rally_duration_seconds"] is not None


# ── T-808: Sequence mode match contributes no shot data ───────────────────────

@pytest.mark.asyncio
async def test_sequence_match_no_shot_data(client: AsyncClient):
    """Points from sequence-mode matches have no metadata — total_detailed_points stays 0."""
    p1 = await create_player(client, "T808A", "9200000012")
    p2 = await create_player(client, "T808B", "9200000013")
    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
        "tracking_level": "sequence",
    })
    m_id = res.json()["data"]["id"]
    await win_match_a(client, m_id)

    res = await client.get(f"/api/analytics/players/{p1}/shots")
    assert res.json()["data"]["total_detailed_points"] == 0
