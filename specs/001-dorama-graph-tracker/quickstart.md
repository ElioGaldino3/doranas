# Quickstart: Dorama Graph Tracker

**Date**: 2026-07-03

## Prerequisites

- Node.js 18+
- Firebase project with Google Auth and Firestore enabled
- TMDB API key (developer provides via Netlify env vars)
- Netlify account (for deployment)

## Setup

```bash
# 1. Clone and install
npm install

# 2. Configure Firebase
# Developer: copy .env.example to .env and fill in Firebase config values
# AI agents: DO NOT touch .env files

# 3. Start dev server
npm run dev
```

## Validation Scenarios

### Scenario 1: Authentication

1. Open `http://localhost:5173`
2. **Expected**: Login prompt is shown, graph canvas is not accessible
3. Click "Sign in with Google"
4. **Expected**: Browser redirects to Google consent, then returns to
   the app showing an empty graph canvas

### Scenario 2: Add a Dorama

1. Sign in (see Scenario 1)
2. Type "Reply 1988" in the search input and press Enter
3. **Expected**: Search results appear below the input
4. Select the correct Dorama from results
5. **Expected**: A Dorama node labeled "Reply 1988" appears on the
   canvas with its cast Actor nodes connected by edges. The new nodes
   are highlighted briefly.

### Scenario 3: Cross-Reference Highlight

1. Add Dorama "Reply 1988" (Scenario 2)
2. Add Dorama "Hospital Playlist" (shares several actors)
3. **Expected**: When "Hospital Playlist" is added, any actors already
   in the graph (from Reply 1988) pulse or glow to highlight the
   connection. All new nodes and edges render correctly.

### Scenario 4: Graph Interaction

1. With 2+ Doramas added, hover over an Actor node
2. **Expected**: All Dorama nodes connected to that actor are
   highlighted; all other nodes are dimmed
3. Hover over a Dorama node
4. **Expected**: All Actor nodes for that Dorama are highlighted

### Scenario 5: IMDb ID Search

1. Sign in and paste `tt5182864` (IMDb ID for "Reply 1988") into the
   search input
2. **Expected**: The system resolves the ID and presents the Dorama
   for addition

## Verification Commands

```bash
# TypeScript check
npx tsc --noEmit

# Dev server (manual testing)
npm run dev

# Run tests (when implemented)
npm test
```

## Deployment

```bash
# Build for production
npm run build

# Preview build locally
npx serve dist

# Deploy to Netlify
# Developer: connect GitHub repo to Netlify, set env vars in dashboard
# Netlify auto-deploys on push to main. Ensure `_redirects` is in
# the publish directory for SPA routing.
```
