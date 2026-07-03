---

description: "Task list for Dorama Graph Tracker feature implementation"

---

# Tasks: Dorama Graph Tracker

**Input**: Design documents from `/specs/001-dorama-graph-tracker/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested in spec — tests are OPTIONAL and excluded from this task list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (SPA architecture)
- Paths follow the project structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic tooling

- [X] T001 Scaffold Vite + React + TypeScript project at repository root
- [X] T002 [P] Install and configure Tailwind CSS v4 in `src/styles/index.css`
- [X] T003 [P] Install dependencies: `firebase`, `react-force-graph-2d`, `lucide-react`, `zustand`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Setup Firebase config file `src/lib/firebase.ts` (export auth, provider, and db instances)
- [X] T005 [P] Create Auth Context `src/hooks/useAuth.ts` and `src/context/AuthContext.tsx` to manage user login state with Google
- [X] T006 [P] Create base TypeScript types in `src/types/graph.ts` (Node, Link, GraphDocument) and `src/types/tmdb.ts` (SearchResult, CastResult)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Sign In and View Graph (Priority: P1) 🎯 MVP

**Goal**: A user signs in with Google and sees their personal graph canvas (empty for new users, populated for returning users).

**Independent Test**: Sign in as a new user — empty graph canvas is displayed with placeholder text. Sign in as returning user — graph nodes and edges are rendered correctly.

### Implementation for User Story 1

- [X] T007 [P] [US1] Build `LoginButton` component in `src/components/auth/LoginButton.tsx` with industrial minimalist design
- [X] T008 [P] [US1] Build main `Dashboard` layout in `src/App.tsx` with sidebar for controls and main area for graph
- [X] T009 [P] [US1] Integrate `ForceGraph2D` in `src/components/graph/ForceGraph.tsx` component
- [X] T010 [US1] Customize `ForceGraph2D` canvas drawing in `src/components/graph/ForceGraph.tsx` — Dorama nodes as blue squares, Actor nodes as gray circles
- [X] T011 [US1] Create Zustand graph store in `src/store/graphStore.ts` with nodes and links state

**Checkpoint**: At this point, User Story 1 should be fully functional — user can sign in/out and see their graph canvas rendering.

---

## Phase 4: User Story 2 - Add a Dorama to the Graph (Priority: P2)

**Goal**: A signed-in user searches for a Dorama (by title or IMDb ID), selects it, and adds it to their graph. The cast is fetched, nodes/links are created, and existing actors are cross-referenced and highlighted.

**Independent Test**: Search for a known Dorama, add it, and verify the Dorama node and all cast actor nodes appear connected in the graph. Add a second Dorama sharing actors — verify the shared actors are highlighted.

### Implementation for User Story 2

- [X] T012 [US2] Implement `tmdb.ts` service in `src/services/tmdb.ts` with functions: `searchSeries`, `findByImdbId`, `getSeriesCast`
- [X] T013 [US2] Build `AddDoramaForm` component in `src/components/search/SearchInput.tsx` (input field handling both text and IMDb ID)
- [X] T014 [US2] Implement graph transform logic in `src/utils/graphTransform.ts` to parse TMDB results into `{ nodes, links }` arrays with deduplication
- [X] T015 [US2] Implement Firestore sync logic in `src/services/firestore.ts` — load graph data on mount, save on updates
- [X] T016 [US2] Add cross-reference highlight logic in `src/store/graphStore.ts` — detect existing actors in new cast and pulse/glow them

**Checkpoint**: At this point, User Stories 1 AND 2 should work independently — user can sign in, add Doramas, and see the graph populate with cross-reference highlights.

---

## Phase 5: User Story 3 - Explore Graph Connections (Priority: P3)

**Goal**: A signed-in user hovers over nodes in the graph to discover how actors connect across their watched Doramas.

**Independent Test**: Add 2+ Doramas that share actors, then hover over an Actor node — all connected Doramas highlight and the rest dim. Hover over a Dorama — all connected actors highlight.

### Implementation for User Story 3

- [X] T017 [US3] Add hover interaction logic in `src/components/graph/ForceGraph.tsx` — highlight adjacent nodes, dim non-connected nodes

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T018 [P] Final UI polish applying strict Tailwind v4 utility classes for the industrial dashboard aesthetic across all components
- [X] T019 [P] Prepare SPA fallback routing file (`public/_redirects`) for Netlify deployment
- [X] T020 Create `firestore.rules` at repository root with per-UID security rules

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on Dashboard layout from US1 for `AddDoramaForm` placement
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on `ForceGraph2D` integration from US1 and graph data from US2

### Within Each User Story

- Models/types before services
- Services before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- US1 tasks T007-T009 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all UI components together:
Task: "Build LoginButton component in src/components/auth/LoginButton.tsx"
Task: "Build Dashboard layout in src/App.tsx"
Task: "Integrate ForceGraph2D in src/components/graph/ForceGraph.tsx"

# Then (depends on UI scaffold):
Task: "Customize ForceGraph2D canvas drawing in src/components/graph/ForceGraph.tsx"
Task: "Create Zustand graph store in src/store/graphStore.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently — sign in/out, empty graph canvas renders
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add polish/cross-cutting → Deploy/Demo (v1.0)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests are OPTIONAL — not included unless explicitly requested
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- AI agents: DO NOT read, modify, or query `.env` files per constitution rules
- Developer must manually inject Firebase config and TMDB API key into Netlify env vars
