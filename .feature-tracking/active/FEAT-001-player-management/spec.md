# Feature Specification: FEAT-001 — Project Scaffolding + Player Management

## Summary
Set up the FastAPI backend and React/Vite frontend with development infrastructure, then implement player management (create, list, view, update players). Players are uniquely identified by phone number and have a display name.

## User Stories

### US-1: Register as a Player
**As a** badminton player, **I want** to register with my name and phone number, **so that** I can be uniquely identified in matches.

### US-2: View All Players
**As a** scorer/organizer, **I want** to see a list of all registered players, **so that** I can select them when creating matches.

### US-3: View Player Profile
**As a** player, **I want** to view my profile details, **so that** I can verify my information is correct.

### US-4: Update Player Info
**As a** player, **I want** to update my display name, **so that** my name appears correctly on scoreboards.

## Acceptance Criteria

### AC-1: Player Registration
- **Given** a new user with name and phone number
- **When** they submit the registration form
- **Then** a player is created with a unique ID, and the phone number is validated and stored uniquely

### AC-2: Duplicate Phone Prevention
- **Given** a phone number already registered
- **When** someone tries to register with the same phone number
- **Then** the system returns an error indicating the phone number is already in use

### AC-3: Player List
- **Given** multiple registered players
- **When** a user views the player list page
- **Then** all players are shown with their name and phone (partially masked)

### AC-4: Player Profile View
- **Given** a registered player
- **When** a user navigates to their profile
- **Then** the player's full name, phone, and registration date are displayed

### AC-5: Player Name Update
- **Given** a registered player
- **When** they update their display name
- **Then** the name is changed and reflected everywhere

### AC-6: Backend Health Check
- **Given** the backend is running
- **When** a GET request is made to `/api/health`
- **Then** it returns `{ "success": true, "data": { "status": "healthy" } }`

### AC-7: Frontend Mobile Layout
- **Given** a mobile device (viewport 375-428px width)
- **When** the user loads the app
- **Then** the layout is properly responsive with touch-friendly targets (min 44px)

## Out of Scope
- Authentication / login sessions (FEAT-005)
- Player deletion
- Player avatar / photo
- Match creation (FEAT-002)
- Tournament creation (FEAT-003)

## Dependencies
- None (this is the foundation feature)
