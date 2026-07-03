# Data Model: Dorama Graph Tracker

**Date**: 2026-07-03
**Source**: [spec.md](./spec.md) — Key Entities section

## Entities

### User

| Field | Type | Description |
|-------|------|-------------|
| uid | string | Firebase Auth UID |
| displayName | string | Google account display name |
| photoURL | string | Google account profile photo |

**Constraints**:
- uid is immutable and uniquely identifies the user
- All graph data is scoped under `users/{uid}/` in Firestore

### GraphDocument

Firestore document at `users/{uid}/graphData`.

| Field | Type | Description |
|-------|------|-------------|
| nodes | Node[] | All Dorama and Actor nodes in the user's graph |
| links | Link[] | "ACTED_IN" connections between actors and doramas |
| updatedAt | Timestamp | Last modification timestamp |

**Constraints**:
- Single document per user (may be split in future if scale requires)
- Security rules enforce read/write only by matching uid

### Node

Represents a single vertex in the graph — either a Dorama or an Actor.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (TMDB series ID for doramas, TMDB person ID for actors) |
| label | string | Display name (Dorama title or actor name) |
| group | "dorama" | "actor" | Determines visual styling (color, size) |
| imgUrl | string | Poster image URL (Dorama) or profile photo URL (Actor) |

**Constraints**:
- id must be unique within a user's graph
- group must be exactly `"dorama"` or `"actor"`
- imgUrl may be empty if no image is available

### Link

Represents an edge connecting an Actor to a Dorama (ACTED_IN).

| Field | Type | Description |
|-------|------|-------------|
| source | string | Actor node ID |
| target | string | Dorama node ID |

**Constraints**:
- source and target must reference valid node ids within the same graph
- Duplicate (source, target) pairs are not permitted
- Directional semantics: Actor → Dorama (acted in)

## State Transitions

```
User signs in
  │
  ▼
Load graph from Firestore ───┐
  │                          │ (empty → empty graph shown)
  ▼                          │
Search Dorama ──► Results    │
  │                          │
  ▼                          │
Select Dorama ───────────────┤
  │                          │
  ▼                          │
Fetch cast from TMDB         │
  │                          │
  ▼                          │
Transform to nodes/links     │
  │                          │
  ▼                          │
Merge into existing graph ───┤ (dedup actors, skip duplicate doramas)
  │                          │
  ▼                          │
Save to Firestore ───────────┤
  │                          │
  ▼                          │
Re-render graph ◄────────────┘
```

## Validation Rules

- Dorama title: non-empty string, max 200 chars
- Actor name: non-empty string, max 200 chars
- Node id: must match TMDB numeric ID pattern
- Graph: at most one document per user
- Links: no self-referencing links (actor cannot link to itself)
