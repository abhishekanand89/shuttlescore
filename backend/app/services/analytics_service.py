"""Analytics service — compute player stats from existing match/game data."""
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.match import Match, GameResult, Point
from app.models.player import Player
from app.models.tournament import Tournament
from app.models.league import Season
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
    ErrorProneShot,
    ErrorProneShotAnalytics,
    PartnershipSynergy,
    ShapleyAnalytics,
    SHOT_LABELS,
    END_REASON_LABELS,
)


async def _get_scoped_matches(
    db: AsyncSession,
    league_id: Optional[str] = None,
    season_id: Optional[str] = None,
    eager_points: bool = False,
    eager_games: bool = False,
) -> list:
    """Load completed matches, optionally scoped to a league or season."""
    opts = []
    if eager_points:
        opts.append(selectinload(Match.points))
    if eager_games:
        opts.append(selectinload(Match.games))

    query = select(Match).where(Match.status == "completed")
    if opts:
        for o in opts:
            query = query.options(o)

    if season_id:
        query = query.where(Match.season_id == season_id)
    elif league_id:
        # All seasons in this league
        season_q = select(Season.id).where(Season.league_id == league_id)
        query = query.where(Match.season_id.in_(season_q))

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_player_analytics(db: AsyncSession, player_id: str, league_id: Optional[str] = None, season_id: Optional[str] = None) -> Optional[PlayerAnalytics]:
    """Compute full analytics for a single player."""
    # Verify player exists
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        return None

    # Load completed matches (optionally scoped)
    all_completed = await _get_scoped_matches(db, league_id, season_id, eager_games=True)

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


def _compute_elo_ratings(completed_matches: list, players: list) -> dict[str, int]:
    """Compute Elo ratings by replaying all completed matches chronologically.

    - K-factor: 32
    - Doubles: team effective rating = average of members; each member updates individually.
    """
    K = 32
    ratings: dict[str, float] = {p.id: 1500.0 for p in players}

    # Sort matches by creation time
    sorted_matches = sorted(completed_matches, key=lambda m: m.created_at)

    for m in sorted_matches:
        if not m.winner_side:
            continue

        team_a_ids = m.team_a_player_ids
        team_b_ids = m.team_b_player_ids

        # Team effective rating = average of members
        ra = sum(ratings.get(pid, 1500.0) for pid in team_a_ids) / max(len(team_a_ids), 1)
        rb = sum(ratings.get(pid, 1500.0) for pid in team_b_ids) / max(len(team_b_ids), 1)

        # Expected scores
        ea = 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))
        eb = 1.0 - ea

        # Actual scores
        sa = 1.0 if m.winner_side == "a" else 0.0
        sb = 1.0 - sa

        # Update each player individually
        for pid in team_a_ids:
            if pid in ratings:
                ratings[pid] += K * (sa - ea)
        for pid in team_b_ids:
            if pid in ratings:
                ratings[pid] += K * (sb - eb)

    return {pid: round(r) for pid, r in ratings.items()}


def _compute_shapley_values(completed_matches: list, players: list) -> dict[str, Optional[float]]:
    """Compute Shapley values measuring each player's marginal contribution to winning.

    Doubles Shapley: for player i with partner j,
      marginal(i, j) = win_rate(i, j) - baseline(j)
      where baseline(j) = j's avg win rate with all other partners (excl. i)
      doubles_shapley(i) = avg of marginal(i, j) across all partners j

    Singles contribution: singles_win_rate - 0.5 (centered so average player = 0)

    Blended: weighted average by match count in each format.
    """
    player_ids = {p.id for p in players}

    # Separate singles and doubles completed matches
    singles = [m for m in completed_matches if m.match_type == "singles" and m.winner_side]
    doubles = [m for m in completed_matches if m.match_type == "doubles" and m.winner_side]

    # Singles win rates per player
    singles_wins: dict[str, int] = {}
    singles_total: dict[str, int] = {}
    for m in singles:
        for pid in m.team_a_player_ids + m.team_b_player_ids:
            if pid not in player_ids:
                continue
            side = "a" if pid in m.team_a_player_ids else "b"
            singles_total[pid] = singles_total.get(pid, 0) + 1
            if m.winner_side == side:
                singles_wins[pid] = singles_wins.get(pid, 0) + 1

    # Doubles: build partnership records
    # pair_key = frozenset({player_a, player_b}) on the SAME team
    pair_wins: dict[frozenset, int] = {}
    pair_total: dict[frozenset, int] = {}
    doubles_total_per_player: dict[str, int] = {}

    for m in doubles:
        for team_ids, side in [(m.team_a_player_ids, "a"), (m.team_b_player_ids, "b")]:
            if len(team_ids) < 2:
                continue
            pair = frozenset(team_ids[:2])
            pair_total[pair] = pair_total.get(pair, 0) + 1
            if m.winner_side == side:
                pair_wins[pair] = pair_wins.get(pair, 0) + 1
            for pid in team_ids:
                if pid in player_ids:
                    doubles_total_per_player[pid] = doubles_total_per_player.get(pid, 0) + 1

    # For each player, compute doubles Shapley
    doubles_shapley: dict[str, Optional[float]] = {}
    for p in players:
        pid = p.id
        # Find all partnerships involving this player
        my_pairs = [(pair, pair_wins.get(pair, 0), pair_total[pair])
                     for pair in pair_total if pid in pair and pair_total[pair] > 0]
        if not my_pairs:
            doubles_shapley[pid] = None
            continue

        marginals = []
        for pair, wins, total in my_pairs:
            pair_wr = wins / total
            # Partner id
            partner_id = next(iter(pair - {pid}))
            # Baseline: partner's win rate with all OTHER partners (excl. this player)
            partner_other_pairs = [
                (p2, pair_wins.get(p2, 0), pair_total[p2])
                for p2 in pair_total
                if partner_id in p2 and pid not in p2 and pair_total[p2] > 0
            ]
            if not partner_other_pairs:
                # Partner has no other partners — can't compute baseline, skip
                continue
            baseline_wins = sum(w for _, w, _ in partner_other_pairs)
            baseline_total = sum(t for _, _, t in partner_other_pairs)
            baseline_wr = baseline_wins / baseline_total if baseline_total > 0 else 0.5
            marginals.append(pair_wr - baseline_wr)

        doubles_shapley[pid] = sum(marginals) / len(marginals) if marginals else None

    # Blend singles and doubles
    result: dict[str, Optional[float]] = {}
    for p in players:
        pid = p.id
        s_total = singles_total.get(pid, 0)
        d_total = doubles_total_per_player.get(pid, 0)
        s_wr = (singles_wins.get(pid, 0) / s_total - 0.5) if s_total > 0 else None
        d_sv = doubles_shapley.get(pid)

        if s_wr is not None and d_sv is not None:
            total = s_total + d_total
            result[pid] = round((s_wr * s_total + d_sv * d_total) / total, 4)
        elif d_sv is not None:
            result[pid] = round(d_sv, 4)
        elif s_wr is not None:
            result[pid] = round(s_wr, 4)
        else:
            result[pid] = None

    return result


async def get_leaderboard(db: AsyncSession, league_id: Optional[str] = None, season_id: Optional[str] = None) -> List[LeaderboardEntry]:
    """Return all players ranked by wins (desc), then win_rate (desc), with Elo and Shapley."""
    players_result = await db.execute(select(Player))
    players = players_result.scalars().all()

    if not players:
        return []

    # Load completed matches (optionally scoped)
    all_completed = await _get_scoped_matches(db, league_id, season_id, eager_points=True)

    # Compute Elo ratings and Shapley values across all completed matches
    elo_ratings = _compute_elo_ratings(all_completed, players)
    shapley_values = _compute_shapley_values(all_completed, players)

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
            elo_rating=elo_ratings.get(player.id, 1500),
            shapley_value=shapley_values.get(player.id),
        ))

    entries.sort(key=lambda e: (-e.wins, -e.win_rate, e.player_name))

    for i, entry in enumerate(entries, start=1):
        entry.rank = i

    return entries


async def get_player_shot_analytics(db: AsyncSession, player_id: str, league_id: Optional[str] = None, season_id: Optional[str] = None) -> Optional[ShotAnalytics]:
    """Compute shot type, end reason, rally duration, and serve error stats for a player."""
    result = await db.execute(select(Player).where(Player.id == player_id))
    if not result.scalar_one_or_none():
        return None

    all_completed = await _get_scoped_matches(db, league_id, season_id, eager_points=True)

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


ERROR_END_REASONS = {"unforced_error", "forced_error", "serve_error", "net_error", "line_out"}


async def get_player_error_prone_shots(db: AsyncSession, player_id: str, league_id: Optional[str] = None, season_id: Optional[str] = None) -> Optional[ErrorProneShotAnalytics]:
    """Identify which shot types lead to the most errors for a player.

    An error point for the player is one where:
    - The point has a shot_type recorded
    - The end reason is an error type
    - The player was on the LOSING side of that point (opponent scored)
    """
    result = await db.execute(select(Player).where(Player.id == player_id))
    if not result.scalar_one_or_none():
        return None

    all_completed = await _get_scoped_matches(db, league_id, season_id, eager_points=True)

    player_matches = [
        m for m in all_completed
        if player_id in m.team_a_player_ids or player_id in m.team_b_player_ids
    ]

    # For each match, determine which side the player is on
    error_by_shot: dict[str, int] = {}
    total_by_shot: dict[str, int] = {}
    total_error_points = 0

    for m in player_matches:
        player_side = "a" if player_id in m.team_a_player_ids else "b"

        for p in m.points:
            if p.scoring_side == "start" or not p.shot_type:
                continue

            # Count all points with this shot type where player was involved
            total_by_shot[p.shot_type] = total_by_shot.get(p.shot_type, 0) + 1

            # Error point against this player: opponent scored AND it was an error
            if p.scoring_side != player_side and p.point_end_reason in ERROR_END_REASONS:
                error_by_shot[p.shot_type] = error_by_shot.get(p.shot_type, 0) + 1
                total_error_points += 1

    shots: List[ErrorProneShot] = []
    for shot_type in sorted(error_by_shot, key=lambda s: -error_by_shot[s]):
        ec = error_by_shot[shot_type]
        tc = total_by_shot.get(shot_type, ec)
        shots.append(ErrorProneShot(
            shot_type=shot_type,
            label=SHOT_LABELS.get(shot_type, shot_type),
            error_count=ec,
            total_count=tc,
            error_rate=round(ec / tc, 3) if tc else 0.0,
        ))

    return ErrorProneShotAnalytics(
        total_error_points=total_error_points,
        shots=shots,
    )


async def get_player_shapley(db: AsyncSession, player_id: str, league_id: Optional[str] = None, season_id: Optional[str] = None) -> Optional[ShapleyAnalytics]:
    """Compute detailed Shapley breakdown for a single player, including partnership synergies."""
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        return None

    players_result = await db.execute(select(Player))
    all_players = players_result.scalars().all()
    player_name_map = {p.id: p.name for p in all_players}

    all_completed = await _get_scoped_matches(db, league_id, season_id)

    singles = [m for m in all_completed if m.match_type == "singles" and m.winner_side]
    doubles = [m for m in all_completed if m.match_type == "doubles" and m.winner_side]

    # Singles stats for this player
    s_wins = 0
    s_total = 0
    for m in singles:
        if player_id not in m.team_a_player_ids and player_id not in m.team_b_player_ids:
            continue
        s_total += 1
        side = "a" if player_id in m.team_a_player_ids else "b"
        if m.winner_side == side:
            s_wins += 1
    singles_contrib = round(s_wins / s_total - 0.5, 4) if s_total > 0 else None

    # Doubles: build partnership records for ALL players (needed for baselines)
    pair_wins: dict[frozenset, int] = {}
    pair_total: dict[frozenset, int] = {}

    for m in doubles:
        for team_ids, side in [(m.team_a_player_ids, "a"), (m.team_b_player_ids, "b")]:
            if len(team_ids) < 2:
                continue
            pair = frozenset(team_ids[:2])
            pair_total[pair] = pair_total.get(pair, 0) + 1
            if m.winner_side == side:
                pair_wins[pair] = pair_wins.get(pair, 0) + 1

    # My partnerships
    my_pairs = [(pair, pair_wins.get(pair, 0), pair_total[pair])
                for pair in pair_total if player_id in pair and pair_total[pair] > 0]

    partnerships: List[PartnershipSynergy] = []
    marginals = []
    d_total = sum(t for _, _, t in my_pairs)

    for pair, wins, total in my_pairs:
        pair_wr = wins / total
        partner_id = next(iter(pair - {player_id}))

        # Partner's baseline with other partners
        partner_other = [
            (p2, pair_wins.get(p2, 0), pair_total[p2])
            for p2 in pair_total
            if partner_id in p2 and player_id not in p2 and pair_total[p2] > 0
        ]

        if partner_other:
            bl_wins = sum(w for _, w, _ in partner_other)
            bl_total = sum(t for _, _, t in partner_other)
            baseline_wr = bl_wins / bl_total if bl_total > 0 else 0.5
            marginals.append(pair_wr - baseline_wr)
        else:
            baseline_wr = 0.5  # no comparison available

        synergy = round(pair_wr - baseline_wr, 4)
        partnerships.append(PartnershipSynergy(
            partner_id=partner_id,
            partner_name=player_name_map.get(partner_id, "Unknown"),
            matches_together=total,
            wins_together=wins,
            pair_win_rate=round(pair_wr, 3),
            expected_win_rate=round(baseline_wr, 3),
            synergy=synergy,
        ))

    partnerships.sort(key=lambda p: -p.synergy)

    doubles_sv = round(sum(marginals) / len(marginals), 4) if marginals else None

    # Blend
    if singles_contrib is not None and doubles_sv is not None:
        total_m = s_total + d_total
        blended = round((singles_contrib * s_total + doubles_sv * d_total) / total_m, 4)
    elif doubles_sv is not None:
        blended = doubles_sv
    elif singles_contrib is not None:
        blended = singles_contrib
    else:
        blended = 0.0

    return ShapleyAnalytics(
        player_id=player_id,
        player_name=player.name,
        shapley_value=blended,
        doubles_shapley=doubles_sv,
        singles_contribution=singles_contrib,
        doubles_matches=d_total,
        singles_matches=s_total,
        partnerships_analyzed=len(marginals),
        partnerships=partnerships,
    )
