# Test Plan: FEAT-002 — Match Scoring

## Overview
- **Feature**: FEAT-002 Match Scoring
- **Spec Reference**: `.feature-tracking/active/FEAT-002-match-scoring/spec.md`
- **Total Test Cases**: 14
- **Test Types**: api (7), unit (7)

## Test Cases

### Match API (CRUD & Actions)

| ID | Test Name | Type | Priority | Description | AC |
|----|-----------|------|----------|-------------|----|
| T-201 | `test_create_singles_match` | api | critical | POST /api/matches creates a singles match | AC-1 |
| T-202 | `test_create_doubles_match` | api | critical | POST /api/matches creates a doubles match | AC-2 |
| T-203 | `test_create_match_validation` | api | important | POST /api/matches handles invalid player IDs | AC-1 |
| T-204 | `test_list_matches` | api | important | GET /api/matches returns active/completed match lists | AC-11 |
| T-205 | `test_get_match` | api | critical | GET /api/matches/{id} returns full state | AC-10 |
| T-206 | `test_score_point_api` | api | critical | POST /matches/{id}/points updates score | AC-3 |
| T-207 | `test_undo_point_api` | api | critical | POST /matches/{id}/undo reverses last point | AC-8 |

### Scoring Engine (Unit Tests)

| ID | Test Name | Type | Priority | Description | AC |
|----|-----------|------|----------|-------------|----|
| T-208 | `test_engine_standard_point` | unit | critical | Process standard point & increment score | AC-3 |
| T-209 | `test_engine_game_end_21` | unit | critical | Side reaching 21 with 2+ lead wins game | AC-4 |
| T-210 | `test_engine_deuce_handling` | unit | critical | 20-20 requires 2-point lead (e.g., 22-20) | AC-5 |
| T-211 | `test_engine_30_point_cap` | unit | critical | 29-29 next point wins (30-29) | AC-6 |
| T-212 | `test_engine_match_win` | unit | critical | Winning 2 games completes the match | AC-7 |
| T-213 | `test_engine_service_rule` | unit | critical | Server switches when receiving side wins rally | AC-9 |
| T-214 | `test_engine_undo` | unit | critical | Undo correctly rolls back state and server | AC-8 |

## Test File Mapping

| Test File | Test IDs | Directory |
|-----------|----------|-----------|
| `test_matches.py` | T-201 to T-207 | tests/api/ |
| `test_scoring_engine.py` | T-208 to T-214 | tests/unit/ |

## Test Dependencies
- Database fixtures for matches and players
- Pure engine tests don't require DB
