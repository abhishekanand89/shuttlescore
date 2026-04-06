# Verbose Test Output: FEAT-006

### Test Command
```bash
source backend/venv/bin/activate && PYTHONPATH=backend pytest tests/api/test_analytics.py -v
```

### Full Output
```
============================= test session starts ==============================
platform darwin -- Python 3.9.6, pytest-8.4.2, pluggy-1.6.0
asyncio: mode=strict

tests/api/test_analytics.py::test_player_stats_no_matches PASSED         [ 14%]
tests/api/test_analytics.py::test_player_stats_win_loss PASSED           [ 28%]
tests/api/test_analytics.py::test_player_stats_games_played PASSED       [ 42%]
tests/api/test_analytics.py::test_player_stats_tournament_medals PASSED  [ 57%]
tests/api/test_analytics.py::test_player_stats_not_found PASSED          [ 71%]
tests/api/test_analytics.py::test_leaderboard_empty PASSED               [ 85%]
tests/api/test_analytics.py::test_leaderboard_sorted_by_wins PASSED      [100%]

========================= 7 passed, 1 warning in 1.06s =========================
```

### Environment Details
```
Runtime: Python 3.9.6
OS: Darwin 25.2.0
Test Framework: pytest 8.4.2 + pytest-asyncio 1.2.0
Database: sqlite+aiosqlite:///:memory: (per-test isolation)
```
