# Implementation Plan: Dorama Graph Tracker

**Branch**: `001-dorama-graph-tracker` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-dorama-graph-tracker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

A web application that lets Kdrama enthusiasts track Doramas they
have watched and visualize actor connections across shows using an
interactive force-directed graph. Users sign in with Google, search
and add Doramas (by title or IMDb ID), and explore a canvas showing
Dorama and Actor nodes connected by "acted in" edges.

## Technical Context

**Language/Version**: TypeScript, React 19

**Primary Dependencies**: Firebase (Auth + Firestore), react-force-graph-2d,
Tailwind CSS v4, Zustand

**Storage**: Firebase Firestore — `users/{uid}/graphData`

**Testing**: Vitest with React Testing Library

**Target Platform**: Modern desktop web browsers (Chrome, Firefox, Edge)

**Project Type**: Single-page application (SPA)

**Performance Goals**: Graph renders and stays interactive with 50+
Doramas and 300+ actor nodes. Node hover highlight responds within
100ms.

**Constraints**: All graph computation on client-side only. Firestore
per-UID security rules. AI agents must never read/write `.env` files.

**Scale/Scope**: Single-user-per-instance graph. Desktop-first.
Kdrama-focused data via TMDB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Check | Status |
|---|-----------|-------|--------|
| I | Vibe Coding Methodology — rapid iteration, clean modular code | Implementation follows 5-phase incremental approach; each phase ships working value | ✅ Pass |
| II | User-Centric Data Isolation — per-UID Firestore rules | All graph data stored under `users/{uid}`; security rules enforce UID match | ✅ Pass |
| III | Client-Side Processing — graph in browser, no server | react-force-graph runs entirely in browser; no backend graph computation | ✅ Pass |
| IV | Firestore as Source of Truth | Graph state persisted to Firestore; no local-first or dual-storage | ✅ Pass |
| V | Clean Code & Modularity — composition, feature folders, no duplication | Feature-based structure with composable hooks/services; no duplicated business logic | ✅ Pass |

**Additional standards from Technical Standards section:**
- React + Vite ✓ | Tailwind CSS v4 ✓ | Industrial dashboard dark mode ✓
- react-force-graph-2d ✓ | Zustand for state ✓
- Netlify deployment with `_redirects` ✓
- TMDB API via service layer ✓
- Environment Variables: AI agents prohibited from `.env` — developer handles manually ✓

**Violations**: None. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-dorama-graph-tracker/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.tsx
├── App.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── GraphCanvas.tsx
│   ├── auth/
│   │   └── LoginButton.tsx
│   ├── search/
│   │   └── SearchInput.tsx
│   └── graph/
│       ├── ForceGraph.tsx
│       ├── DoramaNode.tsx
│       └── ActorNode.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useGraph.ts
│   └── useTMDB.ts
├── services/
│   ├── tmdb.ts
│   └── firestore.ts
├── store/
│   └── graphStore.ts          # Zustand store
├── types/
│   ├── graph.ts
│   └── tmdb.ts
├── utils/
│   ├── graphTransform.ts
│   └── deduplicate.ts
├── config/
│   └── firebase.ts
└── styles/
    └── index.css               # Tailwind entry

public/
├── _redirects                  # Netlify SPA routing

firestore.rules                 # Per-UID security rules
```

**Structure Decision**: Single-project SPA layout with feature-based
component folders under `src/`. Services layer abstracts TMDB and
Firestore. Zustand store for global graph state. See constitution
Technical Standards for rationale.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
