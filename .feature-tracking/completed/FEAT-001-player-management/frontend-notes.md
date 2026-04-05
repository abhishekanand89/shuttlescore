# Frontend Notes: FEAT-001 Player Management

## Agent
frontend

## What Was Built
- React + Vite + TypeScript PWA scaffold
- Dark-mode mobile-first design system (CSS variables + Inter font)
- App shell with sticky header + bottom navigation
- Player list page with search, loading skeletons, empty state, FAB
- Player detail page with inline name editing
- Player creation form (bottom-sheet on mobile, centered modal on desktop)
- API client with typed fetch wrapper

## Components Created
| Component | Path | Purpose | Props |
|-----------|------|---------|-------|
| Layout | src/components/Layout.tsx | App shell (header + nav + outlet) | — |
| PlayerCard | src/components/PlayerCard.tsx | Player list item | `{ player: PlayerListItem }` |
| PlayerForm | src/components/PlayerForm.tsx | Create player modal | `{ onSuccess, onCancel }` |
| EmptyState | src/components/EmptyState.tsx | Empty list placeholder | `{ icon, title, description, action? }` |

## Routing Changes
| Route | Component | New |
|-------|-----------|-----|
| `/` | HomePage | new |
| `/players` | PlayersPage | new |
| `/players/:id` | PlayerDetailPage | new |

## State Management
- No global store — each page fetches via `useApi` hook
- Forms use local `useState`
- React Router v7 for navigation

## API Integration Notes
- All calls via `src/api/client.ts` typed fetch wrapper
- Base URL: `http://localhost:8000/api`
- Response unwrapping handled in client (`json.data` extracted automatically)

## Deviations from Architecture
- None

## Files Created
| File | Purpose |
|------|---------|
| `src/index.css` | Design system (tokens, reset, component classes, animations) |
| `src/App.tsx` | Router setup |
| `src/api/client.ts` | Typed API client |
| `src/hooks/useApi.ts` | Data fetching hook |
| `src/components/Layout.tsx` | App shell |
| `src/components/PlayerCard.tsx` | Player list item |
| `src/components/PlayerForm.tsx` | Player creation modal |
| `src/components/EmptyState.tsx` | Empty state placeholder |
| `src/pages/HomePage.tsx` | Dashboard with stats + quick actions |
| `src/pages/PlayersPage.tsx` | Player list with search + FAB |
| `src/pages/PlayerDetailPage.tsx` | Player profile with inline edit |
| All corresponding `.css` files | Component styles |

## Known Limitations
- "New Match" button and "Matches" tab are present but disabled (FEAT-002)
- Stats cards on detail page show "—" placeholders (FEAT-005)
- No PWA service worker yet (just manifest meta tags)
