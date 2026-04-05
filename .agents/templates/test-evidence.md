# Test Evidence: FEAT-XXX <Feature Name>

---

## Summary Report

**Status**: ✅ ALL PASSING | ❌ FAILURES DETECTED | ⚠️ PARTIAL
**Run Date**: <timestamp>
**Environment**: <runtime version, OS>
**Total**: X tests | ✅ Y passed | ❌ Z failed | ⏭ W skipped

### Results by Acceptance Criterion

| AC# | Criterion | Test(s) | Status | Notes |
|-----|-----------|---------|--------|-------|
| AC-1 | <title> | T-001, T-002 | ✅ | — |
| AC-2 | <title> | T-003 | ✅ | — |
| AC-3 | <title> | T-004 | ❌ | <brief failure note> |

### Coverage Assessment
- **Acceptance Criteria Covered**: X/Y (Z%)
- **Critical Tests Passing**: X/Y
- **Edge Case Tests Passing**: X/Y

---

## Failure Details (if any)

### T-XXX: `test_name`
- **Acceptance Criterion**: AC-X
- **Error Type**: AssertionError / TypeError / TimeoutError / etc.
- **Error Message**: 
```
<exact error message>
```
- **File**: `tests/path/file.ext:line_number`
- **Likely Cause**: <assessment of what's wrong>
- **Affected Layer**: backend | frontend
- **Suggested Fix**: <brief suggestion for the dev agent>

---

## Verbose Output

### Test Command
```bash
<exact command used to run tests>
```

### Full Output
```
<complete terminal output>
<include all stdout and stderr>
<include timing information>
```

### Environment Details
```
Runtime: <version>
OS: <os and version>
Dependencies: <relevant dependency versions>
Test Framework: <framework and version>
```

---

## Retry History (if applicable)

| Attempt | Date | Result | Failures | Fix Applied |
|---------|------|--------|----------|-------------|
| 1 | <date> | ❌ 2 failures | T-003, T-004 | — |
| 2 | <date> | ❌ 1 failure | T-004 | Backend: fixed response shape |
| 3 | <date> | ✅ All passing | — | Frontend: added error handler |
