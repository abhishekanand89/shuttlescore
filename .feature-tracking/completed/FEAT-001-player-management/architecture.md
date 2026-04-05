# Technical Architecture: FEAT-001 — Player Management

## Backend Scope

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── config.py            # Settings (DB URL, etc.)
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py      # Engine, session factory
│   │   └── base.py          # Declarative base
│   ├── models/
│   │   ├── __init__.py
│   │   └── player.py        # Player SQLAlchemy model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py        # Shared response schemas
│   │   └── player.py        # Player Pydantic schemas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── health.py        # Health check endpoint
│   │   └── players.py       # Player CRUD endpoints
│   └── services/
│       ├── __init__.py
│       └── player_service.py # Player business logic
├── requirements.txt
└── pyproject.toml
```

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | no | Health check |
| POST | `/api/players` | no | Register a new player |
| GET | `/api/players` | no | List all players |
| GET | `/api/players/{id}` | no | Get player by ID |
| PUT | `/api/players/{id}` | no | Update player info |

#### `GET /api/health`
**Response (200)**:
```json
{ "success": true, "data": { "status": "healthy", "version": "0.1.0" } }
```

#### `POST /api/players`
**Request**:
```json
{ "name": "string (2-50 chars)", "phone": "string (10-digit)" }
```
**Response (201)**:
```json
{ "success": true, "data": { "id": "uuid", "name": "str", "phone": "str", "created_at": "iso8601" } }
```
**Errors**: 422 (validation), 409 (duplicate phone)

#### `GET /api/players`
**Query**: `?search=<name_substring>` (optional)
**Response (200)**:
```json
{ "success": true, "data": [{ "id": "uuid", "name": "str", "phone_masked": "****1234" }] }
```

#### `GET /api/players/{id}`
**Response (200)**:
```json
{ "success": true, "data": { "id": "uuid", "name": "str", "phone": "str", "created_at": "iso8601" } }
```
**Errors**: 404 (not found)

#### `PUT /api/players/{id}`
**Request**:
```json
{ "name": "string (2-50 chars, optional)" }
```
**Response (200)**: Same as GET player. **Errors**: 404, 422

### Data Models

```python
class Player:
    id: UUID            # primary key, auto-generated
    name: str           # 2-50 chars, NOT NULL
    phone: str          # unique, NOT NULL, indexed
    created_at: datetime # auto-generated, UTC
    updated_at: datetime # auto-updated, UTC
```

### Business Logic Rules
- Phone: strip spaces, dashes, leading +91 — store last 10 digits
- Uniqueness: DB unique constraint + service-level check before insert
- IDs: UUIDs, not sequential integers

## Frontend Scope

### Component Hierarchy
```
App
├── Layout (header + nav + content)
├── HomePage (quick actions, player count)
├── PlayersPage (search + list + FAB)
│   ├── PlayerCard[]
│   └── EmptyState
├── PlayerDetailPage (info + inline edit)
└── PlayerForm (create/edit modal)
```

### Routing
| Route | Component | New |
|-------|-----------|-----|
| `/` | HomePage | new |
| `/players` | PlayersPage | new |
| `/players/:id` | PlayerDetailPage | new |

### Design: Dark mode, mobile-first
- Background: `#0f1419`, Surface: `#1a1f2e`, Primary: `#1a73e8`, Accent: `#ff6b35`
- Font: Inter, min touch target 44px
- React Router v7, `useApi` hook for data fetching

## Integration Points
- Frontend → Backend: `http://localhost:8000/api/*`
- CORS configured for `http://localhost:5173`
