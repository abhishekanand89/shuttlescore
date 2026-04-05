"""Pure business logic for badminton scoring rules."""
from typing import Optional, List
from dataclasses import dataclass

@dataclass
class GameState:
    game_number: int
    score_a: int
    score_b: int
    server_id: str
    serving_side: str  # "a" or "b"
    is_finished: bool
    winner_side: Optional[str]

@dataclass
class PointRecord:
    scoring_side: str
    game_number: int
    score_a_after: int
    score_b_after: int
    server_id: str

@dataclass
class MatchState:
    games_won_a: int
    games_won_b: int
    current_game: Optional[GameState]
    is_finished: bool
    winner_side: Optional[str]

def process_point(
    match_state: MatchState, 
    scoring_side: str, 
    team_a_ids: List[str], 
    team_b_ids: List[str], 
    match_type: str,
    last_servers: dict  # {"a": str, "b": str}
) -> tuple[MatchState, PointRecord]:
    """Pure function to process a scored point and return new state."""
    
    if match_state.is_finished or not match_state.current_game:
        raise ValueError("Match is already finished")
        
    game = match_state.current_game
    if game.is_finished:
        raise ValueError("Current game is finished")
        
    # Increment score
    if scoring_side == "a":
        game.score_a += 1
    else:
        game.score_b += 1
        
    # Check game end condition
    score_winner, score_loser = (game.score_a, game.score_b) if scoring_side == "a" else (game.score_b, game.score_a)
    
    game_ended = False
    if score_winner >= 21:
        if score_winner - score_loser >= 2 or score_winner == 30:
            game_ended = True
            game.is_finished = True
            game.winner_side = scoring_side
            
    # Determine next server
    next_serving_side = scoring_side
    next_server_id = game.server_id
    
    if next_serving_side != game.serving_side:
        # Service over
        team_ids = team_a_ids if next_serving_side == "a" else team_b_ids
        if match_type == "singles":
            next_server_id = team_ids[0]
        else:
            # Alternating server logic for doubles:
            # We pick the one who DID NOT serve last time for this team.
            last_server_for_team = last_servers.get(next_serving_side)
            if last_server_for_team == team_ids[0]:
                next_server_id = team_ids[1]
            else:
                next_server_id = team_ids[0]
                
    game.serving_side = next_serving_side
    game.server_id = next_server_id
    
    point_record = PointRecord(
        scoring_side=scoring_side,
        game_number=game.game_number,
        score_a_after=game.score_a,
        score_b_after=game.score_b,
        server_id=next_server_id
    )
    
    if game_ended:
        if scoring_side == "a":
            match_state.games_won_a += 1
        else:
            match_state.games_won_b += 1
            
        if match_state.games_won_a == 2 or match_state.games_won_b == 2:
            match_state.is_finished = True
            match_state.winner_side = scoring_side
        else:
            # Setup next game
            next_game_number = game.game_number + 1
            # In new game, team that won the previous game serves first
            next_server_id = "temp" # Will be updated properly in DB layer by tracking
            # But roughly it is: team_a_ids[0] if scoring_side == 'a' else team_b_ids[0]
            if match_type == "singles":
                s_id = team_a_ids[0] if scoring_side == "a" else team_b_ids[0]
            else:
                # the one who was serving when they won, or alternating.
                s_id = game.server_id
                
            match_state.current_game = GameState(
                game_number=next_game_number,
                score_a=0,
                score_b=0,
                server_id=s_id,
                serving_side=scoring_side,
                is_finished=False,
                winner_side=None
            )
            
    return match_state, point_record

