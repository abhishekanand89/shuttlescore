# Specification: FEAT-003 Tournament Management

## Feature Description
The "Tournament Management" feature allows users to group individual matches under a unified "Tournament" entity. This is critical for users who run local tournaments and need to delineate free/practice matches from competitive ongoing tournaments.

## Scope
1. **Tournament CRUD**: Users can create a new tournament, specifying a name, optional description, and dates.
2. **Tagging Matches**: When creating a match, users can optionally select an active tournament to associate it with.
3. **Tournament Leaderboard / Results**: Users can view a specific tournament to see a list of matches that belong to it, allowing them to track progression manually (knockout bracket visualization is out of MVP scope).
4. **Statistics**: Simple aggregates on the tournament page (Total matches, participating players).

## Acceptance Criteria
- **AC-1**: User can create a tournament via UI.
- **AC-2**: A tournament has a unique Name, Date, and Status (`upcoming`, `active`, `completed`).
- **AC-3**: During Match Creation, the UI offers a dropdown of `active` tournaments (optional field).
- **AC-4**: In the backend API, a Match correctly stores an optional `tournament_id` foreign key.
- **AC-5**: The frontend has a "Tournaments" tab showing a list of tournaments and their status.
- **AC-6**: Clicking a tournament pulls up a detail view showing all matches played under that tournament.
