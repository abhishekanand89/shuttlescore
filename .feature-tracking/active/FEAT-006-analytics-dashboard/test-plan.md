# FEAT-006: Test Plan

## Backend Tests (tests/api/test_analytics.py)

### AC-1: Player stats endpoint
- T-01: Player with no matches → all zeros, empty medals list
- T-02: Player with completed wins → correct wins/losses/win_rate
- T-03: Player with tournament matches → tournament medals populated
- T-04: Invalid player ID → 404

### AC-2: Leaderboard endpoint
- T-05: Empty database → empty list
- T-06: Multiple players → sorted by wins desc
- T-07: Tie in wins → sorted by win_rate desc

## Frontend (manual verification)
- Analytics nav item visible in bottom nav
- `/analytics` route renders leaderboard
- Player detail page shows real match/win stats
- Tournament medals shown for players with tournament history
