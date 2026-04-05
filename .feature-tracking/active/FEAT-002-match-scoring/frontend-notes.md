# Frontend Notes: FEAT-002 Match Scoring

## Agent
frontend

## What Was Built
- Pages: `MatchesPage`, `CreateMatchPage`, `LiveScorePage`
- API hook wrapper extended with Match specific typings (`client.ts`)
- Modified: `HomePage` to enable Matches actions, `Layout` to enable navigation

## Focus Areas
- **Mobile One-handed UI**: The `LiveScorePage` features buttons spanning the bottom 40-50% of the screen making it easy for a referee to operate without looking closely.
- **State Management**: `LiveScorePage` manages the live match via optimistic/polling updates. Used `refetch` to simplify logic across undo/points given strict BWF validation.
- **Design Alignment**: Dark mode gradients (Blue for Side A, Orange for Side B), large mono typography (SF Mono/tnum) for score readability.

## Routing
- `/matches` -> `MatchesPage`
- `/matches/new` -> `CreateMatchPage`
- `/matches/:id` -> `LiveScorePage`

## Files Created/Modified
| File | Action | Description |
|------|--------|-------------|
| `src/api/client.ts` | append | Added Match types and endpoints |
| `src/App.tsx` | mod | Added route components |
| `src/components/Layout.tsx` | mod | Enabled `/matches` tab in navigation |
| `src/pages/HomePage.tsx` | mod | Enabled new match CTA and stat count |
| `src/pages/MatchesPage.tsx` | new | Main match index |
| `src/pages/CreateMatchPage.tsx` | new | Team builder & singles/doubles selector |
| `src/pages/LiveScorePage.tsx` | new | The scoring UI logic |

## Trade-offs
- No WebSocket/Polling is active automatically — a live spectator view was out of scope per PM spec (only referee needs live updating, and reloads data upon scoring action).
