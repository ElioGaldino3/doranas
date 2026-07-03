# Research: Local Dorama Graph Tracker

## Technical Decisions

### localStorage Graph Persistence

**Decision**: Single `dorama_graph_data` key storing the full JSON
payload (nodes + links). Use a custom React hook (`useLocalStorageGraph`)
for all reads and writes. Subscribe to storage events for cross-tab
synchronization.

**Rationale**: Keeps the data model simple — no need for indexing
or querying since the entire graph fits in memory (<500kb even for
large graphs). Single key avoids race conditions and partial writes.

**Alternatives considered**:
- IndexedDB: More complex API, overkill for <1MB datasets
- Multiple keys per entity: Unnecessary complexity, no query needs
- Firestore (original approach): Removed per constitution — local-first

### TMDB API Integration

**Decision**: Three isolated functions in `services/tmdb.ts` —
`searchSeries`, `findByImdbId`, `getSeriesCast`. The `useTMDB` hook
manages loading/error states and auto-detects IMDb IDs to route to
the correct endpoint.

**Rationale**: Matches existing codebase pattern. No proxy needed
since TMDB API key is public-per-use (only needed for requests,
not secret on client side).

**Alternatives considered**:
- OMDb API: Less complete data for Kdramas
- TVmaze: No IMDb ID lookup endpoint
- Backend proxy: Violates client-side processing principle

### Deduplication Strategy

**Decision**: When adding a new Dorama, check existing node IDs
before appending. Use a Set of existing IDs for O(1) lookups.
Skip actor nodes whose TMDB ID already exists in the graph.

**Rationale**: Ensures actor nodes are never duplicated even
when actors appear across multiple shows. Simple, fast.

**Alternatives considered**:
- Database-style upsert: Overengineered for in-memory array
- Immutable full-replace: Wipes out cross-references

### Cross-Reference Highlighting

**Decision**: During `addDorama`, compute the intersection of new
actor IDs and existing actor node IDs. Store the matched IDs in
Zustand's `highlightedNodes` set for the UI to consume. Clear
after a configurable timeout or user dismiss.

**Rationale**: Pure client-side computation, instant feedback,
no server round-trips. Zustand is already in the project for
ephemeral state.

**Alternatives considered**:
- Filter in component render: Less performant on large graphs
- Store in localStorage: Not needed — it's ephemeral UI state

### Graph Node Rendering

**Decision**: Use custom canvas node painting via
`react-force-graph-2d`'s `nodeCanvasObject` prop. Dorama nodes:
larger squares with accent color (`#f59e0b` amber). Actor nodes:
smaller circles with neutral color (`#64748b` slate). Text labels
below each node.

**Rationale**: Matches the industrial dashboard theme from the
constitution. Custom canvas rendering gives full control over
node appearance without DOM overhead.

**Alternatives considered**:
- Default circle nodes: No visual distinction between types
- HTML labels via `nodeRelSize`: Performance penalty at scale
- SVG overlay: Breaks force-graph's internal rendering pipeline
