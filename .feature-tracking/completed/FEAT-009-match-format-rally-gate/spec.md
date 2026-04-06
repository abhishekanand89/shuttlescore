# FEAT-009: Match Format & Rally Gate

## Summary
Two enhancements to the live scoring flow:
1. **Match format**: a match can be a single game (bo1) or best of 3 (bo3)
2. **Rally gate**: a "Start Rally" button must be tapped before scoring a point, giving players time to collect the shuttle and get ready

## User Stories

- **US-1**: As a scorer, I want to create a 1-game match so I can record shorter casual games without needing to win 2 games.
- **US-2**: As a scorer, I want the next point to not begin immediately after the previous one ends, so the timer doesn't run during shuttle collection.
- **US-3**: As a scorer, I want clear visual feedback on whether a rally is active or waiting to start.

## Acceptance Criteria

### AC-1: Match format selection
- `POST /api/matches` accepts `match_format: "bo1" | "bo3"` (default `"bo3"`)
- bo1: match completes after one team wins 1 game (respecting all deuce rules)
- bo3: match completes after one team wins 2 games (existing behaviour)
- `match_format` is returned in all match response payloads
- Invalid values return 422

### AC-2: Format toggle in UI
- Create Match page shows a "1 Game / Best of 3" toggle (default: Best of 3)
- Game dots on the live score page adapt: 1 dot for bo1, 2 dots for bo3

### AC-3: Rally gate
- After scoring a point (and dismissing the detail sheet in detailed mode), score buttons are replaced by a full-width "🏸 Start Rally" button
- Tapping "Start Rally" resets the rally timer and shows score buttons
- Timer only ticks while a rally is in progress (paused label shown when waiting)
- Initial state on page load is "between rallies"

## Out of Scope
- Server-side rally timing (gate is frontend only)
- bo5 format
