"""Seed script: 10 players, ~100 matches with varied formats and tracking levels."""
import asyncio
import httpx
import random

BASE = "http://localhost:8000/api"

PLAYERS = [
    ("Arjun Sharma",    "9800000001"),
    ("Priya Nair",      "9800000002"),
    ("Rahul Mehta",     "9800000003"),
    ("Sneha Iyer",      "9800000004"),
    ("Vikram Bose",     "9800000005"),
    ("Divya Kapoor",    "9800000006"),
    ("Kiran Reddy",     "9800000007"),
    ("Ananya Singh",    "9800000008"),
    ("Rohan Gupta",     "9800000009"),
    ("Meera Joshi",     "9800000010"),
]

SHOT_TYPES = ["smash", "drop", "clear", "lob", "drive", "net_shot", "serve", "flick", "push", "lift"]
END_REASONS = ["winner", "unforced_error", "forced_error", "serve_error", "net_error", "line_out"]


async def create_players(client):
    ids = []
    for name, phone in PLAYERS:
        r = await client.post("/players", json={"name": name, "phone": phone})
        if r.status_code == 201:
            ids.append(r.json()["data"]["id"])
            print(f"  Created player: {name}")
        else:
            # already exists — try to find via list
            r2 = await client.get(f"/players?search={name.split()[0]}")
            for p in r2.json().get("data", []):
                if p.get("name", "").startswith(name.split()[0]):
                    ids.append(p["id"])
                    print(f"  Found existing player: {name}")
                    break
    return ids


async def play_game(client, match_id: str, winner_side: str, tracking: str, players_a, players_b):
    """Play out a single badminton game to a valid score."""
    target = random.choice([21, 21, 21, 22, 23, 24, 25, 30])
    loser_score = random.randint(0, min(target - 2, 29 if target < 30 else 29))

    # Ensure deuce validity
    if target >= 22:
        loser_score = max(20, loser_score)
    if target == 30:
        loser_score = 29

    scores = (
        [(winner_side, 1)] * target +
        [("b" if winner_side == "a" else "a", 1)] * loser_score
    )
    random.shuffle(scores)

    # Play point by point
    score_a, score_b = 0, 0
    for side, _ in scores:
        if score_a == target and winner_side == "a":
            break
        if score_b == target and winner_side == "b":
            break
        # Check game end before posting
        if winner_side == "a" and score_a >= 21 and score_a - score_b >= 2:
            break
        if winner_side == "b" and score_b >= 21 and score_b - score_a >= 2:
            break
        if score_a == 30 or score_b == 30:
            break

        r = await client.post(f"/matches/{match_id}/points", json={"scoring_side": side})
        if r.status_code != 200:
            break
        data = r.json()["data"]
        point_id = data["point"]["id"] if data.get("point") else None

        if score_a == 0 and score_b == 0:
            pass
        if side == "a":
            score_a += 1
        else:
            score_b += 1

        # Tag metadata for detailed matches
        if tracking == "detailed" and point_id and random.random() < 0.75:
            all_players = players_a + players_b
            winning_player = random.choice(players_a if side == "a" else players_b)
            patch = {
                "shot_type": random.choice(SHOT_TYPES),
                "point_end_reason": random.choice(END_REASONS),
                "rally_duration_seconds": random.randint(1, 30),
                "winning_player_id": winning_player,
            }
            await client.patch(f"/matches/{match_id}/points/{point_id}", json=patch)

        if data.get("match_ended") or data.get("game_ended"):
            break


async def create_and_play_match(client, player_ids, match_num):
    """Create and play a single match."""
    match_type = random.choice(["singles", "singles", "singles", "doubles"])
    match_format = random.choice(["bo1", "bo1", "bo3", "bo3", "bo3"])
    tracking = random.choice(["sequence", "sequence", "detailed"])

    if match_type == "singles":
        a, b = random.sample(player_ids, 2)
        team_a, team_b = [a], [b]
    else:
        team_a = random.sample(player_ids, 2)
        remaining = [p for p in player_ids if p not in team_a]
        team_b = random.sample(remaining, 2)

    first_server = random.choice(team_a + team_b)

    r = await client.post("/matches", json={
        "match_type": match_type,
        "match_format": match_format,
        "team_a_player_ids": team_a,
        "team_b_player_ids": team_b,
        "first_server_id": first_server,
        "tracking_level": tracking,
    })
    if r.status_code != 201:
        print(f"  [!] Failed to create match {match_num}: {r.text[:100]}")
        return None

    match_id = r.json()["data"]["id"]
    games_to_win = 1 if match_format == "bo1" else 2
    a_wins = 0
    b_wins = 0
    game = 1

    while a_wins < games_to_win and b_wins < games_to_win:
        # Decide winner with slight bias toward team_a for variety
        winner = "a" if random.random() < 0.52 else "b"
        await play_game(client, match_id, winner, tracking, team_a, team_b)
        if winner == "a":
            a_wins += 1
        else:
            b_wins += 1
        game += 1

        # Safety: re-fetch match status
        check = await client.get(f"/matches/{match_id}")
        if check.json()["data"]["status"] == "completed":
            break

    fmt_label = f"{match_type[:1].upper()} {match_format} {tracking[:3]}"
    winner_side = "A" if a_wins >= games_to_win else "B"
    print(f"  [{match_num:03d}] {fmt_label} → Team {winner_side} wins ({a_wins}-{b_wins})")
    return match_id


async def print_analytics(client, player_ids, player_names):
    print("\n" + "="*60)
    print("LEADERBOARD")
    print("="*60)
    r = await client.get("/analytics/leaderboard")
    entries = r.json()["data"]
    print(f"{'Rank':<5} {'Player':<16} {'W':<4} {'L':<4} {'Win%':<7} {'Avg Rally'}")
    print("-"*55)
    for e in entries:
        rally = f"{e['avg_rally_duration_seconds']:.1f}s" if e['avg_rally_duration_seconds'] else "—"
        print(f"  {e['rank']:<4} {e['player_name']:<16} {e['wins']:<4} {e['losses']:<4} {e['win_rate']*100:.0f}%    {rally}")

    print("\n" + "="*60)
    print("SHOT ANALYTICS (top 3 players by wins)")
    print("="*60)
    top3 = [(e["player_id"], e["player_name"]) for e in entries[:3]]
    for pid, pname in top3:
        r = await client.get(f"/analytics/players/{pid}/shots")
        d = r.json()["data"]
        print(f"\n  {pname}:")
        print(f"    Detailed pts: {d['total_detailed_points']}  |  Avg rally: {d['avg_rally_duration_seconds']}s  |  Serve err: {d['serve_error_rate']}")
        if d["shots"]:
            print(f"    Top shots: " + ", ".join(f"{s['shot_type']}×{s['count']}" for s in d["shots"][:3]))
        if d["end_reasons"]:
            print(f"    End reasons: " + ", ".join(f"{r_['reason']} {r_['percentage']:.0f}%" for r_ in d["end_reasons"][:3]))


async def main():
    async with httpx.AsyncClient(base_url=BASE, timeout=30) as client:
        print("Creating players...")
        player_ids = await create_players(client)
        player_names = {pid: name for pid, (name, _) in zip(player_ids, PLAYERS)}
        print(f"  {len(player_ids)} players ready\n")

        print("Creating matches...")
        completed = 0
        for i in range(1, 101):
            mid = await create_and_play_match(client, player_ids, i)
            if mid:
                completed += 1

        print(f"\n{completed}/100 matches completed")

        await print_analytics(client, player_ids, player_names)


if __name__ == "__main__":
    asyncio.run(main())
