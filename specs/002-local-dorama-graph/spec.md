# Feature Specification: Local Dorama Graph Tracker

**Feature Branch**: `002-local-dorama-graph`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Software Design Document for a local-first Dorama graph tracker application"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search and Add Dorama to Graph (Priority: P1)

A user wants to track a Kdrama they have watched. They type the show's title into a search field, see matching results, select one, and the system fetches its cast and adds it to their personal graph with all actors connected to it.

**Why this priority**: This is the core interaction — without adding doramas, there is no graph to display. Everything else depends on this.

**Independent Test**: Can be fully tested by searching for a known Kdrama title, selecting it from results, and verifying the graph canvas shows a new Dorama node with connected Actor nodes.

**Acceptance Scenarios**:

1. **Given** the user has an empty graph, **When** they search for a valid Kdrama title and select a result, **Then** the graph canvas shows one Dorama node and multiple Actor nodes connected by ACTED_IN edges.
2. **Given** the user has an existing graph with one Dorama, **When** they add a second Dorama that shares actors with the first, **Then** the shared actors appear as single nodes with edges to both Dorama nodes.
3. **Given** the search returns no results, **When** the user submits a query, **Then** a clear "No results found" message is displayed.

---

### User Story 2 - Cross-Reference Detection on Add (Priority: P2)

When adding a new Dorama, the user wants to instantly see which actors from the new cast they have already encountered in previously tracked shows.

**Why this priority**: This delivers the core insight value — seeing connections across shows — and builds directly on Story 1.

**Independent Test**: Can be tested by adding two doramas that share at least one actor, then verifying the shared actor nodes are visually distinct (highlighted or labeled) during the add flow.

**Acceptance Scenarios**:

1. **Given** the graph already contains Dorama A with actor X, **When** the user adds Dorama B that also features actor X, **Then** actor X is visually highlighted in the addition confirmation as a "previously seen" actor.
2. **Given** no actors overlap between the new Dorama and existing graph, **When** the addition completes, **Then** no special cross-reference highlight is shown.

---

### User Story 3 - Add Dorama via IMDb ID (Priority: P3)

A user knows the IMDb ID of a Kdrama (e.g., `tt10850932` for Crash Landing on You) and wants to add it directly without searching by title.

**Why this priority**: This is an alternative input method that power users may prefer, but the text search covers most use cases.

**Independent Test**: Can be tested by entering a valid IMDb ID and verifying the resulting Dorama node and its cast appear in the graph.

**Acceptance Scenarios**:

1. **Given** the user knows a valid IMDb ID, **When** they enter it in the IMDb ID input field, **Then** the system resolves the ID to the correct Dorama, fetches its cast, and adds everything to the graph.
2. **Given** the user enters an invalid or non-existent IMDb ID, **When** they submit, **Then** a clear error message is shown.

---

### User Story 4 - Explore and Interact with the Graph (Priority: P1)

Once doramas are added, the user explores their graph by hovering over nodes to see connections, visually distinguishing between Dorama and Actor nodes, and understanding how actors link their watched shows.

**Why this priority**: Graph interaction is the primary way users consume the data. Without this, the graph is just a static image.

**Independent Test**: Can be tested by hovering over a node and verifying connected nodes and edges are highlighted while the rest dim.

**Acceptance Scenarios**:

1. **Given** a graph with multiple doramas, **When** the user hovers over an Actor node, **Then** all connected Dorama nodes and edges remain highlighted while unconnected nodes dim.
2. **Given** a graph with multiple actors, **When** the user hovers over a Dorama node, **Then** all connected Actor nodes and edges remain highlighted while unconnected nodes dim.
3. **Given** the graph is rendered, **When** the user looks at the canvas, **Then** Dorama nodes are visually larger and use an accent color, while Actor nodes are smaller and use a neutral color.

### User Story 5 - Dorama Details Drawer with Cross-Reference (Priority: P1)

When the user clicks a Dorama node, a drawer slides in showing all actors from that dorama who also appear in other tracked shows, making cross-references easy to browse.

**Independent Test**: Add two doramas sharing an actor (e.g., Hyun Bin in both), click the first dorama, and verify the drawer shows Hyun Bin with a link to the second dorama.

**Acceptance Scenarios**:

1. **Given** the graph has multiple doramas with shared actors, **When** the user clicks a Dorama node, **Then** a drawer slides from the right showing the dorama title and a "Atores já assistidos" section.
2. **Given** a shared actor exists, **When** viewing the drawer, **Then** the actor's profile photo, name, and a bullet list of other doramas they appear in is displayed (excluding the current dorama).
3. **Given** the clicked dorama has no actors shared with other shows, **When** viewing the drawer, **Then** a "Nenhum ator em comum" message is displayed.
4. **Given** the drawer is open, **When** clicking outside or pressing the close button, **Then** the drawer slides out and closes.

### Edge Cases

- What happens when localStorage is full or unavailable? The system shows a clear error message explaining the limitation.
- How does the system handle TMDB API rate limits or downtime? The search returns a friendly "Search temporarily unavailable" message.
- What happens if a user adds the same Dorama twice? The system detects the duplicate (by TMDB ID) and notifies the user without creating duplicate nodes.
- How does the app behave on first visit with no data? The graph canvas shows an empty state with a prompt to search and add their first Dorama.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to search for Kdramas by title using a text input field and see matching results from TMDB.
- **FR-002**: Users MUST be able to add a searched Dorama to their personal graph, which fetches the full cast and creates all Actor nodes and ACTED_IN edges.
- **FR-003**: Users MUST be able to add a Dorama by entering a valid IMDb ID.
- **FR-004**: The graph visualization MUST display two visually distinct node types: Dorama nodes (larger, accent color) and Actor nodes (smaller, neutral color).
- **FR-005**: Hovering over any node MUST highlight its directly connected nodes and edges while dimming unconnected elements.
- **FR-006**: When adding a new Dorama, the system MUST check the existing graph data and flag any actors that already exist in the graph as "previously seen."
- **FR-007**: All graph data (nodes and links) MUST be persisted in the browser's localStorage and restored on subsequent visits.
- **FR-008**: The system MUST detect and prevent duplicate Dorama entries (by TMDB ID), notifying the user if they try to add one already in the graph.

### Key Entities *(include if feature involves data)*

- **Dorama (Show)**: A Kdrama television series. Key attributes: TMDB ID, title, poster image URL. Identified as a larger, accent-colored node in the graph.
- **Actor**: A person who has acted in one or more Doramas. Key attributes: TMDB ID, name, profile image URL. Identified as a smaller, neutral-colored node in the graph.
- **Edge (ACTED_IN)**: A connection between an Actor and a Dorama representing the actor's participation in that show.
- **Graph Data**: A collection of all Dorama nodes, Actor nodes, and ACTED_IN edges, stored as a serialized JSON object under a single localStorage key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can search for a Kdrama, select it, and see it appear in the graph with its cast in under 5 seconds (assuming typical network conditions and TMDB API responsiveness).
- **SC-002**: Users can add at least 10 doramas to their graph without any performance degradation in rendering or interaction.
- **SC-003**: Cross-reference detection identifies and flags shared actors within 1 second of a new Dorama addition completing.
- **SC-004**: The application loads a pre-existing graph with 20 shows and 300 actors and renders it interactively within 3 seconds.

## Assumptions

- The user has access to a TMDB API key, which they configure manually in the environment.
- The application targets modern desktop web browsers with full Canvas and localStorage support.
- Mobile responsiveness and touch interactions are out of scope for the initial version.
- TMDB API rate limits and availability are sufficient for reasonable personal use (not bulk operations).
- The user has a stable internet connection for TMDB API calls (search, details, cast fetch).
- All Dorama and Actor data is public and requires no authentication to fetch from TMDB.
