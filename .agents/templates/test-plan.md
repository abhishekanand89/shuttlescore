# Test Plan: FEAT-XXX <Feature Name>

## Overview
- **Feature**: FEAT-XXX
- **Spec Reference**: `.feature-tracking/active/FEAT-XXX-<slug>/spec.md`
- **Total Test Cases**: X
- **Test Types**: unit (X), integration (X), api (X), e2e (X)

## Test Cases

### AC-1: <Acceptance Criterion Title>

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-001 | `test_descriptive_name` | unit/api/e2e | critical/important/nice-to-have | What is verified: input → expected output |
| T-002 | `test_descriptive_name` | unit/api/e2e | critical/important/nice-to-have | What is verified: input → expected output |

### AC-2: <Acceptance Criterion Title>

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-003 | `test_descriptive_name` | unit/api/e2e | critical/important/nice-to-have | What is verified |

### AC-3: <Acceptance Criterion Title>

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-004 | `test_descriptive_name` | unit/api/e2e | critical/important/nice-to-have | What is verified |

## Edge Cases & Error Handling

| ID | Test Name | Type | Priority | Description |
|----|-----------|------|----------|-------------|
| T-E01 | `test_invalid_input_returns_400` | api | critical | Verify error response for malformed input |
| T-E02 | `test_unauthenticated_returns_401` | api | critical | Verify auth middleware blocks unauthenticated requests |

## Test File Mapping

| Test File | Test IDs | Directory |
|-----------|----------|-----------|
| `test_feature_unit.ext` | T-001, T-002 | tests/unit/ |
| `test_feature_api.ext` | T-003, T-E01, T-E02 | tests/api/ |
| `test_feature_e2e.ext` | T-004 | tests/e2e/ |

## Untestable Criteria (if any)
<!-- List any acceptance criteria that cannot be automated and why -->
- AC-X: <reason it can't be automated> → **Manual test required**

## Test Dependencies
<!-- External services, test databases, fixtures needed -->
- Dependency 1: <description>
