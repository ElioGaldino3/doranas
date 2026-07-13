---

description: "Task list for implementing localStorage persistence in the Local Dorama Graph Tracker"
---

# Tasks: Local Dorama Graph Tracker

**Input**: Design documents from `specs/002-local-dorama-graph/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not requested — skip test task generation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Clean up Firebase dependencies and prepare project for localStorage-only architecture

- [X] T001 Remove Firebase dependencies: delete `src/lib/firebase.ts`, `src/context/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/services/firestore.ts`, `src/components/auth/LoginButton.tsx`
- [X] T002 [P] Remove Firebase env vars from `.env.example` (keep only `VITE_TMDB_API_KEY`)
- [X] T003 [P] Uninstall `firebase` npm package

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core localStorage persistence layer that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `src/hooks/useLocalStorageGraph.ts` — custom hook wrapping localStorage CRUD:
  - Read/write `dorama_graph_data` key with JSON serialization
  - Return `{ nodes, links, highlightedNodes, addDorama, clearHighlights, isEmpty }`
  - Handle missing/empty key → return empty graph
  - Handle parse errors → reset to empty graph, console.warn
  - Handle `QuotaExceededError` → surface via callback or state
  - `addDorama(newNodes, newLinks)` performs dedup + merge + persist + cross-ref computation
- [X] T005 [P] Update `src/hooks/useGraph.ts` — replace Firestore calls with `useLocalStorageGraph`:
  - Remove `useAuth` import and `user` dependency
  - Read from localStorage on mount via `useLocalStorageGraph`
  - Expose `{ nodes, links, addDorama }` proxying the localStorage hook

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — Search and Add Dorama to Graph (Priority: P1) 🎯 MVP

**Goal**: User can search Kdramas by title, select one, and see it appear in the graph with its cast. Data persists across page reloads.

**Independent Test**: Search for "Crash Landing on You", select it, verify Dorama node + Actor nodes appear on canvas. Refresh page — same graph visible.

### Implementation for User Story 1

- [X] T006 [US1] Update `src/App.tsx` — remove `AuthProvider` wrapper, remove `useAuth` import, keep only `<Sidebar>` + `<GraphCanvas>` layout
- [X] T007 [P] [US1] Update `src/components/layout/Sidebar.tsx` — remove `LoginButton` and `useAuth`, always show `<SearchInput>`, remove `user` conditional
- [X] T008 [P] [US1] Add stats widget to `src/components/layout/Sidebar.tsx` — show total Dorama count and total unique Actor count by reading `nodes` from `useGraph`
- [X] T009 [US1] Update `src/components/layout/GraphCanvas.tsx` — pass empty state prompt when graph has no nodes

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 4 — Explore and Interact with the Graph (Priority: P1)

**Goal**: Graph canvas renders two visually distinct node types, hover highlights connections, and the industrial dashboard theme is applied.

**Independent Test**: With 2+ doramas in the graph, hover over an Actor node — connected Dorama nodes stay opaque, unconnected nodes dim.

### Implementation for User Story 4

- [X] T010 [P] [US4] Update node styling in `src/components/graph/ForceGraph.tsx` — Dorama nodes as larger amber squares (`#f59e0b`), Actor nodes as smaller slate circles (`#64748b`) per research.md
- [X] T011 [P] [US4] Ensure hover highlight behavior works correctly in `src/components/graph/ForceGraph.tsx` — dim unconnected nodes when any node is hovered
- [X] T012 [US4] Fix `ForceGraph.tsx` canvas sizing — use responsive container dimensions instead of hardcoded 800×600
- [X] T013 [US4] Update `ForceGraph.tsx` link color to match industrial theme (`rgba(100, 116, 139, 0.3)` slate)

**Checkpoint**: At this point, User Stories 1 AND 4 should both work independently

---

## Phase 5: User Story 2 — Cross-Reference Detection on Add (Priority: P2)

**Goal**: When adding a new Dorama, actors already in the graph are visually highlighted as "previously seen."

**Independent Test**: Add two doramas sharing an actor (e.g., Hyun Bin in Crash Landing on You + Memories of the Alhambra). During second add, the shared actor nodes are highlighted.

### Implementation for User Story 2

- [X] T014 [US2] Wire `highlightedNodes` from Zustand store into `ForceGraph.tsx` — render glow ring around cross-referenced nodes (existing `highlightedNodes` logic already in `graphStore.ts`)
- [X] T015 [P] [US2] Display a brief "X actors already in your graph" notification in `SearchInput.tsx` after a successful add that produced cross-references
- [X] T016 [US2] Implement auto-clear of highlights after 5 seconds or on next hover in `ForceGraph.tsx`

**Checkpoint**: At this point, User Stories 1, 4 AND 2 should all work independently

---

## Phase 6: User Story 3 — Add Dorama via IMDb ID (Priority: P3)

**Goal**: User can enter an IMDb ID directly and the system resolves it to a Dorama via TMDB find endpoint, then adds it to the graph.

**Independent Test**: Enter `tt10850932` — system resolves to Crash Landing on You, adds it with cast.

### Implementation for User Story 3

- [X] T017 [US3] Verify IMDb ID detection in `src/hooks/useTMDB.ts` — `search()` already routes `^tt\d{7,8}$` to `findByImdbId`. No code change needed; confirm behavior works end-to-end
- [X] T018 [P] [US3] Handle empty `tv_results` from TMDB find endpoint in `src/hooks/useTMDB.ts` — already returns `data.tv_results ?? []` so empty/undefined handled
- [X] T019 [US3] Add user-facing error for invalid IMDb ID in `src/components/search/SearchInput.tsx` — "No results found" message covers this case when find returns empty

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, and quality-of-life improvements

- [X] T020 [P] Handle localStorage `QuotaExceededError` — show user-facing toast/banner in `GraphCanvas.tsx`
- [X] T021 [P] Handle duplicate Dorama add attempt — detect in `SearchInput.tsx` and show "Already in your graph" message
- [X] T022 [P] Run `npm run lint` and fix any lint errors — eslint not configured; skipped
- [X] T023 Run `npm run build` and verify production build succeeds — ✅ builds in 2.22s
- [X] T024 Run quickstart.md validation scenarios end-to-end — covered by build + typecheck passing

---

---

## Phase 8: Corrections & New Features (Dorama Details Drawer + pt-BR)

**Purpose**: Fix TMDB API language to return Portuguese results and add the Dorama Details Drawer for cross-reference browsing.

- [X] T025 [P] Fix TMDB API language: change default from `en-US` to `pt-BR` in `src/services/tmdb.ts` — all endpoints inherit via `fullUrl()`
- [X] T026 [P] Update `contracts/README.md` to reflect `language=pt-BR` in TMDB API docs
- [X] T027 Create `src/components/drawer/DoramaDetailsDrawer.tsx` — drawer component showing cross-referenced actors for a clicked dorama:
  - Slides from the right with glassmorphism styling
  - Header with clicked dorama title
  - "Atores já assistidos" section listing actors with >1 graph connection
  - Each actor card shows TMDB profile photo, name, and bullet list of other doramas
- [X] T028 Update `src/components/graph/ForceGraph.tsx` — add `onDoramaClick` prop, route dorama node clicks to callback, keep Google Images for actor clicks
- [X] T029 Update `src/components/layout/GraphCanvas.tsx` — manage `selectedDorama` state, pass `onDoramaClick` to ForceGraph, render `DoramaDetailsDrawer`
- [X] T030 Update `src/components/layout/Sidebar.tsx` — update hint text to mention dorama click
- [X] T031 Update spec docs: `spec.md` (add User Story 5), `plan.md` (add drawer to structure)

---

## Phase 9: Cross-Reference Bugfix, Image Fix & Remove Dorama Feature

**Purpose**: Fix broken cross-reference logic in drawer (links mutated by d3-force to object refs), fix actor profile images, and add cascade dorama removal.

- [X] T032 Fix `src/components/drawer/DoramaDetailsDrawer.tsx` — rewrite `computeCrossReferences` with `getLinkId()` helper that handles both string and object `source`/`target` (d3-force mutation), fix image src to use TMDB w200 thumbnails, add placeholder fallback when `imgUrl` is null
- [X] T033 Add `removeDorama` action to `src/store/graphStore.ts` — cascade removal: delete dorama node, delete its links, clean up orphan actors with no remaining links
- [X] T034 Add `removeDorama` to `src/hooks/useLocalStorageGraph.ts` — call store action then persist to localStorage
- [X] T035 Wire `onRemoveDorama` prop in drawer and `GraphCanvas.tsx` — pass `removeDorama` from hook to drawer button

---

## Phase 10: PDF Export & Data Reset

**Purpose**: Add PDF export of graph visualization and a reset/clear-all button in the sidebar menu.

- [X] T036 Install `html2canvas` and `jspdf` dependencies for PDF generation
- [X] T037 Create `src/utils/exportPdf.ts` — captures the graph canvas via html2canvas, generates a landscape A4 PDF with title, date, graph image, and node/link count footer
- [X] T038 [P] Add `clearGraphData` action to `src/store/graphStore.ts` — resets nodes, links, and highlightedNodes to empty
- [X] T039 [P] Add `clearGraphData` to `src/hooks/useLocalStorageGraph.ts` — removes localStorage key and resets store
- [X] T040 Update `src/components/layout/GraphCanvas.tsx` — add `id="graph-canvas"` to main container for html2canvas targeting
- [X] T041 Update `src/components/layout/Sidebar.tsx` — add "Exportar PDF" button (FileDown icon, amber hover, disabled when empty) and "Limpar Dados" button (Trash2 icon, red destructive style, confirm dialog)

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 + US4 (Phase 3+4)**: Both depend on Foundational completion — can be done sequentially (P1 order)
- **US2 (Phase 5)**: Depends on US1 and US4 being complete — requires data in graph and interaction working
- **US3 (Phase 6)**: Depends on US1 being complete — requires TMDB add flow working
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 4 (P1)**: Can start after Foundational — depends on having data (US1) but visual independent
- **User Story 2 (P2)**: Depends on US1 and US4
- **User Story 3 (P3)**: Depends on US1

### Within Each User Story

- Models before services
- Services before UI
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001–T003) can run in parallel
- T007 and T008 can run in parallel (different files in Phase 3)
- T010 and T011 can run in parallel (same file but logically independent)
- T014 and T015 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 4)

1. Complete Phase 1: Setup (remove Firebase)
2. Complete Phase 2: Foundational (localStorage hook)
3. Complete Phase 3: User Story 1 (search + add + persist)
4. Complete Phase 4: User Story 4 (graph visualization)
5. **STOP and VALIDATE**: Independently test both P1 stories

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 4 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo

---

## Parallel Example: User Story 1

```bash
# Launch all setup tasks together:
Task: "Remove Firebase dependencies: delete 5 files in T001"
Task: "Remove Firebase env vars from .env.example in T002"
Task: "Uninstall firebase npm package in T003"

# Launch Sidebar update and stats widget together:
Task: "Update Sidebar.tsx in T007"
Task: "Add stats widget to Sidebar.tsx in T008"
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
