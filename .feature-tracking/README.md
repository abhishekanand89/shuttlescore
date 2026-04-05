# Feature Tracking

This directory tracks features through the multi-agent development lifecycle.

## Directory Structure

- **`active/`** — Features currently in development (one subdirectory per feature)
- **`completed/`** — Features that have been merged to main
- **`rolled-back/`** — Features that were reverted after merge

## Feature Directory Contents

Each feature (e.g., `FEAT-001-user-auth/`) contains:

| File | Created By | Purpose |
|------|-----------|---------|
| `spec.md` | PM Agent | Feature specification with acceptance criteria |
| `architecture.md` | PM Agent | Technical architecture, API contracts, data models |
| `test-plan.md` | Test Agent | Test cases mapped to acceptance criteria |
| `backend-notes.md` | Backend Dev | Implementation notes and API documentation |
| `frontend-notes.md` | Frontend Dev | UI implementation notes and components |
| `test-evidence/verbose.md` | Test Agent | Full test output and logs |
| `test-evidence/summary.md` | Test Agent | Human-readable pass/fail summary |
| `audit-log.md` | Orchestrator | Chronological log of all agent actions |

## Naming Convention

- Features: `FEAT-XXX-<slug>` (e.g., `FEAT-001-user-auth`)
- Bugs: `BUG-XXX-<slug>` (e.g., `BUG-012-login-timeout`)
- Branches: `feat/FEAT-XXX-<slug>` or `fix/BUG-XXX-<slug>`

## Audit Trail

Every agent action is:
1. Recorded in the feature's `audit-log.md`
2. Committed as an atomic git commit with a conventional message
3. Traceable via `git log --oneline` on the feature branch
