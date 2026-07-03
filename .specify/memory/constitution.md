<!--
  Sync Impact Report

  Version change: 1.0.0 → 2.0.0 (MAJOR — backward-incompatible principle removals/redefinitions)
  Modified principles:
    - I.   "Simplicity over Cleverness" → "Vibe Coding Methodology" (redefined)
    - II.  "TypeScript Strict Mode" → "User-Centric Data Isolation" (replaced)
    - III. "No Duplicated Business Logic" → "Client-Side Processing" (replaced)
    - IV.  "Every Feature Must Be Fully Typed" → "Firestore as Source of Truth" (replaced/merged)
    - V.   "UI Must Be Responsive" → "Clean Code & Modularity" (replaced)
    - VI.  "Accessibility is Required" → removed
    - VII. "Firestore is the Source of Truth" → merged into principle IV
    - VIII."Graph is Derived Data and Must Never Be Persisted" → subsumed by Client-Side Processing
    - IX.  "Every API Call Must Be Cached" → removed
    - X.   "Every Feature Must Include Automated Tests" → removed
  Added sections: Security & Deployment Rules (new Section 3)
  Removed sections: State, Auth & Infrastructure (superseded); API Caching; Accessibility; Automated Tests
  Templates requiring updates: None — all templates use generic references
  Follow-up TODOs: None
-->

# DoramaActors Constitution

## Core Principles

### I. Vibe Coding Methodology

Prioritize functional prototypes and rapid iteration. Code MUST be
clean, modular, and easy to read. Pragmatism over perfection —
ship working features first, refine iteratively. Complexity MUST be
justified and kept minimal. If a solution is not immediately
understandable, it is too complex.

### II. User-Centric Data Isolation

Every user owns their own isolated graph data (Doramas watched,
Actors known). Firestore security rules MUST enforce per-UID access
at the document level. No user, endpoint, or query MAY access
another user's data. Data boundaries are non-negotiable.

### III. Client-Side Processing

Graph visualization and layout computation MUST happen entirely on
the client-side using React. No server-side rendering, backend
processing, or persistence of graph state is permitted. The browser
is the sole computation target. Graph state (zoom, pan, layout) is
ephemeral UI state only.

### IV. Firestore as Source of Truth

All persisted application state MUST be stored in Firestore.
Firestore is the authoritative store — no local-first or dual-storage
patterns. Security rules MUST enforce per-UID data isolation on
every document read and write. Offline persistence MAY be enabled
for resilience but Firestore remains the single source of truth.

### V. Clean Code & Modularity

Code MUST be clean, modular, and easy to read. Prefer composition
over inheritance. Feature-based folder structure with domain-driven
naming. No duplicated business logic. Shared logic MUST be extracted
into composable utilities, hooks, or domain services.

## Technical Standards

### Framework & Build

- **Framework:** React with Vite.
- Build scripts and routing MUST be compatible with Netlify's SPA
  requirements (e.g., `_redirects` file for React Router).

### Styling

- Tailwind CSS v4 for all styling.
- No inline styles (`style={{}}`) are permitted.
- Design direction: modern, minimalist, clean UI inspired by
  **industrial dashboards** — high contrast, clear typography,
  functional layout without unnecessary clutter.
- CSS custom properties MAY be used for theme tokens but MUST be
  defined in the Tailwind config.

### State Management

- React Hooks and Context API are the default approach.
- Zustand MAY be adopted if global state complexity increases to a
  point where Context becomes unwieldy. The decision MUST be
  justified in the PR.
- No other state libraries (Redux, TanStack Query) are permitted
  unless a specific need is documented and approved.

### Graph Library

- `react-force-graph-2d` or `react-force-graph-3d` is the graph
  rendering library. Choice depends on performance and visual
  requirements.
- Graph state (node positions, edge routing, viewport) is ephemeral
  client-side UI state only — MUST NOT be persisted.

## Security & Deployment Rules

### Environment Variables

AI agents are strictly **PROHIBITED** from reading, accessing,
modifying, or querying `.env` configuration files. The human
developer handles all secret key injections manually. This rule
applies to all automation, scripts, and tooling.

### Authentication & Authorization

- Firebase Authentication with Google Provider MUST be used.
- Auth state MUST be consumed via a React Context provider.
- Protected routes MUST redirect unauthenticated users to login.
- All Firestore reads/writes MUST be protected by security rules
  ensuring users can only access their own UID's data.

### Backend & APIs

- No custom backend server until absolutely necessary.
- Firestore and Firebase Functions are the only approved backend
  surfaces.
- TMDB (The Movie Database) is the primary external API — all calls
  MUST be proxied through a service layer with rate limiting and
  error normalization.

### Deployment

- Netlify is the sole deployment platform.
- Deploy previews MUST be generated for every PR.
- Build scripts MUST include a `_redirects` file for React Router
  SPA routing.
- Environment variables MUST be managed in the Netlify dashboard.

## Governance

This constitution supersedes all ad-hoc practices and informal
conventions. All project decisions, code reviews, and architectural
discussions MUST reference the constitution for compliance.

**Amendment Procedure**:

1. A written proposal MUST describe the change, rationale, and
   migration plan.
2. The proposal MUST be reviewed and approved by at least one
   other contributor.
3. Once approved, the constitution file is updated and the version
   is bumped according to semantic versioning rules:
   - **MAJOR**: backward-incompatible principle removals or
     redefinitions.
   - **MINOR**: new principles or materially expanded sections.
   - **PATCH**: clarifications, wording fixes, typos.
4. The Sync Impact Report (prepended as HTML comment) MUST be
   updated with each amendment.

**Compliance Review**:

- Every PR MUST include a verification that the change complies
  with all principles and rules in this constitution.
- Complexity MUST be justified in PR descriptions.
- Non-compliant PRs MUST be blocked until resolved.

**Version**: 2.0.0 | **Ratified**: 2026-07-03 | **Last Amended**: 2026-07-03
