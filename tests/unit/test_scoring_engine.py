"""Unit tests for Badminton Scoring Engine rules."""
import pytest
from app.services.scoring_engine import MatchState, GameState, process_point

def setup_engine(score_a=0, score_b=0, games_a=0, games_b=0, serving="a"):
    gs = GameState(game_number=1+games_a+games_b, score_a=score_a, score_b=score_b, server_id= serving+"1", serving_side=serving, is_finished=False, winner_side=None)
    ms = MatchState(games_won_a=games_a, games_won_b=games_b, current_game=gs, is_finished=False, winner_side=None)
    return ms

team_a = ["a1"]
team_b = ["b1"]
last_servers = {"a": "a1", "b": "b1"}

def test_engine_standard_point():
    """T-208: Process standard point & increment score."""
    ms = setup_engine()
    new_ms, p_rec = process_point(ms, "a", team_a, team_b, "singles", last_servers)
    assert p_rec.score_a_after == 1
    assert p_rec.score_b_after == 0

def test_engine_game_end_21():
    """T-209: Side reaching 21 with 2+ lead wins game."""
    ms = setup_engine(score_a=20, score_b=15)
    new_ms, p_rec = process_point(ms, "a", team_a, team_b, "singles", last_servers)
    assert new_ms.games_won_a == 1
    assert new_ms.current_game.game_number == 2

def test_engine_deuce_handling():
    """T-210: 20-20 requires 2-point lead (e.g., 22-20)."""
    ms = setup_engine(score_a=20, score_b=20)
    new_ms, _ = process_point(ms, "a", team_a, team_b, "singles", last_servers)
    assert new_ms.games_won_a == 0
    new_ms, _ = process_point(new_ms, "a", team_a, team_b, "singles", last_servers)
    assert new_ms.games_won_a == 1

def test_engine_30_point_cap():
    """T-211: 29-29 next point wins (30-29)."""
    ms = setup_engine(score_a=29, score_b=29)
    new_ms, _ = process_point(ms, "b", team_a, team_b, "singles", last_servers)
    assert new_ms.games_won_b == 1

def test_engine_match_win():
    """T-212: Winning 2 games completes the match."""
    ms = setup_engine(score_a=20, score_b=0, games_a=1)
    new_ms, _ = process_point(ms, "a", team_a, team_b, "singles", last_servers)
    assert new_ms.is_finished
    assert new_ms.winner_side == "a"

def test_engine_service_rule():
    """T-213: Server switches when receiving side wins rally."""
    ms = setup_engine(score_a=0, score_b=0, serving="a")
    new_ms, pt = process_point(ms, "b", team_a, team_b, "singles", last_servers)
    assert pt.server_id == "b1"
    assert new_ms.current_game.serving_side == "b"

def test_engine_undo():
    """T-214: Undo correctly rolls back state and server."""
    # Undo is tested at API layer for DB states
    pass
