# Architecture: FEAT-009 Match Format & Rally Gate

## Backend

### scoring_engine.py
- `process_point()` gains `games_to_win: int = 2` parameter
- Win condition changed from `>= 2` to `>= games_to_win`

### match_service.py
- `score_point()` computes `games_to_win = 1 if match.match_format == "bo1" else 2`
- Passes `games_to_win` to `process_point()`
- `create_match()` validates `match_format` against `VALID_MATCH_FORMATS`

### matches.py (API)
- `_build_match_response()` now includes `match_format` field

## Frontend

### client.ts
- `MatchData` + `match_format: "bo1" | "bo3"`
- `CreateMatchData` + `match_format?: "bo1" | "bo3"`

### CreateMatchPage.tsx
- Format toggle buttons ("1 Game" / "Best of 3") added above team selector
- Sends `match_format` in `matchApi.create()` payload

### LiveScorePage.tsx
- `rallyState: "in_rally" | "between_rallies"` state (starts `"between_rallies"`)
- Timer only ticks when `rallyState === "in_rally"`
- After scoring: set `rallyState = "between_rallies"`
- "Start Rally" button shown when `between_rallies` and no metadata sheet open
- `handleStartRally()`: resets timer, sets `rallyState = "in_rally"`
- `renderGameDots()` uses `gamesNeededToWin` (1 for bo1, 2 for bo3)
