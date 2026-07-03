# Quickstart: Local Dorama Graph Tracker

## Prerequisites

- Node.js 18+
- npm
- TMDB API key (set as `VITE_TMDB_API_KEY` in `.env`)

## Setup

```bash
# Install dependencies
npm install

# Build and start dev server
npm run dev
```

## Validation Scenarios

### Scenario 1: Add Dorama by Title Search

1. Open the app in browser (`http://localhost:5173`)
2. In the sidebar search field, type "Crash Landing on You"
3. Select the matching result from the dropdown
4. **Expected**: Graph canvas displays one Dorama node (large, amber square)
   and multiple Actor nodes (small, slate circles) connected by edges.
5. Refresh the page
6. **Expected**: Graph is restored from localStorage — same nodes and links visible.

### Scenario 2: Add Dorama by IMDb ID

1. In the search field, enter `tt10850932`
2. **Expected**: System auto-detects IMDb ID format, resolves to
   "Crash Landing on You", fetches cast, adds to graph.
3. Duplicate detection: Enter `tt10850932` again.
4. **Expected**: System shows "This Dorama is already in your graph" message.
   No duplicate nodes created.

### Scenario 3: Cross-Reference Detection

1. Add "Crash Landing on You" (has Hyun Bin)
2. Add "Memories of the Alhambra" (also has Hyun Bin)
3. **Expected**: After adding the second show, Hyun Bin's node appears
   as a single node with edges to both Doramas. During the add flow,
   Hyun Bin is highlighted as "previously seen."

### Scenario 4: Graph Interaction

1. With 2+ doramas in the graph, hover over any Actor node.
2. **Expected**: Connected Dorama nodes and edges remain fully opaque.
   All unconnected nodes dim.
3. Hover over a Dorama node.
4. **Expected**: Connected Actor nodes remain highlighted; others dim.

### Scenario 5: Empty State

1. Clear localStorage (`localStorage.clear()` in dev tools).
2. Refresh the app.
3. **Expected**: Empty canvas with a prompt like "Search and add your
   first Dorama to get started."

## Build

```bash
npm run build
# Output in dist/
```
