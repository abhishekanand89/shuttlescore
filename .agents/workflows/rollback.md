---
description: Rollback a merged feature with full audit trail preservation
---

# Rollback Workflow

Use this workflow when a merged feature needs to be reverted. This preserves the complete audit trail and moves tracking artifacts to the `rolled-back/` directory.

## Prerequisites
- The feature has been merged to `main`
- You know the feature ID (e.g., `FEAT-001-user-auth`)

---

## Step 1: Identify the Merge Commit

```bash
# Find the merge commit for this feature
git log --oneline --merges | grep "FEAT-XXX"
```

Note the merge commit SHA.

## Step 2: Verify Scope

Before reverting, check what the merge commit includes:

```bash
git show --stat <merge-commit-sha>
```

Review the file list. Confirm this is the correct feature and identify any files that are shared with other features (potential conflicts).

## Step 3: Create Rollback Branch (Optional — for safety)

For complex rollbacks, create a branch first:

```bash
git checkout -b rollback/FEAT-XXX-<slug>
```

For simple, clean reverts, you can work directly on `main`.

## Step 4: Revert the Merge

```bash
# Revert the merge commit (keep the first parent — main)
git revert -m 1 <merge-commit-sha> --no-commit
```

The `--no-commit` flag stages the revert without committing, allowing you to review and adjust.

## Step 5: Review Reverted Changes

```bash
git diff --cached --stat
```

Verify that:
- Only files from the target feature are being reverted
- No unrelated changes are caught in the revert
- Shared files (if any) still have the code from other features intact

## Step 6: Move Feature Tracking to Rolled-Back

```bash
# Move from completed to rolled-back
mv .feature-tracking/completed/FEAT-XXX-<slug> .feature-tracking/rolled-back/FEAT-XXX-<slug>
```

## Step 7: Add Rollback Annotation

Create `.feature-tracking/rolled-back/FEAT-XXX-<slug>/rollback-notes.md`:

```markdown
# Rollback: FEAT-XXX <Feature Name>

## Rollback Date
<timestamp>

## Reason
<Why this feature was rolled back — be specific>

## Reverted Commit
- **Merge commit**: <merge-commit-sha>
- **Revert commit**: <will be filled after commit>

## Impact Assessment
- **Users affected**: <description>
- **Data changes**: <any database migrations that need manual rollback?>
- **Dependent features**: <list any features that depend on this one>

## Recovery Plan
- <Steps to re-introduce this feature if/when the issues are resolved>
```

## Step 8: Update Audit Log

Append to `.feature-tracking/rolled-back/FEAT-XXX-<slug>/audit-log.md`:

```markdown
| <timestamp> | Orchestrator | ROLLBACK — <reason summary> | <revert-sha> | rollback-notes.md |
```

## Step 9: Commit the Rollback

```bash
git add -A
git commit -m "[orchestrator] FEAT-XXX: Rollback — <brief reason>"
```

If working on a rollback branch:
```bash
git checkout main
git merge --no-ff rollback/FEAT-XXX-<slug> -m "Rollback FEAT-XXX: <reason>"
git branch -d rollback/FEAT-XXX-<slug>
```

## Step 10: Verify Rollback

```bash
# Confirm feature code is no longer present
git log --oneline -5  # Should show revert commit

# Run existing test suite to ensure nothing else broke
npm test  # or pytest, go test, etc.
```

## Step 11: Handle Database Migrations (If Applicable)

> ⚠️ **This requires manual intervention**. Automated database rollbacks are dangerous.

If the feature included database migrations:
1. Check if a down migration exists
2. If yes, run it: `npx prisma migrate reset` / `python manage.py migrate <app> <previous_migration>`
3. If no, manually create and apply a rollback migration
4. Document what was done in `rollback-notes.md`

---

## Partial Rollback (Agent-Level)

To roll back only one agent's contribution (e.g., revert frontend but keep backend):

```bash
# Find the specific agent commit
git log --oneline feat/FEAT-XXX-<slug> | grep "\[frontend\]"

# Revert just that commit
git revert <frontend-commit-sha>
git commit -m "[orchestrator] FEAT-XXX: Partial rollback — revert frontend"
```

Then re-route to the Frontend Dev agent with corrective instructions.

---

## Re-Implementation After Rollback

To re-implement a rolled-back feature:
1. Create a new feature with the same slug but incremented ID: `FEAT-XXX-<slug>-v2`
2. Reference the rolled-back spec as a starting point
3. Include the rollback reason in the new PM Agent context
4. Follow the standard `new-feature.md` workflow
