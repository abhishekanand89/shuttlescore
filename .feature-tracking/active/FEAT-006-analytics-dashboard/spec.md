# FEAT-006: Analytics Dashboard

## Summary
Add an analytics page to view player performance statistics including win/loss records, total games played, and tournament medals.

## User Stories

- **US-1**: As a player, I want to see my overall win/loss record across all completed matches so I can track my performance.
- **US-2**: As a player, I want to see total games played (individual games within matches) so I know my game activity.
- **US-3**: As a player, I want to see my tournament participation and medal count so I can see my competitive history.
- **US-4**: As a user, I want to see a leaderboard of all players ranked by wins so I can compare performance.
- **US-5**: As a user, I want player stats shown on the player detail page so profile information is complete.

## Acceptance Criteria

### AC-1: Player stats endpoint
- `GET /api/analytics/players/{player_id}` returns:
  - Match stats: total, wins, losses, win_rate (0.0–1.0)
  - Game stats: total, wins, losses
  - Tournament stats: participated count, per-tournament W/L medals

### AC-2: Leaderboard endpoint
- `GET /api/analytics/leaderboard` returns all players sorted by wins (desc), then win_rate (desc)
- Each entry: rank, player_id, player_name, matches_played, wins, losses, win_rate

### AC-3: Analytics page (leaderboard)
- Route `/analytics` renders leaderboard table
- Shows rank, name, W/L, win rate for each player
- Nav item added to bottom navigation

### AC-4: Player detail page stats
- Replace placeholder "—" fields with real data from analytics endpoint
- Show Matches Played, Wins, Win Rate, Tournaments

### AC-5: Tournament medals on analytics page
- Per-tournament W/L breakdown shown in player stats
- Gold/Silver/Bronze medal type based on tournament win/loss ratio

## Out of Scope
- Head-to-head statistics
- Elo/rating system
- Date range filtering
- Match history drill-down
- Real-time updates
