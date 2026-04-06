# Architecture: FEAT-008 Shot & Rally Analytics

## Backend

### New endpoint
`GET /api/analytics/players/{player_id}/shots` → `ShotAnalytics`

### New service function
`analytics_service.get_player_shot_analytics(db, player_id)`:
- Loads all matches where player participates (via JSON array containment)
- Loads points via `selectinload(Match.points)`
- Computes: shot type breakdown (where winning_player_id == player), end reason breakdown (all detailed pts), avg rally duration, serve error rate

### Schema additions (`schemas/analytics.py`)
- `ShotBreakdown`: shot_type, label, count, wins, win_rate
- `EndReasonBreakdown`: reason, label, count, percentage
- `ShotAnalytics`: total_detailed_points, avg_rally_duration_seconds, shots, end_reasons, serve_error_rate
- `LeaderboardEntry` extended: + avg_rally_duration_seconds

## Frontend

### New component: `ShotStatsSection.tsx`
- 3 stat cards: Avg Rally, Serve Error Rate, Detailed Points
- Bar rows for winning shots and end reasons
- Empty state when total_detailed_points == 0

### Updated pages
- `PlayerDetailPage.tsx`: fetches `analyticsApi.getPlayerShots()`, renders `<ShotStatsSection />`
- `AnalyticsPage.tsx`: leaderboard grid 4→5 columns, adds "Avg Rally" column
- `client.ts`: new types, `analyticsApi.getPlayerShots()`
