# Feature Specification: FEAT-002 — Match Scoring (Singles + Doubles)

## Summary
Implement point-by-point badminton match scoring supporting both singles and doubles formats. Follows official BWF rules: 21-point games, best-of-3 games, deuce at 20-20 with 2-point lead requirement, 30-point cap. Tracks server, service side, and court positions. Matches can be tagged as "free game" or linked to a tournament (FEAT-003).

## User Stories

### US-1: Create a Singles Match
**As a** scorer, **I want** to select 2 players and start a singles match, **so that** I can track their game.

### US-2: Create a Doubles Match
**As a** scorer, **I want** to select 4 players (2 per team) and start a doubles match, **so that** I can track team scoring.

### US-3: Score Points
**As a** scorer, **I want** to tap a button to award a point to a side, **so that** scoring is fast and one-handed on mobile.

### US-4: Track Game Progress
**As a** scorer, **I want** to see the current game score, game number, and set history, **so that** I know the match state at a glance.

### US-5: Handle Badminton Rules
**As a** scorer, **I want** the app to automatically handle game endings, service changes, intervals, and deuce, **so that** I don't need to remember the rules.

### US-6: Undo Last Point
**As a** scorer, **I want** to undo the last point if I made a mistake, **so that** the score stays accurate.

### US-7: Complete a Match
**As a** player, **I want** to see the final result when a match is won, **so that** the outcome is clear.

### US-8: View Active Match
**As a** player, **I want** to view an ongoing match score from my phone, **so that** I can follow the game.

## Acceptance Criteria

### AC-1: Create Singles Match
- **Given** 2 registered players
- **When** the scorer selects them and chooses "Singles"
- **Then** a new match is created with status "in_progress" and game 1 starts at 0-0

### AC-2: Create Doubles Match
- **Given** 4 registered players
- **When** the scorer assigns them to Team A and Team B and chooses "Doubles"
- **Then** a new match is created with 2 players per side

### AC-3: Score a Point
- **Given** an active match
- **When** the scorer taps the scoring button for side A or B
- **Then** that side's score increments by 1, and the server switches if the receiving side scored

### AC-4: Game End at 21
- **Given** a game score of 20-18
- **When** the leading side scores
- **Then** the game ends (21-18), a new game starts if the match isn't decided

### AC-5: Deuce Handling (20-20)
- **Given** a game score of 20-20
- **When** a side scores
- **Then** the game continues until a 2-point lead is achieved or the score reaches 30-29

### AC-6: 30-Point Cap
- **Given** a game score of 29-29
- **When** either side scores
- **Then** the game ends (30-29), golden point

### AC-7: Match Win (Best of 3)
- **Given** a side has won 1 game
- **When** that side wins a second game
- **Then** the match ends with status "completed" and the winner is recorded

### AC-8: Point Undo
- **Given** at least 1 point has been scored
- **When** the scorer taps "Undo"
- **Then** the last point is reversed, including any game/server state changes

### AC-9: Service Tracking
- **Given** a singles match after creating
- **When** the first server is selected
- **Then** service alternates correctly: server switches when the receiving side scores

### AC-10: Match Persistence
- **Given** an active match
- **When** the scorer closes and reopens the app
- **Then** the match state is fully restored from the server

### AC-11: Match List
- **Given** one or more matches exist
- **When** the user views the matches page
- **Then** active and recent completed matches are listed with scores

## Out of Scope
- Tournament linking (FEAT-003)
- Match statistics / analytics (FEAT-004)
- Live spectator mode / WebSocket updates
- Interval timer (just show "Interval" label)
- Court/side switching automation (scorer handles manually)

## Dependencies
- FEAT-001: Player Management (players must exist to create a match)
