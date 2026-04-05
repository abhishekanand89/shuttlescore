# Technical Architecture: FEAT-002 — Match Scoring

## Backend Scope

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/matches` | no | Create a new match |
| GET | `/api/matches` | no | List matches (active + recent) |
| GET | `/api/matches/{id}` | no | Get full match state |
| POST | `/api/matches/{id}/points` | no | Score a point |
| POST | `/api/matches/{id}/undo` | no | Undo last point |

#### `POST /api/matches`
**Request**:
```typescript
{
  match_type: "singles" | "doubles",
  team_a_player_ids: string[],    // 1 for singles, 2 for doubles
  team_b_player_ids: string[],    // 1 for singles, 2 for doubles
  first_server_id: string         // player who serves first
}
```
**Response (201)**:
```typescript
{
  success: true,
  data: {
    id: string,
    match_type: "singles" | "doubles",
    status: "in_progress",
    team_a: { players: Player[], games_won: 0 },
    team_b: { players: Player[], games_won: 0 },
    current_game: {
      game_number: 1,
      score_a: 0,
      score_b: 0,
      server_id: string,
      serving_side: "a"
    },
    games: [],
    created_at: string
  }
}
```
**Errors**: 422 (validation), 404 (player not found)

#### `GET /api/matches`
**Query**: `?status=in_progress|completed` (optional)
**Response (200)**:
```typescript
{
  success: true,
  data: Array<{
    id: string,
    match_type: "singles" | "doubles",
    status: "in_progress" | "completed",
    team_a: { player_names: string[], games_won: number },
    team_b: { player_names: string[], games_won: number },
    current_score: { a: number, b: number } | null,
    winner_side: "a" | "b" | null,
    created_at: string
  }>
}
```

#### `GET /api/matches/{id}`
**Response (200)**: Full match state (same as creation response + point history)
```typescript
{
  success: true,
  data: {
    id: string,
    match_type: string,
    status: string,
    team_a: { players: Player[], games_won: number },
    team_b: { players: Player[], games_won: number },
    current_game: {
      game_number: number,
      score_a: number,
      score_b: number,
      server_id: string,
      serving_side: "a" | "b"
    } | null,
    games: Array<{
      game_number: number,
      score_a: number,
      score_b: number,
      winner_side: "a" | "b"
    }>,
    points: Array<{
      id: number,
      scoring_side: "a" | "b",
      game_number: number,
      score_a_after: number,
      score_b_after: number,
      server_id: string,
      timestamp: string
    }>,
    winner_side: "a" | "b" | null,
    created_at: string
  }
}
```

#### `POST /api/matches/{id}/points`
**Request**:
```typescript
{
  scoring_side: "a" | "b"
}
```
**Response (200)**:
```typescript
{
  success: true,
  data: {
    point: { id, scoring_side, game_number, score_a_after, score_b_after, server_id },
    current_game: { game_number, score_a, score_b, server_id, serving_side },
    game_ended: boolean,
    match_ended: boolean,
    winner_side: "a" | "b" | null
  }
}
```
**Errors**: 400 (match already completed), 404

#### `POST /api/matches/{id}/undo`
**Response (200)**:
```typescript
{
  success: true,
  data: {
    undone_point: { id, scoring_side, game_number },
    current_game: { game_number, score_a, score_b, server_id, serving_side },
    game_restored: boolean  // true if undo reversed a game-end
  }
}
```
**Errors**: 400 (no points to undo), 404

### Data Models

```python
class Match:
    id: UUID              # PK
    match_type: str       # "singles" | "doubles"
    status: str           # "in_progress" | "completed"
    team_a_player_ids: JSON  # list of player UUIDs
    team_b_player_ids: JSON  # list of player UUIDs
    current_game_number: int  # 1, 2, or 3
    winner_side: str | None   # "a" | "b" | null
    created_at: datetime
    updated_at: datetime

class GameResult:
    id: int               # PK auto
    match_id: UUID        # FK → Match
    game_number: int      # 1, 2, 3
    score_a: int
    score_b: int
    winner_side: str      # "a" | "b"

class Point:
    id: int               # PK auto
    match_id: UUID        # FK → Match
    game_number: int
    scoring_side: str     # "a" | "b"
    score_a_after: int
    score_b_after: int
    server_id: UUID       # FK → Player
    created_at: datetime
```

### Scoring Engine (Business Logic)

The scoring engine is the core service. It is a **pure function layer** that takes the current state and returns the new state. No database calls inside the engine.

```python
# app/services/scoring_engine.py

class GameState:
    game_number: int
    score_a: int
    score_b: int
    server_id: str
    serving_side: str  # "a" | "b"
    is_finished: bool
    winner_side: str | None

class MatchState:
    games_won_a: int
    games_won_b: int
    current_game: GameState | None
    is_finished: bool
    winner_side: str | None

def process_point(match_state, scoring_side, team_a_ids, team_b_ids) -> (MatchState, PointRecord):
    """Process a single point. Returns new state + point record."""

def undo_point(match_state, last_point, team_a_ids, team_b_ids) -> MatchState:
    """Reverse the last point. Returns previous state."""

def determine_server(current_server_id, scoring_side, serving_side, 
                     match_type, team_a_ids, team_b_ids) -> (str, str):
    """Determine who serves next and from which side."""
```

**Badminton rules encoded**:
- Game to 21 points
- At 20-20: need 2-point lead (deuce)
- At 29-29: next point wins (30-point cap)
- Best of 3 games wins the match
- Server switches when receiving side wins the rally
- Sides change after each game (and at 11 in game 3)

## Frontend Scope

### New Pages/Components

```
App (updated routes)
├── MatchesPage
│   ├── MatchCard[] (active/completed matches)
│   └── FAB → CreateMatchPage
├── CreateMatchPage
│   ├── MatchTypeToggle (singles/doubles)
│   ├── PlayerSelector (search + select)
│   └── ServerSelector (who serves first)
├── LiveScorePage
│   ├── ScoreDisplay (large, central)
│   │   ├── TeamScore (side A)
│   │   ├── TeamScore (side B)
│   │   └── GameIndicator (game dots)
│   ├── ServingIndicator (shuttlecock icon)
│   ├── ScoreButtons (tap to score, full-width for each side)
│   ├── UndoButton
│   ├── GamesHistory (completed games)
│   └── MatchResult overlay (when match ends)
```

### Routing

| Route | Component | New |
|-------|-----------|-----|
| `/matches` | MatchesPage | new |
| `/matches/new` | CreateMatchPage | new |
| `/matches/:id` | LiveScorePage | new |

### UI Design for LiveScorePage

The scoring screen is the most critical UI — it must be:
- **Operable one-handed** on a mobile phone
- **Score buttons occupy the bottom 50%** of the screen (large tap targets)
- **Score display is visible from a distance** (large numbers)
- **Side A on left, Side B on right** — consistent layout
- **Color-coded**: Side A = blue gradient, Side B = orange gradient
- **Server indicator**: Shuttlecock icon next to the serving player's name

### State Management
- LiveScorePage maintains match state locally + syncs with backend on each point
- Optimistic updates: UI updates immediately, rolls back on API error
- `useMatch` custom hook for match state + actions

## Integration Points
- Depends on player list from FEAT-001 (`GET /api/players`)
- Updates nav to enable "Matches" tab
- Home page stats updated (match count)

## Security Considerations
- No auth — any user can score/undo (scorer trust model)
- Rate limit on score endpoint to prevent accidental double-taps (debounce on frontend)
