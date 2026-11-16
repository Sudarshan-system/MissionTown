# MissionTown — Project Roadmap

> **Purpose:** This document is the authoritative phase-by-phase development plan for **MissionTown**, defining scope, workstream organization (Frontend, Backend, AI, Video Pipeline, DevOps, and Product), status labels, working rules, and exit/acceptance criteria for every phase.
>
> **Companion Documents:**
> - See [`CURRENT_STATUS.md`](./CURRENT_STATUS.md) for the live phase status, verified vs. unverified behavior matrix, active task, and next recommended task.
> - See [`CHANGELOG.md`](./CHANGELOG.md) for the chronological record of code and documentation changes, tests run, and results.

---

## 1. Project Vision & Product Principles

Build a personal AI-company control room inspired by an interactive miniature town. The user defines goals, sees departments and agents, follows tasks and activity, and eventually connects real workflows. The first real production workflow will be a video-clipping pipeline that turns videos the user has permission to process into reviewed short clips.

### Product Principles
- Build a working, understandable product—not just a visual demo.
- Keep UI, saved application data, task execution, and video processing as separate layers.
- Clearly distinguish **demo/simulated activity** from **real execution**.
- Preserve working features; make small, testable changes rather than rewriting the app unnecessarily.
- Prefer free/local tools for early development, but verify limits, licensing, security, and performance before production.
- Every major change must be tested and documented.

---

## 2. Definition of Status Labels

- **NOT STARTED:** No implementation is known to exist.
- **PLANNED:** Agreed future work, not currently being implemented.
- **IN PROGRESS:** Work is actively being performed.
- **IMPLEMENTED — UNVERIFIED:** Code/UI exists in the repository, but relevant automated or interactive verification has not been completed or recorded.
- **VERIFIED:** The feature was inspected and tested with a recorded result in `CURRENT_STATUS.md` and `CHANGELOG.md`.
- **BLOCKED:** Work cannot proceed until a stated dependency or issue is resolved.
- **DEFERRED:** Deliberately postponed with documented rationale.

*Rule:* Never mark a feature **VERIFIED** based only on a screenshot or an untested claim.

---

## 3. Workstream Matrix (Frontend, Backend, AI, Video Pipeline, DevOps, Product)

| Workstream | Scope & Responsibilities | Active Phase Focus | Future Phase Target |
|---|---|---|---|
| **Frontend / UI** | Landing page, navbar, isometric island world, department buildings, agent labels, speech bubbles, goal card, roster, "How it works" chapters, responsive layout | **Phase 1–2:** Fix navbar/layout overlap, unclip goal card, resolve label & bubble crowding, verify responsive desktop/mobile layout | **Phase 3–5:** Loading/empty/error states for persisted data, job status streaming UI, clip preview/approval studio |
| **Interaction / Demo Simulation** | Single deterministic simulation loop, path-following agent movement, Play/Pause/Reset, Step event, pan/zoom/View All, `DEMO`/`SIMULATED` badges, reduced-motion handling | **Phase 2:** Consolidate to one simulation loop, verify Play/Pause/Reset, verify coordinate alignment across zoom/pan, enforce `SIMULATED` labeling | **Phase 4:** Transition toggle or clear visual separation between simulated demo mode and real job telemetry |
| **Backend / Data** | Express/Node API routes, database schema & migrations, persistence for goals, departments, agents, tasks, execution jobs, activity events, and clip projects | **Not active in Phase 2** (currently in-memory sample repository in `src/data/demoCompanyData.ts`) | **Phase 3:** Minimal persistent schema, validated CRUD endpoints, server-side secret isolation |
| **AI / Agent Orchestration** | Execution-job lifecycle, allowlisted task runner/worker, goal-to-task planner, human approval gates, retries, timeouts, structured logs | **Not active in Phase 2** (no live LLM calls or background agent execution) | **Phase 4 & 6:** Bounded end-to-end task runner, server-side tool validation, human-in-the-loop approval |
| **Video Pipeline** | Local/worker video intake, permission verification, highlight detection, short-form rendering, caption generation, quality checks, review/export | **Not active in Phase 2** (Content Studio is simulated only) | **Phase 5:** Standalone local clipper evaluation, worker queue integration, asset metadata tracking, human review UI |
| **DevOps / Security** | Baseline documentation, unit tests (`node:test`), TypeScript linting (`tsc --noEmit`), production builds (`vite build`), environment config, upload security, backups | **Phase 0–2:** Maintain clean build, unit tests for pure logic, and accurate project management docs | **Phase 7:** Git checkpoint workflow, separate dev/prod configs, file upload validation, rate limits, backup/recovery |
| **Product / Business** | Personal workflow definition, cost/time tracking, optional multi-user accounts, quotas, billing, onboarding | **Phase 0–2:** Personal AI-company control room focused on the creator clipping goal | **Phase 6 & 8:** Workflow efficiency metrics; optional multi-user/commercial features only if deliberately chosen |

---

## 4. Phase-by-Phase Development Plan

### Phase 0 — Define the Product and Baseline
- **Primary Workstreams:** Product, DevOps
- **Status:** **VERIFIED**
- **Scope & Checklist:**
  - [x] Choose working name: MissionTown.
  - [x] Define core concept: personal AI company represented as a miniature interactive town.
  - [x] Collect reference screenshots for landing page, live-company world, and "How it works" section.
  - [x] Choose Google AI Studio as the initial prototyping tool.
  - [x] Check the current source repository and establish a known-good baseline (`PROJECT_ROADMAP.md`, `CURRENT_STATUS.md`, `CHANGELOG.md`).
  - [x] Record the current framework, installed dependencies, and run commands in `README.md`.
- **Acceptance / Exit Criteria:** A saved, runnable project baseline exists and its actual stack and run steps are documented. *(All criteria verified).*

---

### Phase 1 — Frontend Prototype
- **Primary Workstreams:** Frontend / UI, Product
- **Status:** **VERIFIED**
- **Scope & Checklist:**
  - [x] Landing page and MissionTown navigation are implemented (`Navbar.tsx`, `HeroSection.tsx`).
  - [x] Live company/island view is implemented (`LiveCompanyDemo.tsx`, `IsometricIsland.tsx`, `IslandScenery.tsx`).
  - [x] Goal/progress card is implemented (`LiveCompanyDemo.tsx`).
  - [x] Departments and named agent labels are implemented (`demoCompanyData.ts`, `IsometricIsland.tsx`).
  - [x] Activity feed and message bubbles are implemented (`LiveCompanyDemo.tsx`, `IsometricIsland.tsx`).
  - [x] Zoom controls and View All are implemented (`IsometricIsland.tsx`).
  - [x] "How it works" interactive 9-chapter section is implemented (`HowItWorksSection.tsx`).
  - [x] Verify all navigation links and buttons work (`Demo`, `Agent Roster`, `How it works`, `Open My Company`, 9-chapter stepper, Agent Inspector task form).
  - [x] Verify layout on desktop (`1440×900`) and mobile (`390×844`).
  - [x] Ensure the project has reusable modular components (`src/components/*`, `src/data/*`, `src/types/*`, `src/utils/*`) instead of one oversized component.
- **Acceptance / Exit Criteria:** Core screens render reliably, responsive layout works, and all visible controls either work or are clearly marked as sample/simulated placeholders. *(All criteria verified).*

---

### Phase 2 — Frontend Polish and Demo Simulation Reliability
- **Primary Workstreams:** Frontend / UI, Interaction / Demo Simulation
- **Status:** **VERIFIED** *(Accepted by user on 2026-10-27)*
- **Scope & Checklist:**
  - [x] Fix sticky/fixed navigation overlap and any clipped goal or island content (`Navbar` offset scroll + `#demo` top padding + multi-line Goal card title/unit).
  - [x] Reduce collisions between agent names, department labels, buildings, and message bubbles (spread district coordinates + 3-pass label collision repulsion + SVG leader lines).
  - [x] Keep labels anchored to agents through movement, zoom, pan, and resize.
  - [x] Improve message bubble placement, readability, and dismissal (`computeSafeBubblePosition`, SVG tether line, multi-line wrap, `×` dismiss button without deleting feed item).
  - [x] Ensure activity feed is ordered newest-first and has a reasonable visible-item limit (newest prepended first, capped at 12 items in state, 4 compact overlay cards on canvas).
  - [x] Test Play, Pause, and Reset; make sure there is only one simulation loop (single `120ms` `window.setInterval` in `src/App.tsx`).
  - [x] Confirm agents move to valid destinations, stop on arrival, and do not wander outside the island (`stepAgentPosition` + waypoint routes in `companyLogic.ts`).
  - [x] Ensure zoom, pan, and View All transform the world, paths, characters, and labels consistently *(Zoom In `1.2x`, Zoom Out, pointer-drag panning `96px, 60px`, and View All reset `0, 0, scale 1` all verified in Playwright)*.
  - [x] Mark all sample events and sample progress clearly as **DEMO** or **SIMULATED**; reserve **LIVE** for real connected execution (`SIMULATED` badge on travelling events, `Sample demo` status pill, `(Sample)` unit labels).
  - [x] Respect reduced-motion preferences and avoid excessive CPU usage *(`prefers-reduced-motion: reduce` verified via Playwright `emulateMedia` both at runtime and on fresh reload: simulation pauses automatically, agent coordinates freeze, and computed CSS `animationName` is `none` across all animated classes)*.
- **Acceptance / Exit Criteria:** The experience is coherent and usable on desktop and mobile; simulation controls behave deterministically under a single loop; pan/zoom/View All keep all elements aligned; reduced-motion preferences are respected; demo data is never confused with real work; user accepts Phase 2 before Phase 3 begins. *(All criteria verified and accepted).*

---

### Phase 3 — Persistent Application Data and Backend Foundation *(CURRENT ACTIVE PHASE)*
- **Primary Workstreams:** Backend / Data, Frontend / UI, DevOps / Security
- **Status:** **IN PROGRESS — CORE PERSISTENCE, SECURITY RULES & UNIT TESTS VERIFIED; AWAITING INTERACTIVE USER GOOGLE SIGN-IN VERIFICATION**
- **Scope & Checklist:**
  - [x] Inspect the current app framework (`vite` + `react` + `typescript`) and provision Google AI Studio's supported Firebase integration (`atomic-subject-c3skh`, database `ai-studio-missiontown-16d33c1f-8b65-4437-be0f-a545b16165fa` in `asia-south1`).
  - [x] Define persistent data models (`WorkspaceGoalRecord`, `DepartmentRecord`, `AgentRecord`, `TaskRecord`, `ActivityEventRecord`, `UserPreferencesRecord`, `ClipProject`, `ClipAsset`) with `schemaVersion: 1`, `ownerUid`, and server timestamps in `src/types/mission.ts` and `firebase-blueprint.json`.
  - [x] Create and deploy hardened, default-deny, user-scoped Firestore Security Rules (`firestore.rules`, `security_spec.md`) verified with `@firebase/eslint-plugin-security-rules` (0 errors) and `fax.DeployRules`.
  - [x] Build a clean repository/service layer (`src/services/workspaceRepository.ts` & `src/utils/persistenceLogic.ts`) separating durable business state from transient `120ms` island animation ticks; verified via `src/utils/persistenceLogic.test.ts` (idempotent first-run seeding, goal save, task assignment save, preferences save, non-overwriting reload).
  - [x] Add Google Authentication (`signInWithPopup`), loading, saving, success, and error states to `Navbar.tsx`, `HeroSection.tsx`, `LiveCompanyDemo.tsx`, and `App.tsx`, reporting save completion only after the Firestore operation resolves.
  - [x] Keep private credentials out of frontend code (only public client Web SDK config in `firebase-applet-config.json`; access enforced by `firestore.rules`).
  - [ ] Verify end-to-end interactive Google OAuth popup sign-in, browser refresh persistence, and sign-out/sign-in round-trip in an interactive user browser session *(Implemented in code and verified via repository unit tests; interactive Google OAuth popup cannot be completed inside headless Chromium without user credentials)*.
- **Acceptance / Exit Criteria:** Data is persisted reliably per authenticated user in Cloud Firestore, protected by deployed user-scoped security rules, unit-tested, and verified end-to-end across browser refreshes.

---

### Phase 4 — Real Task Execution and Agent Orchestration
- **Primary Workstreams:** AI / Agent Orchestration, Backend / Data
- **Status:** **NOT STARTED**
- **Scope & Checklist:**
  - [ ] Implement an execution-job lifecycle: `queued`, `running`, `waiting_for_approval`, `completed`, `failed`, `cancelled`.
  - [ ] Build a task runner/worker that can execute a small set of allowlisted actions.
  - [ ] Add a planner/orchestrator that breaks a goal into explicit tasks; require human approval for risky actions.
  - [ ] Add retries with limits, timeouts, cancellation, and failure reporting.
  - [ ] Record structured logs and events for each job.
  - [ ] Stream status changes to the UI using the simplest reliable method (polling first if sufficient; SSE/WebSockets if needed).
  - [ ] Separate an LLM's proposed action from actual tool execution; validate inputs and permissions server-side.
  - [ ] Start with one practical workflow before adding multiple autonomous agents.
  - [ ] Show genuine execution status (`LIVE`) only when backed by real job records.
- **Acceptance / Exit Criteria:** One real, bounded task can run end-to-end with observable status, logs, safe failure handling, and human review where required.

---

### Phase 5 — Content Studio and Real Video Clipping
- **Primary Workstreams:** Video Pipeline, Backend / Data, Frontend / UI
- **Status:** **NOT STARTED**
- **Scope & Checklist:**
  - [ ] Evaluate an existing clipping tool and verify its license, OS compatibility, automation interface, model needs, and output quality.
  - [ ] Prove one source video can produce useful candidate clips locally before building UI/backend integration.
  - [ ] Create a `ClipProject` / job record with source file, owner/permission confirmation, settings, and status.
  - [ ] Add a safe file intake path and limits for file size, type, and duration.
  - [ ] Keep large video assets out of the database; store file references and metadata in the database.
  - [ ] Run processing in a worker or local service, not inside a short synchronous HTTP request.
  - [ ] Generate candidate clips, captions, and metadata; track each output `ClipAsset`.
  - [ ] Add preview, approve/reject, retry, reprocess, and download flows in Content Studio.
  - [ ] Add quality checks for duration, aspect ratio, file validity, caption timing, and missing audio.
  - [ ] Show real processing progress and errors; never fabricate completed clips.
  - [ ] Keep human approval before delivery/publishing.
- **Acceptance / Exit Criteria:** An authorized source video goes through a reproducible pipeline and produces real, reviewable short-form clips with recoverable job status.

---

### Phase 6 — Personal Automation and Workflow Expansion
- **Primary Workstreams:** AI / Agent Orchestration, Video Pipeline, Product
- **Status:** **NOT STARTED** *(Only after Phase 5 clipping flow works)*
- **Scope & Checklist:**
  - [ ] Automate intake, job creation, file organization, notifications, and delivery.
  - [ ] Add reusable clip presets and per-project settings.
  - [ ] Add AI assistance for clip selection, titles, descriptions, or quality review only where it measurably improves outcomes.
  - [ ] Add scheduled jobs only with clear limits, logs, and a way to pause/cancel.
  - [ ] Introduce additional departments/workflows one at a time, based on real need.
  - [ ] Track cost per job, processing time, acceptance rate, and manual correction time.
- **Acceptance / Exit Criteria:** Repeated work is measurably easier, more reliable, or cheaper than doing it manually.

---

### Phase 7 — Security, Deployment, and Reliability
- **Primary Workstreams:** DevOps / Security, Backend / Data
- **Status:** **NOT STARTED**
- **Scope & Checklist:**
  - [ ] Keep code in a private Git repository with checkpoints before major changes.
  - [ ] Configure separate development and production environments.
  - [ ] Secure file access and ensure users cannot access another user's files if multi-user support is ever added.
  - [ ] Restrict upload types and sizes; treat all uploaded files as untrusted.
  - [ ] Store secrets in environment/secret management, not source code.
  - [ ] Add rate limits, cost controls, and audit logs before public exposure.
  - [ ] Test backup and recovery for important data.
  - [ ] Add error monitoring and health checks.
  - [ ] Review dependency licenses and the licenses of code/assets copied or adapted.
  - [ ] Deploy only after a production build (`npm run build`) and core workflow tests pass.
- **Acceptance / Exit Criteria:** The app can be deployed and maintained with known risks, controlled costs, and a tested recovery plan.

---

### Phase 8 — Optional Multi-User Service / Business Features
- **Primary Workstreams:** Product / Business, Backend / Data
- **Status:** **DEFERRED / OPTIONAL FUTURE PHASE**
- **Scope & Checklist:**
  - [ ] Decide whether MissionTown remains a personal tool or becomes a service for customers.
  - [ ] If selling access, add account boundaries, plans/quotas, billing, support, and user-facing terms.
  - [ ] Add customer onboarding and usage/cost reporting.
  - [ ] Validate willingness to pay before building a large billing or marketing system.
- **Acceptance / Exit Criteria:** Only proceed if multi-user or commercial distribution is a deliberate product goal.

---

## 5. Mandatory Working Rules for All Development Sessions

### Before Making Changes
1. Read `PROJECT_ROADMAP.md`, `CURRENT_STATUS.md`, and `CHANGELOG.md`.
2. Inspect the relevant source files.
3. Identify the current phase and the smallest useful change.
4. Explain briefly what will change and why.

### After Making Changes
1. Preserve existing working features.
2. Run relevant tests and checks (`npx tsx --test`, `npm run lint`, `npm run build`, browser verification) where available.
3. Report exactly what was tested and what passed or failed.
4. Update `CURRENT_STATUS.md` and `CHANGELOG.md`.
5. Update roadmap checkboxes in `PROJECT_ROADMAP.md` only when supported by concrete verification evidence.
6. Communicate what changed, why it matters, how the user can test it, and the next recommended task.
