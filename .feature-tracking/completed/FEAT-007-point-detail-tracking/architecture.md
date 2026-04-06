# FEAT-007: Architecture

## Backend

### Modified Files
- `backend/app/models/match.py` — `Match.tracking_level`, `Point` +4 nullable columns
- `backend/app/schemas/match.py` — `PointMetadataUpdate`, `GameScoreInput`, `MatchSummarySubmit`, `VALID_*` constants
- `backend/app/services/match_service.py` — `update_point_metadata()`, `_validate_game_score()`, `submit_match_summary()`
- `backend/app/api/matches.py` — PATCH + POST summary endpoints, `_build_match_response` updated

### New Endpoints

#### PATCH /api/matches/{match_id}/points/{point_id}
```json
Request:  { "rally_duration_seconds": 8, "point_end_reason": "winner", "shot_type": "smash", "winning_player_id": "uuid" }
Response: { "success": true, "data": { "id": 12, "rally_duration_seconds": 8, ... } }
```

#### POST /api/matches/{match_id}/summary
```json
Request:  { "games": [{"score_a": 21, "score_b": 15}, {"score_a": 21, "score_b": 18}] }
Response: { "success": true, "data": <full MatchResponse> }
```

### Validation Rules (score)
- Standard: winner == 21, loser ≤ 19
- Deuce:    22 ≤ winner ≤ 30, winner == loser + 2, loser ≥ 20
- Cap:      30-29

### Valid Enum Values
- `point_end_reason`: winner | unforced_error | forced_error | serve_error | net_error | line_out
- `shot_type`: smash | drop | clear | lob | drive | net_shot | serve | flick | push | lift

## Frontend

### New Files
- `frontend/src/pages/SummaryScorePage.tsx` + `.css` — game score entry with live validation
- `frontend/src/components/PointDetailSheet.tsx` + `.css` — bottom sheet for point metadata

### Modified Files
- `frontend/src/api/client.ts` — `TrackingLevel`, `PointDetail`, `PointMetadataUpdate`, `GameScoreInput`; `matchApi.updatePointMetadata()`, `matchApi.submitSummary()`
- `frontend/src/pages/CreateMatchPage.tsx` — tracking level selector; routes to summary or live page
- `frontend/src/pages/LiveScorePage.tsx` — rally timer, detail sheet trigger, point history strip with retroactive edit
- `frontend/src/pages/LiveScorePage.css` — timer + history styles
- `frontend/src/App.tsx` — `/matches/:id/summary` route
