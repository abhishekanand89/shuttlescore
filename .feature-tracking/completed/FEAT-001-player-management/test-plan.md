# Test Plan: FEAT-001 — Player Management

## Overview
- **Feature**: FEAT-001 Player Management
- **Spec Reference**: `.feature-tracking/active/FEAT-001-player-management/spec.md`
- **Total Test Cases**: 14
- **Test Types**: api (10), unit (2), e2e (2)

## Test Cases

### AC-1: Player Registration

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-001 | `test_create_player_success` | api | critical | POST /api/players with valid name+phone → 201, returns player with UUID |
| T-002 | `test_create_player_invalid_name` | api | critical | POST with name < 2 chars → 422 |
| T-003 | `test_create_player_invalid_phone` | api | critical | POST with malformed phone → 422 |

### AC-2: Duplicate Phone Prevention

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-004 | `test_create_player_duplicate_phone` | api | critical | POST with existing phone → 409 |

### AC-3: Player List

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-005 | `test_list_players` | api | critical | GET /api/players → 200, returns array of players with masked phones |
| T-006 | `test_list_players_search` | api | important | GET /api/players?search=john → filtered results |
| T-007 | `test_list_players_empty` | api | important | GET /api/players with no data → 200, empty array |

### AC-4: Player Profile View

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-008 | `test_get_player_by_id` | api | critical | GET /api/players/{id} → 200, full player data |
| T-009 | `test_get_player_not_found` | api | critical | GET /api/players/{bad-id} → 404 |

### AC-5: Player Name Update

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-010 | `test_update_player_name` | api | critical | PUT /api/players/{id} with new name → 200, name updated |
| T-011 | `test_update_player_not_found` | api | important | PUT /api/players/{bad-id} → 404 |

### AC-6: Backend Health Check

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-012 | `test_health_check` | api | critical | GET /api/health → 200, { success: true, data: { status: "healthy" } } |

## Edge Cases & Error Handling

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-E01 | `test_phone_normalization` | unit | important | Phone "  +91-98765 43210 " normalizes to "9876543210" |
| T-E02 | `test_phone_masking` | unit | important | Phone "9876543210" masks to "******3210" |

## Test File Mapping

| Test File | Test IDs | Directory |
|-----------|----------|-----------|
| `test_health.py` | T-012 | tests/api/ |
| `test_players.py` | T-001 to T-011 | tests/api/ |
| `test_phone_utils.py` | T-E01, T-E02 | tests/unit/ |

## Test Dependencies
- `httpx` — async test client for FastAPI
- `pytest-asyncio` — async test support
- SQLite in-memory database for test isolation
