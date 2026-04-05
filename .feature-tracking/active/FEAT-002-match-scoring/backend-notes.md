# Backend Notes: FEAT-002 Match Scoring

## Agent
backend

## What Was Built
- Models: `Match`, `GameResult`, `Point` to track full point-by-point history
- Schemas: Full API request/response representations mapped to BWF rules state
- Scoring Engine: Pure-function layer for computing game rules (deuce, 30-pt cap, match win, service switches)
- API Routes: 5 endpoints to manage matches (create, get, list, score_point, undo_point)

## API Endpoints
| Method | Path | Request Body | Response | Notes |
|--------|------|-------------|----------|-------|
| POST | `/api/matches` | `{match_type, team_a_ids, team_b_ids, first_server_id}` | Full match state | |
| GET | `/api/matches` | — | list of match objects | |
| GET | `/api/matches/{id}` | — | Full match state | |
| POST | `/api/matches/{id}/points` | `{scoring_side: "a"\|"b"}` | updated game state | |
| POST | `/api/matches/{id}/undo` | — | updated game state | |

## Deviations from Architecture
- Added `MatchListItem` separate schema for faster `/matches` list response.
- `team_a_player_ids` and `team_b_player_ids` stored directly on Match model instead of deeply relational, simplifying queries while allowing pure function engine input.

## Features
- Fully point-by-point history tracking.
- Realtime match continuation state computing directly off history (safe logic rebuild pattern).
- Handles game win at 21, deuce advantage logic, max 30-29 cap, and match win.

## Files Created/Modified
| File | Purpose |
|------|---------|
| `backend/app/models/match.py` | ORM Models |
| `backend/app/schemas/match.py` | Pydantic Schemas |
| `backend/app/services/scoring_engine.py` | Pure Business logic for BWF rules |
| `backend/app/services/match_service.py` | DB-coupled match modifications |
| `backend/app/api/matches.py` | Controller endpoints |

## Known Limitations
None. All 14 tests pass.
