<!--
  Sync Impact Report

  Version change: 2.0.0 → 3.0.0 (MAJOR — backward-incompatible principle removals/redefinitions)
  Modified principles:
    - I.   "Vibe Coding Methodology" — redefined to subsume Clean Code & Modularity
    - II.  "User-Centric Data Isolation" → "Local-First Data" (replaced)
    - III. "Client-Side Processing" — redefined (Firestore backend dependency removed)
    - IV.  "Firestore as Source of Truth" — removed
    - V.   "Clean Code & Modularity" — subsumed into Principle I
  Added sections: Data Privacy under Security & Agent Rules
  Removed sections: Authentication & Authorization; Backend & APIs; Firestore technical standards
  Templates requiring updates: ✅ plan-template.md (no changes needed — generic placeholders)
                              ✅ spec-template.md (no changes needed)
                              ✅ tasks-template.md (no changes needed)
                              ✅ checklist-template.md (no changes needed)
  Follow-up TODOs: None — all tokens resolved. .env.example still references Firebase vars;
                   developer should update if Firebase removed from project.
-->

# DoramaActors Constitution

## Core Principles

### I. Vibe Coding Methodology

Prioritize functional prototypes and rapid iteration. Code MUST be
clean, modular, and easy to read. Pragmatism over perfection —
ship working features first, refine iteratively. Complexity MUST be
justified and kept minimal. If a solution is not immediately
understandable, it is too complex. Composition over inheritance.
Feature-based folder structure with domain-driven naming. No
duplicated business logic — shared logic MUST be extracted into
composable utilities, hooks, or domain services.

### II. Local-First Data

All user data (Doramas watched, Actors known) is strictly stored in
the browser's `localStorage`. No external cloud databases, backends,
or third-party persistence services are permitted. The browser is
the sole data store. Data MUST be read and written via custom hooks
that abstract `localStorage` operations. The application MUST
gracefully handle `localStorage` unavailability (quota exceeded,
private browsing restrictions).

### III. Client-Side Processing

Graph visualization, layout computation, and data persistence happen
entirely on the client-side. No server-side rendering, backend
processing, or server-side persistence of graph state is permitted.
Graph state (zoom, pan, layout, node positions) is ephemeral UI
state only — MUST NOT be persisted. The browser is the sole
computation and rendering target.

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

### State Management

- React Hooks and custom hooks for `localStorage` synchronization.
- No external state management libraries are required for data
  persistence. Zustand or Context MAY be used for ephemeral UI state
  (e.g., selected node, sidebar open/closed) if complexity warrants.

### Graph Library

- `react-force-graph-2d` is the graph rendering library.
- Graph state (node positions, edge routing, viewport) is ephemeral
  client-side UI state only — MUST NOT be persisted.

## Security & Agent Rules (STRICT)

### Environment Variables

AI agents are strictly **PROHIBITED** from reading, accessing,
modifying, or querying `.env` configuration files. The human
developer handles all secret key injections (TMDB API key) manually.
This rule applies to all automation, scripts, and tooling.

### Data Privacy

Since all data resides in `localStorage`, the application MUST
provide mechanisms for users to clear their data and optionally
export/import JSON backups. No user data leaves the browser except
via explicit user-initiated export or TMDB API search requests.

## Deployment

- Netlify is the sole deployment platform.
- Build scripts MUST be simple and optimized for a static SPA.
- A `_redirects` file MUST be included for React Router SPA routing.
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

**Version**: 3.0.0 | **Ratified**: 2026-07-03 | **Last Amended**: 2026-07-03
