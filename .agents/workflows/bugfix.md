---
description: Workflow for fixing a bug using the multi-agent system with minimal scope
---

# Bug Fix Workflow

Use this workflow for fixing bugs. Bug fixes follow a streamlined version of the feature workflow — the PM Agent scopes the fix, the relevant Dev Agent implements it, and the Test Agent verifies it.

## Key Difference from Features
Bug fixes are **scope-minimal**. The PM Agent produces a lightweight bug spec (not full architecture), and typically only ONE dev agent is involved (backend OR frontend, not both).

---

## Step 1: Bug ID Assignment

Use the same counter as features but with a `BUG-` prefix:
- `BUG-XXX-<slug>` (e.g., `BUG-012-login-timeout`)

Check `.feature-tracking/active/` and `.feature-tracking/completed/` for existing IDs.

## Step 2: Create Bug Branch

```bash
git checkout -b fix/BUG-XXX-<slug>
```

## Step 3: Create Tracking Directory

```bash
mkdir -p .feature-tracking/active/BUG-XXX-<slug>/test-evidence
```

Initialize `audit-log.md`.

## Step 4: PM Agent — Bug Scoping

**PM Agent receives** (minimal context):
- Bug report from user (verbatim)
- `PROJECT_MANIFEST.md`
- Relevant error logs or screenshots (if provided)

**PM Agent produces** a lightweight `spec.md`:

```markdown
# Bug Spec: BUG-XXX <Bug Title>

## Bug Description
<What's happening vs. what should happen>

## Reproduction Steps
1. <step>
2. <step>
3. <expected vs actual>

## Root Cause Analysis (Hypothesis)
<PM's assessment of likely cause based on architecture knowledge>

## Fix Scope
- **Affected Layer**: backend | frontend | both
- **Affected Files** (estimated): <file paths>
- **Risk Level**: low | medium | high

## Acceptance Criteria
- AC-1: <The bug no longer reproduces>
- AC-2: <Existing functionality is not broken>
- AC-3: <Edge case X is handled>
```

**Commit**:
```bash
git add .feature-tracking/active/BUG-XXX-<slug>/
git commit -m "[pm] BUG-XXX: Bug spec — <title>"
```

## Step 5: Test Agent — Regression Test

**Test Agent receives**:
- `spec.md` (bug spec with reproduction steps)
- Existing test files in the affected area

**Test Agent produces**:
- A regression test that reproduces the bug (should FAIL before fix, PASS after)
- Added to `test-plan.md`

**Commit**:
```bash
git add -A
git commit -m "[test] BUG-XXX: Add regression test"
```

## Step 6: Dev Agent — Fix Implementation

Route to the appropriate dev agent based on "Affected Layer" in the spec.

**Dev Agent receives**:
- `spec.md` (bug spec with root cause hypothesis)
- The failing regression test
- The affected source files (targeted, not entire codebase)

**Dev Agent**:
- Implements the minimal fix
- Creates `backend-notes.md` or `frontend-notes.md` documenting the fix

**Commit**:
```bash
git add -A
git commit -m "[backend|frontend] BUG-XXX: Fix <brief description>"
```

## Step 7: Test Agent — Verification

Run tests. The regression test should now PASS. The full test suite should show no new failures.

Generate `test-evidence/summary.md` and `test-evidence/verbose.md`.

**Commit**:
```bash
git add -A
git commit -m "[test] BUG-XXX: Test evidence — regression verified"
```

## Step 8: Merge

```bash
git checkout main
git merge --no-ff fix/BUG-XXX-<slug> -m "Merge BUG-XXX: <Bug title>"
mv .feature-tracking/active/BUG-XXX-<slug> .feature-tracking/completed/BUG-XXX-<slug>
git add -A
git commit -m "[orchestrator] BUG-XXX: Archive to completed"
git branch -d fix/BUG-XXX-<slug>
```

## Notes
- Bug fixes should be small. If the "fix" requires significant architecture changes, convert it to a feature instead.
- The regression test is the most important artifact — it prevents the bug from recurring.
- Maximum 2 retry cycles for bug fixes (vs. 3 for features) to keep scope tight.
