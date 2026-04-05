---
description: Complete lifecycle workflow for developing a new feature from request to merge
---

# New Feature Workflow

// turbo-all

This workflow is invoked when a user requests a new feature. Follow each step in sequence. Do NOT skip steps.

## Prerequisites
- `PROJECT_MANIFEST.md` exists in the project root (if not, run `onboard-existing.md` first)
- Git repository is initialized with a clean working tree
- `.feature-tracking/` directory exists

---

## Step 1: Feature ID Assignment

1. Scan `.feature-tracking/active/` and `.feature-tracking/completed/` for existing `FEAT-XXX` directories
2. Determine the next sequential ID (e.g., if FEAT-003 exists, next is FEAT-004)
3. Create a slug from the user's request (lowercase, hyphenated, 2-4 words)
4. Feature ID format: `FEAT-XXX-<slug>`

## Step 2: Create Feature Branch

```bash
git checkout -b feat/FEAT-XXX-<slug>
```

## Step 3: Create Tracking Directory

```bash
mkdir -p .feature-tracking/active/FEAT-XXX-<slug>/test-evidence
```

Create the initial `audit-log.md`:
```markdown
# Audit Log: FEAT-XXX <Feature Name>

| Timestamp | Agent | Action | Commit | Artifacts Modified |
|-----------|-------|--------|--------|--------------------|
```

## Step 4: PM Agent — Specification

Read the PM Agent prompt from `.agents/prompts/pm-agent.md`.

**Construct PM Agent context**:
1. Include the user's feature request verbatim
2. Include `PROJECT_MANIFEST.md` content
3. List names of features in `.feature-tracking/completed/` (names only, not content)

**PM Agent creates**:
- `.feature-tracking/active/FEAT-XXX-<slug>/spec.md`
- `.feature-tracking/active/FEAT-XXX-<slug>/architecture.md`

**Commit**:
```bash
git add .feature-tracking/active/FEAT-XXX-<slug>/
git commit -m "[pm] FEAT-XXX: <Feature name> spec and architecture"
```

**Update audit log** with PM action.

## Step 5: 🛑 HUMAN REVIEW GATE — Specification

Present to the user:
- Summary of the feature spec (< 200 words)
- Link to full `spec.md` and `architecture.md`
- Ask: "Does this spec match your intent? Proceed to development? (yes/no/revise)"

**If revise**: Re-run Step 4 with user's feedback appended to the feature request.
**If no**: Archive the feature tracking directory and delete the branch.
**If yes**: Continue to Step 6.

## Step 6: Test Agent — Test Planning

Read the Test Agent prompt from `.agents/prompts/test-agent.md`.

**Construct Test Agent context**:
1. Include `spec.md` content
2. Include `architecture.md` — "API Contracts" and "Data Models" sections only
3. Include 1-2 example test files from `tests/` (pick representative ones; if none exist, skip)

**Test Agent creates**:
- `.feature-tracking/active/FEAT-XXX-<slug>/test-plan.md`
- Test file stubs in `tests/` directory

**Commit**:
```bash
git add .feature-tracking/active/FEAT-XXX-<slug>/test-plan.md tests/
git commit -m "[test] FEAT-XXX: Create test plan and stubs"
```

**Update audit log** with Test Agent action.

## Step 7: Backend Dev — Implementation

Read the Backend Dev prompt from `.agents/prompts/backend-dev.md`.

**Construct Backend Dev context**:
1. Include `architecture.md` — "Backend Scope" section
2. Include `test-plan.md` — test names and descriptions only (strip test code)
3. Load relevant existing source files based on directories mentioned in architecture.md's backend scope
4. Include `PROJECT_MANIFEST.md` — "Key Abstractions" section

**Backend Dev creates**:
- Implementation code in `src/` (or equivalent)
- `.feature-tracking/active/FEAT-XXX-<slug>/backend-notes.md`

**Commit**:
```bash
git add -A
git commit -m "[backend] FEAT-XXX: Implement <backend summary>"
```

**Update audit log** with Backend Dev action.

## Step 8: Frontend Dev — Implementation

Read the Frontend Dev prompt from `.agents/prompts/frontend-dev.md`.

**Construct Frontend Dev context**:
1. Include `architecture.md` — "Frontend Scope" section
2. Include `backend-notes.md` — "API Endpoints" section (the contract)
3. Include `test-plan.md` — UI test names and descriptions only
4. Load relevant existing UI files based on directories mentioned in architecture.md's frontend scope
5. Include `PROJECT_MANIFEST.md` — "Key Abstractions" section

**Frontend Dev creates**:
- UI implementation code
- `.feature-tracking/active/FEAT-XXX-<slug>/frontend-notes.md`

**Commit**:
```bash
git add -A
git commit -m "[frontend] FEAT-XXX: Implement <frontend summary>"
```

**Update audit log** with Frontend Dev action.

## Step 9: Test Agent — Execution & Evidence

Read the Test Agent prompt from `.agents/prompts/test-agent.md` (Execution Phase).

**Construct Test Agent context**:
1. Include `test-plan.md`
2. Include all test files in `tests/` for this feature
3. Include `spec.md` — "Acceptance Criteria" section only

**Test Agent actions**:
1. Complete any remaining test stub implementations
2. Run the full test suite
3. Generate evidence reports

**Test Agent creates**:
- `.feature-tracking/active/FEAT-XXX-<slug>/test-evidence/verbose.md`
- `.feature-tracking/active/FEAT-XXX-<slug>/test-evidence/summary.md`

**Commit**:
```bash
git add -A
git commit -m "[test] FEAT-XXX: Test evidence — X/Y passing"
```

**Final action for Test Agent**: Proceed to Step 10.

### Failure Routing (if tests fail)

If any tests fail, follow the Orchestrator's Failure Routing Protocol:

1. Parse `test-evidence/summary.md` for failures
2. Classify each as `backend` or `frontend`
3. Route to the appropriate dev agent with focused context:
   - Failing test code
   - Error message / stack trace
   - Relevant source file
4. Dev agent fixes and commits: `[<role>] FEAT-XXX: Fix <test-name>`
5. Re-run Step 9 (tests only)
6. Maximum 3 retry cycles, then escalate to user

## Step 10: 🛑 HUMAN REVIEW GATE — Test Evidence

Present to the user:
- Test summary table from `test-evidence/summary.md`
- Overall pass/fail status
- Ask: "Tests are passing. Proceed to Docker build / CI testing? (yes/no)"

**If no**: User provides feedback; route to appropriate agent.
**If yes**: Continue to Step 11.

## Step 11: CI/CD Packaging & Deployment

**Orchestrator Actions**:
1. Run `docker build -t badminton-scorer:latest .`
2. Run `docker run -d -p 8000:8000 --name badminton-test badminton-scorer:latest`
3. Wait 5 seconds, then stop and present to user:
4. "The application is running in a Docker container at http://localhost:8000. Please test the containerized app. Let me know when you are done to tear it down and merge to main."

Once the user approves tracking destruction:
1. Run `docker stop badminton-test && docker rm badminton-test`
2. Remove any local temporary artifacts.
3. Continue to Step 12.

## Step 12: Merge & Archive

```bash
# Merge feature branch
git checkout main
git merge --no-ff feat/FEAT-XXX-<slug> -m "Merge FEAT-XXX: <Feature name>"

# Archive feature tracking
mv .feature-tracking/active/FEAT-XXX-<slug> .feature-tracking/completed/FEAT-XXX-<slug>

# Commit the archive move
git add -A
git commit -m "[orchestrator] FEAT-XXX: Archive to completed"

# Clean up feature branch
git branch -d feat/FEAT-XXX-<slug>
```

**Final audit log entry**: Record merge commit SHA and timestamp.

## Step 13: Update Project Manifest (if needed)

If this feature introduced new architectural patterns, key abstractions, or changed the tech stack:
- Update `PROJECT_MANIFEST.md` accordingly
- Commit: `[orchestrator] Update manifest for FEAT-XXX`
