"""Analytics service — compute player stats from existing match/game data."""
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.match import Match, GameResult, Point
from app.models.player import Player
from app.models.tournament import Tournament
from app.schemas.analytics import (
    PlayerAnalytics,
    MatchStats,
    GameStats,
    TournamentStats,
    TournamentMedal,
    LeaderboardEntry,
    ShotAnalytics,
    ShotBreakdown,
    EndReasonBreakdown,
    SHOT_LABELS,
    END_REASON_LABELS,
)


async def get_player_analytics(db: AsyncSession, player_id: str) -> Optional[PlayerAnalytics]:
    """Compute full analytics for a single player."""
    # Verify player exists
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        return None

    # Load all completed matches involving this player (with games eager-loaded)
    matches_result = await db.execute(
        select(Match)
        .options(selectinload(Match.games))
        .where(Match.status == "completed")
    )
    all_completed = matches_result.scalars().all()

    # Filter to matches where the player participated
    player_matches = [
        m for m in all_completed
        if player_id in m.team_a_player_ids or player_id in m.team_b_player_ids
    ]

    # Match-level stats
    match_wins = 0
    match_losses = 0
    for m in player_matches:
        player_side = "a" if player_id in m.team_a_player_ids else "b"
        if m.winner_side == player_side:
            match_wins += 1
        else:
            match_losses += 1

    total_matches = len(player_matches)
    win_rate = round(match_wins / total_matches, 3) if total_matches > 0 else 0.0

    # Game-level stats (from GameResult rows)
    game_wins = 0
    game_losses = 0
    for m in player_matches:
        player_side = "a" if player_id in m.team_a_player_ids else "b"
        for g in m.games:
            if g.winner_side == player_side:
                game_wins += 1
            else:
                game_losses += 1

    # Tournament medals
    tournament_ids = {m.tournament_id for m in player_matches if m.tournament_id}
    medals: List[TournamentMedal] = []

    if tournament_ids:
        t_result = await db.execute(
            select(Tournament).where(Tournament.id.in_(tournament_ids))
        )
        tournaments_map = {t.id: t for t in t_result.scalars().all()}

        for t_id in tournament_ids:
            t_matches = [m for m in player_matches if m.tournament_id == t_id]
            t_wins = sum(
                1 for m in t_matches
                if m.winner_side == ("a" if player_id in m.team_a_player_ids else "b")
            )
            t_losses = len(t_matches) - t_wins

            if t_wins > t_losses:
                medal = "gold"
            elif t_wins == t_losses and t_wins > 0:
                medal = "silver"
            else:
                medal = "bronze"

            t_name = tournaments_map[t_id].name if t_id in tournaments_map else "Unknown"
            medals.append(TournamentMedal(
                tournament_id=t_id,
                tournament_name=t_name,
                wins=t_wins,
                losses=t_losses,
                medal=medal,
            ))

    # Sort medals: gold first, then silver, then bronze
    medal_order = {"gold": 0, "silver": 1, "bronze": 2}
    medals.sort(key=lambda m: medal_order[m.medal])

    return PlayerAnalytics(
        player_id=player_id,
        player_name=player.name,
        matches=MatchStats(
            total=total_matches,
            wins=match_wins,
            losses=match_losses,
            win_rate=win_rate,
        ),
        games=GameStats(
            total=game_wins + game_losses,
            wins=game_wins,
            losses=game_losses,
        ),
        tournaments=TournamentStats(
            participated=len(tournament_ids),
            medals=medals,
        ),
    )


async def get_leaderboard(db: AsyncSession) -> List[LeaderboardEntry]:
    """Return all players ranked by wins (desc), then win_rate (desc)."""
    players_result = await db.execute(select(Player))
    players = players_result.scalars().all()

    if not players:
        return []

    # Load all completed matches with points (for rally duration)
    matches_result = await db.execute(
        select(Match)
        .options(selectinload(Match.points))
        .where(Match.status == "completed")
    )
    all_completed = matches_result.scalars().all()

    entries = []
    for player in players:
        player_matches = [
            m for m in all_completed
            if player.id in m.team_a_player_ids or player.id in m.team_b_player_ids
        ]
        wins = sum(
            1 for m in player_matches
            if m.winner_side == ("a" if player.id in m.team_a_player_ids else "b")
        )
        total = len(player_matches)
        losses = total - wins
        win_rate = round(wins / total, 3) if total > 0 else 0.0

        durations = [
            p.rally_duration_seconds
            for m in player_matches
            for p in m.points
            if p.scoring_side != "start" and p.rally_duration_seconds is not None
        ]
        avg_rally = round(sum(durations) / len(durations), 1) if durations else None

        entries.append(LeaderboardEntry(
            rank=0,
            player_id=player.id,
            player_name=player.name,
            matches_played=total,
            wins=wins,
            losses=losses,
            win_rate=win_rate,
            avg_rally_duration_seconds=avg_rally,
        ))

    entries.sort(key=lambda e: (-e.wins, -e.win_rate, e.player_name))

    for i, entry in enumerate(entries, start=1):
        entry.rank = i

    return entries


async def get_player_shot_analytics(db: AsyncSession, player_id: str) -> Optional[ShotAnalytics]:
    """Compute shot type, end reason, rally duration, and serve error stats for a player."""
    result = await db.execute(select(Player).where(Player.id == player_id))
    if not result.scalar_one_or_none():
        return None

    # Load all completed matches for this player with their points
    matches_result = await db.execute(
        select(Match)
        .options(selectinload(Match.points))
        .where(Match.status == "completed")
    )
    all_completed = matches_result.scalars().all()

    player_matches = [
        m for m in all_completed
        if player_id in m.team_a_player_ids or player_id in m.team_b_player_ids
    ]

    # Collect all non-start points from the player's matches
    all_points = [
        p for m in player_matches
        for p in m.points
        if p.scoring_side != "start"
    ]

    # Points that have any metadata at all
    detailed_points = [p for p in all_points if
        p.rally_duration_seconds is not None or
        p.point_end_reason is not None or
        p.shot_type is not None or
        p.winning_player_id is not None
    ]

    total_detailed = len(detailed_points)

    # Average rally duration
    durations = [p.rally_duration_seconds for p in all_points if p.rally_duration_seconds is not None]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else None

    # Shot breakdown — points where THIS player played the winning shot
    shot_counts: dict[str, int] = {}
    for p in all_points:
        if p.winning_player_id == player_id and p.shot_type:
            shot_counts[p.shot_type] = shot_counts.get(p.shot_type, 0) + 1

    shots: List[ShotBreakdown] = []
    total_winning_shots = sum(shot_counts.values())
    for shot_type, count in sorted(shot_counts.items(), key=lambda x: -x[1]):
        shots.append(ShotBreakdown(
            shot_type=shot_type,
            label=SHOT_LABELS.get(shot_type, shot_type),
            count=count,
            wins=count,  # every winning-player shot is a win for that player
            win_rate=round(count / total_winning_shots, 3) if total_winning_shots else 0.0,
        ))

    # End reason breakdown — all points in player's matches that have a reason
    reason_counts: dict[str, int] = {}
    for p in all_points:
        if p.point_end_reason:
            reason_counts[p.point_end_reason] = reason_counts.get(p.point_end_reason, 0) + 1

    end_reasons: List[EndReasonBreakdown] = []
    total_reasons = sum(reason_counts.values())
    for reason, count in sorted(reason_counts.items(), key=lambda x: -x[1]):
        end_reasons.append(EndReasonBreakdown(
            reason=reason,
            label=END_REASON_LABELS.get(reason, reason),
            count=count,
            percentage=round(count / total_reasons * 100, 1) if total_reasons else 0.0,
        ))

    # Serve error rate — serve_error points where player was server / all points where player was server
    served_points = [p for p in all_points if p.server_id == player_id]
    serve_errors = [p for p in served_points if p.point_end_reason == "serve_error"]
    serve_error_rate = round(len(serve_errors) / len(served_points), 3) if served_points else None

    return ShotAnalytics(
        total_detailed_points=total_detailed,
        avg_rally_duration_seconds=avg_duration,
        shots=shots,
        end_reasons=end_reasons,
        serve_error_rate=serve_error_rate,
    )
