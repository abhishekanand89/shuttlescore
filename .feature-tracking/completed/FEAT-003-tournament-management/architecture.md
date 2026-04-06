# Architecture: FEAT-003 Tournament Management

## Data Models

**Table `tournaments`**
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `id` | uuid | Primary Key | Unique Tournament ID |
| `name` | string | Not Null | E.g., "Summer Open" |
| `description` | string | Nullable | Optional context |
| `status` | enum | Not Null | `upcoming`, `active`, `completed` |
| `created_at` | datetime| auto | Creation timestamp |

**Updated Table `matches`**
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| `tournament_id` | uuid | Foreign Key, Nullable | Points to `tournaments.id` |

## Backend Scope
- **Models**:
  - Add `Tournament` SQLAlchemy model.
  - Update `Match` SQLAlchemy model by adding `tournament_id = Column(String(36), ForeignKey('tournaments.id'), nullable=True)`.
  - IMPORTANT: In SQLite + Alembic (or `Base.metadata.create_all()` since we don't have migrations), we'll need to drop/recreate DB locally or ensure the script handles it seamlessly since it's a new schema addition.
- **Schemas**: Validate tournament CRUD schemas.
- **API Endpoints (`app/api/tournaments.py`)**:
  - `GET /api/tournaments`: List all.
  - `POST /api/tournaments`: Create tournament.
  - `GET /api/tournaments/{id}`: Fetch tournament details and associated matches.
- **API Updates (`app/api/matches.py`)**:
  - Update `MatchCreate` to accept `tournament_id: Optional[str] = None`.
  - Update `/api/matches` listing endpoint to filter by `?tournament_id=<id>`.

## Frontend Scope
- **Navigation**: Create a "Tournaments" routing tab (`TournamentsPage`).
- **UI Components**:
  - `CreateTournamentModal` or Page: Form to enter name/status.
  - `TournamentDetailPage`: List associated matches.
  - Update `CreateMatchPage.tsx`: Add a combobox dropdown to optionally select a Tournament context (fed by `GET /api/tournaments?status=active`).
- **API Client**: Update `frontend/src/api/client.ts` with `tournamentApi`.
