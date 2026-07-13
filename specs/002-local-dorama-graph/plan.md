# Implementation Plan: Local Dorama Graph Tracker

**Branch**: `002-local-dorama-graph` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-local-dorama-graph/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A local-first web application for tracking Kdramas and visualizing
actor connections via an interactive force-directed graph. Users
search by title or IMDb ID using the TMDB API, add shows with their
full cast, and explore a canvas of Dorama and Actor nodes. All data
persists in the browser's localStorage — no backend or cloud
database required.

## Technical Context

**Language/Version**: TypeScript ~5.6, React 19

**Primary Dependencies**: react, react-dom, react-force-graph-2d,
zustand, tailwindcss v4, @tailwindcss/vite

**Storage**: Browser localStorage (key: `dorama_graph_data`)

**Testing**: Vitest with React Testing Library

**Target Platform**: Modern desktop web browsers (Chrome, Firefox,
Edge) with full Canvas and localStorage support

**Project Type**: Single-page application (SPA)

**Performance Goals**: Graph renders with 20+ doramas and 300+
actor nodes. Hover highlight responds within 100ms. Full graph loads
from localStorage and renders within 3 seconds.

**Constraints**: All data in localStorage only — no cloud databases.
All graph computation on client-side. AI agents must never read or
write `.env` files. Netlify SPA deployment with `_redirects`.

**Scale/Scope**: Single-user-per-browser. Desktop-first. Kdrama-
focused data via TMDB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Check | Status |
|---|-----------|-------|--------|
| I | Vibe Coding Methodology — rapid iteration, clean modular code | 5-phase incremental approach; each phase ships working value; composable hooks and feature-based folder structure | ✅ Pass |
| II | Local-First Data — localStorage only, no cloud databases | All graph data persisted under `dorama_graph_data` key; custom `useLocalStorageGraph` hook abstracts storage | ✅ Pass |
| III | Client-Side Processing — graph in browser, no server | `react-force-graph-2d` runs entirely in browser; no backend computation or persistence of graph state | ✅ Pass |

**Additional standards from Technical Standards section:**
- React + Vite ✓ | Tailwind CSS v4 ✓ | Industrial dashboard theme ✓
- react-force-graph-2d ✓ | Zustand for ephemeral UI state ✓
- Netlify deployment with `_redirects` ✓
- TMDB API via service layer ✓
- Environment Variables: AI agents prohibited from `.env` ✓

**Violations**: None. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-local-dorama-graph/
├── plan.md                # This file (/speckit.plan command output)
├── spec.md                # Feature specification
├── research.md            # Phase 0 output (/speckit.plan command)
├── data-model.md          # Phase 1 output (/speckit.plan command)
├── quickstart.md          # Phase 1 output (/speckit.plan command)
├── checklists/
│   └── requirements.md    # Spec quality checklist
└── contracts/             # Phase 1 output (/speckit.plan command)
```

### Source Code (repository root)

```text
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── drawer/
│   │   └── DoramaDetailsDrawer.tsx # NEW: Dorama details drawer with cross-ref actors
│   ├── layout/
│   │   ├── Sidebar.tsx         # Search input + stats widget
│   │   └── GraphCanvas.tsx     # Graph container
│   └── graph/
│       └── ForceGraph.tsx      # react-force-graph-2d wrapper
├── hooks/
│   ├── useLocalStorageGraph.ts # NEW: localStorage graph CRUD
│   ├── useGraph.ts             # Updated: uses localStorage instead of Firestore
│   └── useTMDB.ts              # TMDB search + cast fetch
├── services/
│   └── tmdb.ts                 # TMDB API calls (search, find, credits)
├── store/
│   └── graphStore.ts           # Zustand store for ephemeral graph UI state
├── types/
│   ├── graph.ts                # Node, Link, GraphDocument interfaces
│   └── tmdb.ts                 # TMDB API response types
├── utils/
│   ├── graphTransform.ts       # TMDB data → graph nodes/links
│   └── deduplicate.ts          # Deduplication helpers
└── styles/
    └── index.css               # Tailwind entry
```

**Structure Decision**: Single-project SPA layout with feature-based
component folders under `src/`. Services layer abstracts TMDB API.
Custom hooks for localStorage persistence. Zustand store for
ephemeral graph interaction state. See constitution Technical
Standards for rationale.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
