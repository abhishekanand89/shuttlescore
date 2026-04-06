# FEAT-007: Point Detail Tracking

## Summary
Three-level match tracking system: summary (final scores only), sequence (per-rally taps, existing behaviour), and detailed (per-point metadata: rally time, end reason, shot type, winning player). All metadata fields are optional.

## User Stories

- **US-1**: As a recorder, I want to choose how much detail to capture at match creation so I can balance speed vs. analysis depth.
- **US-2**: As a recorder, I want to enter final game scores directly (summary mode) without tapping each point.
- **US-3**: As a recorder, I want the app to validate my summary scores against badminton rules before saving.
- **US-4**: As a recorder, I want a post-point sheet (detailed mode) that pre-fills the rally timer so I can quickly log the winning shot.
- **US-5**: As a recorder, I want to retroactively add or edit metadata on any point in the match without re-entering scores.

## Acceptance Criteria

### AC-1: Tracking level on match
- `Match.tracking_level` persisted; returned in every match response.
- Valid values: `summary | sequence | detailed`.

### AC-2: PATCH point metadata
- `PATCH /api/matches/{id}/points/{point_id}` updates nullable fields.
- Invalid `point_end_reason` or `shot_type` values → 400.
- Wrong `match_id` → 404.
- Works retroactively on any point in the match.

### AC-3: Summary submission
- `POST /api/matches/{id}/summary` accepts 2-or-3 game scores.
- Enforces full badminton score rules (21-x, 22-20 through 30-28, 30-29).
- Rejected for non-summary matches (400).
- Rejected if submitted scores produce no clear winner (400).
- Completes the match and populates `GameResult` records.

### AC-4: Detailed mode UI
- Rally timer visible and counting during a rally.
- `PointDetailSheet` slides up after each point in detailed mode.
- Pre-fills timer duration; all fields optional (Skip skips cleanly).
- Point history strip shows last 10 points; each tappable for retroactive edit.

### AC-5: Summary mode UI
- `/matches/:id/summary` page with per-game score inputs.
- Live client-side score validation with error messages.
- 3rd game row appears/disappears automatically based on first two game outcomes.

## Out of Scope
- Shot analytics breakdowns on the analytics page (FEAT-008 candidate)
- Video/photo attachment per point
- Rally count tracking separate from duration
