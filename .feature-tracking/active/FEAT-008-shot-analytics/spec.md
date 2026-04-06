# FEAT-008: Shot & Rally Analytics

## Summary
Surface the point metadata collected in FEAT-007 (detailed mode) as meaningful per-player statistics: shot type breakdown, point end reason breakdown, average rally duration, and serve error rate.

## User Stories

- **US-1**: As a player, I want to see which shot types I win points with most so I can understand my strengths.
- **US-2**: As a player, I want to see how my points end (winners, errors, serve faults) so I can spot patterns in my game.
- **US-3**: As a player, I want to see my average rally duration so I can understand my play style (aggressive vs. long rallies).
- **US-4**: As a player, I want to see my serve error rate so I can track service consistency.
- **US-5**: As a user, I want the analytics to gracefully show "no detailed data yet" when a player has only played summary/sequence matches.

## Acceptance Criteria

### AC-1: Shot breakdown endpoint
- `GET /api/analytics/players/{player_id}/shots` returns:
  - `total_detailed_points`: count of points with any metadata in player's matches
  - `avg_rally_duration_seconds`: average across points with duration recorded
  - `shots`: list of `{ shot_type, count, wins, win_rate }` sorted by count desc — only points where `winning_player_id == player_id`
  - `end_reasons`: list of `{ reason, count, percentage }` sorted by count desc — all detailed points in player's matches
  - `serve_error_rate`: serve_error points where `server_id == player_id` / total serves by player (null if no serve data)

### AC-2: Player detail page — Shot Analytics section
- Shown below the existing stats cards
- Horizontal bar rows for shot types (count + win rate bar)
- Horizontal bar rows for end reasons (count + percentage bar)
- Rally duration and serve error rate shown as stat cards
- "No detailed match data yet" empty state when `total_detailed_points == 0`

### AC-3: Analytics leaderboard — rally time column
- Leaderboard adds `avg_rally_duration_seconds` column (shown as "Avg Rally")
- Hidden / shown as "—" for players with no detailed data

## Out of Scope
- Shot analytics on the leaderboard ranking (keeps ranking by wins only)
- Head-to-head shot comparison
- Shot heatmap / court visualisation
