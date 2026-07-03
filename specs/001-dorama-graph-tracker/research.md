# Research: Dorama Graph Tracker

**Phase**: 0 — Outline & Research
**Date**: 2026-07-03

## Overview

All technical decisions are derived from the project constitution and
the user-provided implementation plan. No NEEDS CLARIFICATION markers
were required — the feature description and constitution together
provide complete guidance.

## Technology Decisions

### Framework & Build Tool
- **Decision**: React with Vite
- **Rationale**: Specified in constitution Technical Standards.
  Vite provides fast HMR, TypeScript support out of the box, and
  seamless Netlify deployment.
- **Alternatives considered**: Create React App (slower, deprecated
  in practice), Next.js (SSR — violates Client-Side Processing
  principle)

### Styling
- **Decision**: Tailwind CSS v4
- **Rationale**: Constitution mandates Tailwind CSS v4 and industrial
  dashboard aesthetic (high contrast, dark mode, sharp borders).
- **Alternatives considered**: CSS Modules (more verbose), styled-components
  (runtime cost, violates "no inline styles" spirit)

### Graph Library
- **Decision**: react-force-graph-2d
- **Rationale**: Constitution specifies react-force-graph-2d or 3d.
  2D is preferred for clarity in dense actor-dorama networks.
  WebGL-rendered canvas handles hundreds of nodes efficiently.
- **Alternatives considered**: react-force-graph-3d (visual noise for
  this use case), D3.js (lower level, more boilerplate), React Flow
  (rejected by constitution v2.0.0)

### State Management
- **Decision**: Zustand for graph state; React Context for auth state
- **Rationale**: Constitution allows Zustand when Context becomes
  unwieldy. Graph state (nodes, links, selections) is global and
  frequently updated — Zustand's simple API and subscription model
  fits better than deeply nested Context providers.
- **Alternatives considered**: React Context only (prop drilling risk
  across graph/search/sidebar), Redux (too heavy for this scope)

### Authentication
- **Decision**: Firebase Authentication with Google Provider
- **Rationale**: Constitution mandates Firebase Google Auth. Simple
  integration with Firestore security rules for per-UID isolation.

### Storage
- **Decision**: Firebase Firestore, collection `users/{uid}/graphData`
- **Rationale**: Constitution principle IV (Firestore as source of
  truth) and principle II (per-UID data isolation). Single document
  per user with nodes/links arrays.

### Deployment
- **Decision**: Netlify with `_redirects` for SPA routing
- **Rationale**: Constitution Technical Standards — Netlify is sole
  deployment platform. `_redirects` handles React Router client-side
  routing.

### External API
- **Decision**: TMDB (The Movie Database) via service layer
- **Rationale**: Constitution mandates TMDB as primary external API
  with proxied calls through a service layer for rate limiting and
  error normalization.

## Phase Breakdown (from user implementation plan)

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| 1 | Setup & Infrastructure | Vite project, Firebase config, Netlify config |
| 2 | Auth & Core UI | Google Login, sidebar layout, search input |
| 3 | TMDB API Integration | Search by text, search by IMDb ID, fetch cast |
| 4 | Graph Data Logic | Transform TMDB → graph nodes/links, merge/dedup, Firestore sync |
| 5 | Visualization | react-force-graph integration, node styling, overlap highlight |
