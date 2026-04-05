---
description: Onboard an existing project into the multi-agent development system
---

# Onboard Existing Project

// turbo-all

Use this workflow when applying the multi-agent system to an existing codebase. The goal is to generate the `PROJECT_MANIFEST.md` and set up the tracking infrastructure without modifying any existing code.

## Prerequisites
- The existing project has a git repository initialized
- The working tree is clean (`git status` shows no uncommitted changes)

---

## Step 1: Analyze Project Structure

Gather information about the project. Run these commands to understand the codebase:

```bash
# Directory structure (2 levels deep, excluding common noise)
find . -maxdepth 3 -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/__pycache__/*' \
  -not -path '*/.next/*' \
  -not -path '*/venv/*' \
  | head -100
```

```bash
# Package dependencies (Node.js)
cat package.json 2>/dev/null || echo "No package.json"

# Package dependencies (Python)
cat requirements.txt 2>/dev/null || cat pyproject.toml 2>/dev/null || echo "No Python deps"

# Package dependencies (Go)  
cat go.mod 2>/dev/null || echo "No go.mod"
```

```bash
# Identify existing test patterns
find . -path '*/test*' -name '*.test.*' -o -name '*_test.*' -o -name 'test_*' | head -20
```

## Step 2: Sample Key Files

Read 2-3 key files to understand coding patterns. Prioritize:
1. A main entry point (e.g., `src/index.ts`, `main.py`, `cmd/main.go`)
2. A representative API route/handler
3. A representative test file (if tests exist)

**Token rule**: Read only the first 50 lines of each file. You're extracting patterns, not reading the full code.

## Step 3: Generate PROJECT_MANIFEST.md

Using the information gathered, create `PROJECT_MANIFEST.md` in the project root:

```markdown
# Project Manifest

## Project
- **Name**: <project name from package.json or directory>
- **Description**: <brief description>
- **Created**: <date from git log --reverse | head -1>

## Tech Stack
- **Runtime**: <e.g., Node.js 20, Python 3.12, Go 1.22>
- **Language**: <e.g., TypeScript, Python, Go>
- **Framework**: <e.g., Next.js 14 App Router, Django 5, Gin>
- **Database**: <e.g., PostgreSQL + Prisma, SQLite + SQLAlchemy>
- **Auth**: <e.g., NextAuth.js, Django auth, JWT>
- **Testing**: <e.g., Vitest + Playwright, pytest, go test>
- **Styling**: <e.g., Tailwind CSS, CSS Modules, styled-components> (if applicable)

## Architecture Summary
- `<dir>/` — <purpose>
- `<dir>/` — <purpose>
(list key directories and their purposes)

## Key Abstractions
- <Pattern 1>: <Description> (e.g., "All API routes return { success, data?, error? }")
- <Pattern 2>: <Description>
- <Pattern 3>: <Description>

## Existing Test Patterns
- **Framework**: <test framework>
- **Location**: <test directory>
- **Naming**: <naming convention, e.g., *.test.ts, test_*.py>
- **Example**: <one representative test file path>

## Dependencies (Key)
- <dependency>: <version> — <what it's used for>
(list only important/non-obvious dependencies, max 10)
```

## Step 4: Set Up Feature Tracking

```bash
mkdir -p .feature-tracking/active
mkdir -p .feature-tracking/completed
mkdir -p .feature-tracking/rolled-back
```

Create `.feature-tracking/README.md`:
```markdown
# Feature Tracking

This directory tracks features through the multi-agent development lifecycle.

- `active/` — Features currently in development
- `completed/` — Features that have been merged to main
- `rolled-back/` — Features that were reverted after merge

Each feature directory contains:
- `spec.md` — Feature specification (PM Agent)
- `architecture.md` — Technical architecture (PM Agent)
- `test-plan.md` — Test identification (Test Agent)
- `backend-notes.md` — Backend implementation notes (Backend Dev)
- `frontend-notes.md` — Frontend implementation notes (Frontend Dev)
- `test-evidence/` — Test results (verbose.md + summary.md)
- `audit-log.md` — Chronological action log
```

## Step 5: Commit Onboarding

```bash
git add PROJECT_MANIFEST.md .feature-tracking/ .agents/
git commit -m "[orchestrator] Onboard project into multi-agent system"
```

## Step 6: Verify

Confirm the following files exist:
- `PROJECT_MANIFEST.md`
- `.feature-tracking/README.md`
- `.feature-tracking/active/` (empty directory)
- `.feature-tracking/completed/` (empty directory)
- `.agents/orchestrator.md`
- `.agents/prompts/` (all 4 agent prompts)
- `.agents/workflows/` (all workflow files)
- `.agents/templates/` (all template files)

## Notes

- This workflow does NOT modify any existing code
- The manifest is a snapshot — it should be updated when features change the architecture
- If the project has no tests, the Test Agent will set up the test framework during the first feature
