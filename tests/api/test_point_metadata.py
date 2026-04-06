"""Tests for FEAT-007: point metadata and summary mode."""
import pytest
from httpx import AsyncClient


# --- Helpers ---

async def create_player(client: AsyncClient, name: str, phone: str) -> str:
    res = await client.post("/api/players", json={"name": name, "phone": phone})
    assert res.status_code == 201
    return res.json()["data"]["id"]


async def create_match(client: AsyncClient, p1: str, p2: str, tracking_level: str = "sequence") -> dict:
    res = await client.post("/api/matches", json={
        "match_type": "singles",
        "team_a_player_ids": [p1],
        "team_b_player_ids": [p2],
        "first_server_id": p1,
        "tracking_level": tracking_level,
    })
    assert res.status_code == 201
    return res.json()["data"]


# ── T-701: tracking_level stored on match ─────────────────────────────────────

@pytest.mark.asyncio
async def test_match_tracking_level_stored(client: AsyncClient):
    """Match tracking_level is persisted and returned in response."""
    p1 = await create_player(client, "T701A", "9100000001")
    p2 = await create_player(client, "T701B", "9100000002")

    for level in ("summary", "sequence", "detailed"):
        m = await create_match(client, p1, p2, tracking_level=level)
        assert m["tracking_level"] == level


# ── T-702: PATCH point metadata ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patch_point_metadata(client: AsyncClient):
    """Metadata can be added to a point after it is recorded."""
    p1 = await create_player(client, "T702A", "9100000003")
    p2 = await create_player(client, "T702B", "9100000004")
    m = await create_match(client, p1, p2, tracking_level="detailed")
    match_id = m["id"]

    # Score a point
    score_res = await client.post(f"/api/matches/{match_id}/points", json={"scoring_side": "a"})
    assert score_res.status_code == 200
    point_id = score_res.json()["data"]["point"]["id"]

    # PATCH metadata
    patch_res = await client.patch(f"/api/matches/{match_id}/points/{point_id}", json={
        "rally_duration_seconds": 8,
        "point_end_reason": "smash",   # intentional: shot_type field should be smash
        "shot_type": "smash",
        "winning_player_id": p1,
    })
    # point_end_reason "smash" is invalid — should 400
    assert patch_res.status_code == 400

    # Correct payload
    patch_res = await client.patch(f"/api/matches/{match_id}/points/{point_id}", json={
        "rally_duration_seconds": 8,
        "point_end_reason": "winner",
        "shot_type": "smash",
        "winning_player_id": p1,
    })
    assert patch_res.status_code == 200
    data = patch_res.json()["data"]
    assert data["rally_duration_seconds"] == 8
    assert data["point_end_reason"] == "winner"
    assert data["shot_type"] == "smash"
    assert data["winning_player_id"] == p1


# ── T-703: PATCH metadata reflected in match response ─────────────────────────

@pytest.mark.asyncio
async def test_patch_metadata_visible_in_match(client: AsyncClient):
    """After PATCHing a point, updated metadata appears in GET /matches/:id."""
    p1 = await create_player(client, "T703A", "9100000005")
    p2 = await create_player(client, "T703B", "9100000006")
    m = await create_match(client, p1, p2, tracking_level="detailed")
    match_id = m["id"]

    score_res = await client.post(f"/api/matches/{match_id}/points", json={"scoring_side": "b"})
    point_id = score_res.json()["data"]["point"]["id"]

    await client.patch(f"/api/matches/{match_id}/points/{point_id}", json={
        "shot_type": "drop",
        "rally_duration_seconds": 5,
    })

    get_res = await client.get(f"/api/matches/{match_id}")
    points = get_res.json()["data"]["points"]
    updated = next((pt for pt in points if pt["id"] == point_id), None)
    assert updated is not None
    assert updated["shot_type"] == "drop"
    assert updated["rally_duration_seconds"] == 5


# ── T-704: PATCH returns 404 for wrong match ──────────────────────────────────

@pytest.mark.asyncio
async def test_patch_wrong_match_404(client: AsyncClient):
    """PATCHing a point with a mismatched match_id returns 404."""
    p1 = await create_player(client, "T704A", "9100000007")
    p2 = await create_player(client, "T704B", "9100000008")
    m = await create_match(client, p1, p2, tracking_level="detailed")

    score_res = await client.post(f"/api/matches/{m['id']}/points", json={"scoring_side": "a"})
    point_id = score_res.json()["data"]["point"]["id"]

    res = await client.patch(f"/api/matches/wrong-match-id/points/{point_id}", json={"shot_type": "lob"})
    assert res.status_code == 404


# ── T-705: Summary mode — valid 2-game submission ─────────────────────────────

@pytest.mark.asyncio
async def test_summary_submit_two_games(client: AsyncClient):
    """Summary submission completes the match with 2 valid game scores."""
    p1 = await create_player(client, "T705A", "9100000009")
    p2 = await create_player(client, "T705B", "9100000010")
    m = await create_match(client, p1, p2, tracking_level="summary")
    match_id = m["id"]

    res = await client.post(f"/api/matches/{match_id}/summary", json={
        "games": [
            {"score_a": 21, "score_b": 15},
            {"score_a": 21, "score_b": 18},
        ]
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "completed"
    assert data["winner_side"] == "a"
    assert len(data["games"]) == 2


# ── T-706: Summary mode — valid 3-game submission ─────────────────────────────

@pytest.mark.asyncio
async def test_summary_submit_three_games(client: AsyncClient):
    """Summary submission handles a 3-game (2-1) result correctly."""
    p1 = await create_player(client, "T706A", "9100000011")
    p2 = await create_player(client, "T706B", "9100000012")
    m = await create_match(client, p1, p2, tracking_level="summary")
    match_id = m["id"]

    res = await client.post(f"/api/matches/{match_id}/summary", json={
        "games": [
            {"score_a": 21, "score_b": 15},
            {"score_a": 14, "score_b": 21},
            {"score_a": 21, "score_b": 19},
        ]
    })
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "completed"
    assert data["winner_side"] == "a"
    assert len(data["games"]) == 3


# ── T-707: Summary — invalid game score rejected ──────────────────────────────

@pytest.mark.asyncio
async def test_summary_invalid_score_rejected(client: AsyncClient):
    """Scores that don't conform to badminton rules are rejected with 400."""
    p1 = await create_player(client, "T707A", "9100000013")
    p2 = await create_player(client, "T707B", "9100000014")
    m = await create_match(client, p1, p2, tracking_level="summary")
    match_id = m["id"]

    invalid_cases = [
        [{"score_a": 20, "score_b": 15}, {"score_a": 21, "score_b": 18}],  # 20-15 not valid
        [{"score_a": 21, "score_b": 20}, {"score_a": 21, "score_b": 18}],  # 21-20: only 1-point lead
        [{"score_a": 31, "score_b": 29}, {"score_a": 21, "score_b": 18}],  # score > 30
        [{"score_a": 21, "score_b": 21}, {"score_a": 21, "score_b": 18}],  # draw not valid
    ]

    for games in invalid_cases:
        res = await client.post(f"/api/matches/{match_id}/summary", json={"games": games})
        assert res.status_code == 400, f"Expected 400 for {games}, got {res.status_code}"


# ── T-708: Summary — no clear winner rejected ─────────────────────────────────

@pytest.mark.asyncio
async def test_summary_no_clear_winner_rejected(client: AsyncClient):
    """Submitting 2 games where each team wins one must require a 3rd game."""
    p1 = await create_player(client, "T708A", "9100000015")
    p2 = await create_player(client, "T708B", "9100000016")
    m = await create_match(client, p1, p2, tracking_level="summary")
    match_id = m["id"]

    # One game each — no winner yet, should fail
    res = await client.post(f"/api/matches/{match_id}/summary", json={
        "games": [
            {"score_a": 21, "score_b": 15},
            {"score_a": 15, "score_b": 21},
        ]
    })
    assert res.status_code == 400


# ── T-709: Summary mode only — sequence match rejects summary endpoint ─────────

@pytest.mark.asyncio
async def test_summary_endpoint_rejected_for_sequence_match(client: AsyncClient):
    """POST /summary on a non-summary match returns 400."""
    p1 = await create_player(client, "T709A", "9100000017")
    p2 = await create_player(client, "T709B", "9100000018")
    m = await create_match(client, p1, p2, tracking_level="sequence")
    match_id = m["id"]

    res = await client.post(f"/api/matches/{match_id}/summary", json={
        "games": [
            {"score_a": 21, "score_b": 15},
            {"score_a": 21, "score_b": 18},
        ]
    })
    assert res.status_code == 400


# ── T-710: Boundary scores ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_summary_boundary_scores(client: AsyncClient):
    """Edge-case valid scores: 30-29 (cap), 30-28, 22-20 all accepted."""
    p1 = await create_player(client, "T710A", "9100000019")
    p2 = await create_player(client, "T710B", "9100000020")

    valid_pairs = [
        (21, 0), (21, 19), (22, 20), (29, 27), (30, 28), (30, 29),
    ]

    for score_a, score_b in valid_pairs:
        m = await create_match(client, p1, p2, tracking_level="summary")
        # Need p2 to win one game first so we can do a 2-game result
        res = await client.post(f"/api/matches/{m['id']}/summary", json={
            "games": [
                {"score_a": score_a, "score_b": score_b},
                {"score_a": score_a, "score_b": score_b},
            ]
        })
        assert res.status_code == 200, f"Expected 200 for score {score_a}-{score_b}, got {res.status_code}: {res.text}"
