# Feature Specification: FEAT-XXX <Feature Name>

## Summary
<!-- 2-3 sentences describing what this feature does and why -->

## User Stories

### US-1: <Title>
**As a** <user type>, **I want** <action>, **so that** <benefit>.

### US-2: <Title>
**As a** <user type>, **I want** <action>, **so that** <benefit>.

## Acceptance Criteria

### AC-1: <Criterion Title>
- **Given** <precondition>
- **When** <action>
- **Then** <expected result>

### AC-2: <Criterion Title>
- **Given** <precondition>
- **When** <action>
- **Then** <expected result>

### AC-3: <Criterion Title>
- **Given** <precondition>
- **When** <action>
- **Then** <expected result>

## Out of Scope
<!-- Explicitly list what this feature does NOT include -->
- Item 1
- Item 2

## Dependencies
<!-- Other features, services, or systems this depends on -->
- Dependency 1
- Dependency 2

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Risk 1 | Low/Med/High | Low/Med/High | Mitigation strategy |

---

# Technical Architecture: FEAT-XXX <Feature Name>

## Backend Scope

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| METHOD | /api/path | yes/no | Brief description |

#### `METHOD /api/path`
**Request**:
```typescript
{
  field: string;
  field2?: number;
}
```

**Response (200)**:
```typescript
{
  success: true;
  data: {
    id: string;
    field: string;
  }
}
```

**Error Responses**:
| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid input | `{ success: false, error: "description" }` |
| 401 | Unauthenticated | `{ success: false, error: "Unauthorized" }` |

### Data Models

```typescript
// Model name
interface ModelName {
  id: string;          // UUID, primary key
  field: string;       // description, constraints
  createdAt: Date;     // auto-generated
  updatedAt: Date;     // auto-updated
}
```

### Business Logic Rules
- Rule 1: <description>
- Rule 2: <description>

## Frontend Scope

### Component Hierarchy

```
PageComponent
├── HeaderSection
├── MainContent
│   ├── ComponentA
│   │   ├── SubComponentA1
│   │   └── SubComponentA2
│   └── ComponentB
└── FooterSection
```

### Component Specifications

| Component | Path | Props | State |
|-----------|------|-------|-------|
| ComponentA | src/components/ComponentA | `{ propA: string }` | local: formData |

### Routing Changes

| Route | Component | Auth Required | New/Modified |
|-------|-----------|---------------|-------------|
| /path | PageComponent | yes/no | new/modified |

### State Management
<!-- Describe the state management approach for this feature -->

## Integration Points
<!-- How this feature connects to existing systems -->

## Security Considerations
<!-- Auth, validation, data sensitivity -->
