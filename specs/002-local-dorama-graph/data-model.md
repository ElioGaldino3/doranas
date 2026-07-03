# Data Model: Local Dorama Graph

## localStorage Schema

**Key**: `dorama_graph_data`

**Value**: Serialized JSON — `GraphDocument`

```typescript
interface GraphDocument {
  nodes: Node[];
  links: Link[];
  updatedAt: number; // Date.now() on last write
}
```

### Node

| Field    | Type                          | Description                          |
|----------|-------------------------------|--------------------------------------|
| `id`     | `string`                      | Unique key — `dorama_{tmdbId}` or `actor_{tmdbId}` |
| `label`  | `string`                      | Display name (title or actor name)   |
| `group`  | `"dorama" \| "actor"`         | Node type for visual distinction     |
| `imgUrl` | `string`                      | TMDB image URL (poster or profile)   |

### Link

| Field    | Type     | Description                  |
|----------|----------|------------------------------|
| `source` | `string` | Actor node ID                |
| `target` | `string` | Dorama node ID               |

**Semantics**: Each Link represents an `ACTED_IN` relationship.
Direction is actor → dorama.

## State Transitions

### Adding a Dorama

1. User searches / enters IMDb ID → TMDB resolves to series
2. Fetch series cast from TMDB `/tv/{id}/credits`
3. Transform into nodes array (1 Dorama + N Actors) and links array
4. Read existing `GraphDocument` from localStorage (or `{nodes:[], links:[], updatedAt:0}`)
5. Deduplicate: skip new nodes whose `id` already exists in existing nodes
6. Deduplicate: skip links whose `source-target` pair already exists
7. Compute cross-reference: intersection of new actor IDs with existing actor IDs
8. Merge: `existing.nodes.concat(uniqueNewNodes)`
9. Persist merged document to localStorage with `updatedAt = Date.now()`
10. Update Zustand ephemeral state (nodes, links, highlightedNodes)

### Loading the Graph

1. On app mount, read `dorama_graph_data` from localStorage
2. If null/empty → empty state (prompt to add first dorama)
3. If parse error → reset to empty state, notify user
4. Otherwise → set Zustand store with loaded nodes and links

## Validation Rules

- Node IDs must be unique within the document
- Link source and target must reference existing node IDs
- Duplicate Dorama detection: check if `dorama_{tmdbId}` already exists in nodes
- localStorage quota exceeded: catch `QuotaExceededError`, show user message
- Malformed JSON on read: reset to empty graph, log warning
