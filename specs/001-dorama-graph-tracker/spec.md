# Feature Specification: Dorama Graph Tracker

**Feature Branch**: `001-dorama-graph-tracker`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "A web application allowing users to track Kdramas (Doramas) they have watched and visualize the connections between actors across different shows using a node-based graph interface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In and View Graph (Priority: P1)

A user opens the application and signs in with their Google account.
They are presented with their personal graph showing all previously
tracked Doramas and the actors that connect them.

**Why this priority**: Authentication gates everything — without a
signed-in user there is no personalized graph data. This story is the
foundation every other feature depends on.

**Independent Test**: Can be fully tested by signing in as a new user
and verifying an empty graph is shown, then signing in as an existing
user with pre-loaded data and verifying the graph displays correctly.

**Acceptance Scenarios**:

1. **Given** the user is not signed in, **When** they open the app,
   **Then** they see a login prompt and cannot access graph features.
2. **Given** the user signs in with Google for the first time,
   **When** authentication succeeds, **Then** an empty graph canvas is
   displayed with placeholder text.
3. **Given** a returning user who has previously added Doramas,
   **When** they sign in, **Then** their full graph (nodes and
   connections) is rendered within 3 seconds.

---

### User Story 2 - Add a Dorama to the Graph (Priority: P2)

A signed-in user searches for a Dorama they have watched, selects it
from results, and adds it to their personal graph. The system fetches
the cast and immediately highlights any actors already present in the
user's existing graph.

**Why this priority**: Adding Doramas is the core data-entry action
that populates the graph. Without it, the graph is empty and provides
no value.

**Independent Test**: Can be fully tested by searching for a known
Dorama, adding it, and verifying the new Dorama node and its actor
nodes appear in the graph with correct labels.

**Acceptance Scenarios**:

1. **Given** a signed-in user with an empty graph, **When** they
   search for a Dorama by title and select one, **Then** the Dorama
   is added and its cast actors appear as connected nodes.
2. **Given** a signed-in user, **When** they search by a known IMDb
   identifier, **Then** the corresponding Dorama is found and can be
   added to the graph.
3. **Given** a user adding a Dorama whose cast includes actors
   already in their graph, **When** the addition completes, **Then**
   those existing actors are visually highlighted to show the cross-
   reference.
4. **Given** a search that returns no results, **When** the user
   submits a query, **Then** a clear "no results" message is shown
   with an option to try a different search.

---

### User Story 3 - Explore Graph Connections (Priority: P3)

A signed-in user interacts with their graph by hovering over nodes
to discover how actors connect across their watched Doramas.

**Why this priority**: Graph interactivity is the primary value
differentiator, but it depends on having data in the graph first.

**Independent Test**: Can be fully tested by adding multiple Doramas
that share actors, then hovering over nodes to verify connection
highlighting works.

**Acceptance Scenarios**:

1. **Given** a graph with multiple Doramas and actors, **When** the
   user hovers over a Dorama node, **Then** all actor nodes connected
   to that Dorama are highlighted and the rest are dimmed.
2. **Given** a graph with multiple Doramas and actors, **When** the
   user hovers over an actor node, **Then** all Dorama nodes that
   actor appears in are highlighted.
3. **Given** an actor appearing in multiple watched Doramas, **When**
   the user examines the graph, **Then** the multiple connections are
   visually apparent.

---

### Edge Cases

- What happens when a user has more than 50 Doramas with hundreds of
  actors? The graph should remain interactive without significant
  lag.
- How does the system handle a Dorama being added that was already
  in the user's graph? A duplicate detection notice should be shown
  and the addition rejected.
- How does the system handle TMDB API failures or rate limits? A
  user-friendly error message should explain the issue and suggest
  retrying.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to sign in using their Google
  account.
- **FR-002**: The system MUST display a personalized graph canvas
  after sign-in, showing only the authenticated user's data.
- **FR-003**: Users MUST be able to search for Doramas by title text.
- **FR-004**: Users MUST be able to search for Doramas by IMDb
  identifier.
- **FR-005**: The system MUST fetch cast details for a selected
  Dorama and prepare them as actor nodes connected to the Dorama.
- **FR-006**: The system MUST detect actors in a newly added Dorama
  that already exist in the user's graph and visually highlight them.
- **FR-007**: The graph MUST render two visually distinct node types:
  Dorama nodes and Actor nodes.
- **FR-008**: Hovering over any node MUST highlight its directly
  connected nodes and dim the rest.
- **FR-009**: The system MUST prevent duplicate Dorama entries in a
  user's graph and notify the user.
- **FR-010**: The system MUST gracefully handle external data source
  errors with a clear user-facing message.
- **FR-011**: Unauthenticated users MUST NOT be able to view or
  modify any graph data.
- **FR-012**: Users MUST be able to log out, returning to the login
  prompt.

### Key Entities

- **User**: The person using the application, identified by their
  Google account. Each user has their own isolated graph.
- **Dorama**: A Kdrama show that a user has watched and added to
  their graph. Attributes include a title, poster image, and IMDb
  identifier.
- **Actor**: A performer who has acted in one or more Doramas in the
  user's graph. Each actor has a name and profile image.
- **Graph**: A collection of all Doramas and Actors tracked by a
  single user, along with the "acted in" connections between them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete Google sign-in and see an empty
  graph canvas in under 30 seconds.
- **SC-002**: An existing user can find and add a Dorama in 3 or
  fewer clicks/clicks-and-typing steps.
- **SC-003**: Cross-reference highlighting of existing actors
  completes within 2 seconds of adding a new Dorama.
- **SC-004**: The graph canvas remains responsive (no user-noticeable
  lag) with up to 50 Doramas and 300 actors rendered.
- **SC-005**: 100% of user interactions (login, search, add, hover)
  succeed on first attempt after any required data loads.

## Assumptions

- Users have a Google account and are comfortable with Google-based
  authentication.
- Target users are Kdrama enthusiasts who want to discover
  connections between actors across different shows.
- Mobile responsiveness is secondary — the primary target is desktop
  with a large canvas area.
- The layout uses a fixed sidebar for controls, with the graph
  canvas occupying the majority of the screen.
- External data sources (IMDb/TMDB) are available and the project has
  valid access credentials managed by the developer.
- A single document per user is sufficient to store graph data for
  expected usage volumes. If a user's graph grows very large, data
  may need to be split across documents in a future iteration.
