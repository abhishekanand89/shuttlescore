# Test Plan: FEAT-003 Tournament Management

## Unit & API Test Strategy (Backend)
Tests will be constructed in `tests/api/test_tournaments.py` to target the CRUD properties of Tournaments and its relational filtering against Matches.

| Test ID | Name | Description | Related AC |
|---------|------|-------------|------------|
| T-301 | `test_create_tournament_success` | Verifies a tournament translates properly into schema returns. | AC-1, AC-2 |
| T-302 | `test_create_tournament_validation` | Ensures missing required properties fail with 422 standard. | AC-1 |
| T-303 | `test_list_tournaments` | Checks `GET /api/tournaments` returns created items. | AC-5 |
| T-304 | `test_create_match_with_tournament` | Assigns an active `tournament_id` to `POST /api/matches`, expects success and linkage. | AC-3, AC-4 |
| T-305 | `test_list_matches_by_tournament_filter` | Ensures `GET /api/matches?tournament_id=X` correctly bounds outputs. | AC-6 |
| T-306 | `test_get_tournament_detail` | Validates `GET /api/tournaments/{id}` outputs tournament metadata cleanly. | AC-6 |

## UI Testing Strategy (Frontend)
Validation verified implicitly during Frontend Component testing run through build execution logic. 

**UI Components Expected**:
1. `TournamentPage`: Renders `<div className="tournaments">` mapping statuses correctly.
2. `CreateMatchPage`: Verifies select/options mapping `active` tournaments cleanly handles form submission.
