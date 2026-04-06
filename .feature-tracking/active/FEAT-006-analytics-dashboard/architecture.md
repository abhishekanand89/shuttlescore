# FEAT-006: Architecture

## Backend

### New Files
- `backend/app/schemas/analytics.py` — Pydantic response schemas
- `backend/app/services/analytics_service.py` — Stats computation logic
- `backend/app/api/analytics.py` — Route handlers

### Modified Files
- `backend/app/main.py` — Register analytics router

### API Contracts

#### GET /api/analytics/players/{player_id}
```json
{
  "success": true,
  "data": {
    "player_id": "uuid",
    "player_name": "string",
    "matches": { "total": 5, "wins": 3, "losses": 2, "win_rate": 0.6 },
    "games": { "total": 12, "wins": 8, "losses": 4 },
    "tournaments": {
      "participated": 2,
      "medals": [
        { "tournament_id": "uuid", "tournament_name": "string", "wins": 2, "losses": 1, "medal": "gold" }
      ]
    }
  }
}
```

#### GET /api/analytics/leaderboard
```json
{
  "success": true,
  "data": [
    { "rank": 1, "player_id": "uuid", "player_name": "string", "matches_played": 10, "wins": 7, "losses": 3, "win_rate": 0.7 }
  ]
}
```

### Analytics Logic
- **Match win**: Player in `team_a_player_ids` and `winner_side == "a"`, or in `team_b_player_ids` and `winner_side == "b"`
- **Match loss**: Participated but on the losing side
- **Game stats**: Count from GameResult rows where player is in that match's team
- **Tournament medal**: For each distinct tournament in completed matches:
  - gold: wins > losses
  - silver: wins == losses (and wins > 0)
  - bronze: losses > wins (but participated)
- Only completed matches count for wins/losses

## Frontend

### New Files
- `frontend/src/pages/AnalyticsPage.tsx`
- `frontend/src/pages/AnalyticsPage.css`

### Modified Files
- `frontend/src/api/client.ts` — Analytics types + `analyticsApi`
- `frontend/src/App.tsx` — Add `/analytics` route
- `frontend/src/components/Layout.tsx` — Add analytics nav item
- `frontend/src/pages/PlayerDetailPage.tsx` — Fetch + display real stats

### Component Hierarchy
```
AnalyticsPage
  LeaderboardTable
    LeaderboardRow (per player)

PlayerDetailPage (updated)
  StatsGrid (reuses detail-card, now populated)
  TournamentMedals (new section)
```
