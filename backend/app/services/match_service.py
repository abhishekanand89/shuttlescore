"""Match service dealing with database layer."""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.match import Match, GameResult, Point
from app.models.player import Player
from app.schemas.match import MatchCreate, MatchScoreUpdate
from app.services.scoring_engine import GameState, MatchState, process_point
import uuid

async def create_match(db: AsyncSession, data: MatchCreate) -> Match:
    """Create a new match."""
    # Basic validation
    if data.match_type not in ["singles", "doubles"]:
        raise ValueError("Invalid match type")
    if data.match_type == "singles" and (len(data.team_a_player_ids) != 1 or len(data.team_b_player_ids) != 1):
        raise ValueError("Singles requires exactly 1 player per team")
    if data.match_type == "doubles" and (len(data.team_a_player_ids) != 2 or len(data.team_b_player_ids) != 2):
        raise ValueError("Doubles requires exactly 2 players per team")

    all_ids = list(set(data.team_a_player_ids + data.team_b_player_ids))
    if data.first_server_id not in all_ids:
        raise ValueError("First server must be a participating player")

    # Fetch players to ensure they exist
    result = await db.execute(select(Player).where(Player.id.in_(all_ids)))
    players = result.scalars().all()
    if len(players) != len(all_ids):
        raise ValueError("One or more players not found")

    serving_side = "a" if data.first_server_id in data.team_a_player_ids else "b"

    match_id = str(uuid.uuid4())
    match = Match(
        id=match_id,
        match_type=data.match_type,
        status="in_progress",
        team_a_player_ids=data.team_a_player_ids,
        team_b_player_ids=data.team_b_player_ids,
        current_game_number=1,
        tournament_id=data.tournament_id
    )
    
    # We will compute the game state dynamically based on Point records. 
    # Let's seed the match with an initial "pseudo" point/state or just leave Points empty.
    # Actually, we need to know the initial server. We can record a Point with 0-0 so it captures the first server.
    # But usually, it's better to store first server on Match, but let's just create a point record 
    # or rely on scoring_engine logic starting from 0.
    
    db.add(match)
    await db.flush()
    # We will save the first server via a Point record? No, Point means score. 
    # Let's store first server in match? We forgot to add first_server to Match model.
    # Alternative: we can use a "game_starts" record, but let's just add the first server to GameResults? 
    # Let's just create an initial Point with 0-0 state to track who starts.
    p = Point(
        match_id=match_id,
        game_number=1,
        scoring_side="start", # special value just for tracking
        score_a_after=0,
        score_b_after=0,
        server_id=data.first_server_id
    )
    db.add(p)
    await db.commit()
    await db.refresh(match)
    return match

async def get_match(db: AsyncSession, match_id: str) -> Optional[Match]:
    result = await db.execute(
        select(Match)
        .options(selectinload(Match.points), selectinload(Match.games))
        .where(Match.id == match_id)
    )
    return result.scalar_one_or_none()

async def list_matches(db: AsyncSession, tournament_id: Optional[str] = None) -> List[Match]:
    query = select(Match).options(selectinload(Match.points), selectinload(Match.games)).order_by(Match.created_at.desc())
    if tournament_id:
        query = query.where(Match.tournament_id == tournament_id)
    result = await db.execute(query)
    return list(result.scalars().all())

def construct_match_state(match: Match) -> MatchState:
    """Rebuild the logic engine state from database points/games."""
    games_won_a = sum(1 for g in match.games if g.winner_side == "a")
    games_won_b = sum(1 for g in match.games if g.winner_side == "b")
    
    # Find points for current game
    pts = [p for p in match.points if p.game_number == match.current_game_number]
    
    if not pts:
        return MatchState(games_won_a, games_won_b, None, match.status == "completed", match.winner_side)
        
    last_p = pts[-1]
    
    # Is current game finished?
    game_finished = match.status == "completed" or any(g.game_number == match.current_game_number for g in match.games)
    
    serving_side = "a" if last_p.server_id in match.team_a_player_ids else "b"
    
    current_game = GameState(
        game_number=match.current_game_number,
        score_a=last_p.score_a_after,
        score_b=last_p.score_b_after,
        server_id=last_p.server_id,
        serving_side=serving_side,
        is_finished=game_finished,
        winner_side=None # Only populated during transition
    )
    
    return MatchState(
        games_won_a=games_won_a,
        games_won_b=games_won_b,
        current_game=current_game,
        is_finished=match.status == "completed",
        winner_side=match.winner_side
    )

async def score_point(db: AsyncSession, match_id: str, scoring_side: str) -> dict:
    match = await get_match(db, match_id)
    if not match:
        raise ValueError("Match not found")
        
    state = construct_match_state(match)
    
    # compute last servers for alternating
    last_servers = {"a": None, "b": None}
    for p in reversed(match.points):
        if last_servers["a"] and last_servers["b"]:
            break
        side = "a" if p.server_id in match.team_a_player_ids else "b"
        if not last_servers[side]:
            last_servers[side] = p.server_id
            
    new_state, point_record = process_point(
        match_state=state,
        scoring_side=scoring_side,
        team_a_ids=match.team_a_player_ids,
        team_b_ids=match.team_b_player_ids,
        match_type=match.match_type,
        last_servers=last_servers
    )
    
    # Save elements
    p = Point(
        match_id=match.id,
        game_number=point_record.game_number,
        scoring_side=point_record.scoring_side,
        score_a_after=point_record.score_a_after,
        score_b_after=point_record.score_b_after,
        server_id=point_record.server_id
    )
    db.add(p)
    
    if new_state.current_game and new_state.current_game.game_number > match.current_game_number:
        # Game ended
        g = GameResult(
            match_id=match.id,
            game_number=match.current_game_number,
            score_a=point_record.score_a_after,
            score_b=point_record.score_b_after,
            winner_side=scoring_side
        )
        db.add(g)
        match.current_game_number = new_state.current_game.game_number
        
        # Start new game with initial point marker if match didn't end
        if not new_state.is_finished:
            p_start = Point(
                match_id=match.id,
                game_number=new_state.current_game.game_number,
                scoring_side="start", 
                score_a_after=0,
                score_b_after=0,
                server_id=new_state.current_game.server_id
            )
            db.add(p_start)
        
    if new_state.is_finished:
        match.status = "completed"
        match.winner_side = new_state.winner_side
        if not next((x for x in match.games if x.game_number == point_record.game_number), None):
             # Ensure last game result is saved if match ends
             g = GameResult(
                match_id=match.id,
                game_number=point_record.game_number,
                score_a=point_record.score_a_after,
                score_b=point_record.score_b_after,
                winner_side=scoring_side
             )
             db.add(g)
        
    await db.commit()
    await db.refresh(match)
    return match

async def undo_point(db: AsyncSession, match_id: str) -> dict:
    match = await get_match(db, match_id)
    if not match:
        raise ValueError("Match not found")
        
    if len(match.points) <= 1:
        raise ValueError("No points to undo")
        
    last_point = match.points[-1]
    if last_point.scoring_side == "start":
        # we're at start of game > 1
        if match.current_game_number == 1:
            raise ValueError("Cannot undo initial match state")
        # delete "start" point and the GameResult of previous game
        await db.delete(last_point)
        g = next((x for x in match.games if x.game_number == match.current_game_number - 1), None)
        if g:
            await db.delete(g)
        # delete the actual winning point of prev game
        real_last_point = match.points[-2]
        await db.delete(real_last_point)
        
        match.current_game_number -= 1
        match.status = "in_progress"
        match.winner_side = None
    else:
        await db.delete(last_point)
        # If this point ended the match, revert it
        if match.status == "completed":
             match.status = "in_progress"
             match.winner_side = None
             g = next((x for x in match.games if x.game_number == match.current_game_number), None)
             if g:
                 await db.delete(g)
                 
    await db.commit()
    await db.refresh(match)
    return match
