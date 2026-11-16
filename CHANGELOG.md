# MissionTown — Changelog

All meaningful changes to the MissionTown application and project-management documentation are recorded in this file in reverse chronological order (newest first).

---

## 2026-10-27 — Phase 3: Firebase Authentication, Cloud Firestore Persistence & Hardened Security Rules
- **Phase:** Phase 3 — Persistent Application Data and Backend Foundation (Phase 2 formally marked VERIFIED)
- **Workstream:** Backend / Data, Frontend / UI & DevOps / Security
- **Changed:**
  - `/firebase-applet-config.json`: Provisioned Firebase project `atomic-subject-c3skh` and named Cloud Firestore database `ai-studio-missiontown-16d33c1f-8b65-4437-be0f-a545b16165fa` (`asia-south1`) via `fax.ProvisionFirebase`.
  - `/firebase-blueprint.json`, `/security_spec.md`, `/DRAFT_firestore.rules`, `/firestore.rules`, `/eslint.config.mjs`: Designed user-scoped schema (`/users/{userId}/workspaces/main`, `departments`, `agents`, `tasks`, `activities`, `preferences/settings`), documented Dirty Dozen attack mitigations, linted rules with `@firebase/eslint-plugin-security-rules`, and deployed production `firestore.rules` via `fax.DeployRules`.
  - `/src/types/mission.ts`: Added `PERSISTENCE_SCHEMA_VERSION` (`1`), `PersistenceStatus`, `AuthUserSummary`, `WorkspaceGoalRecord`, `DepartmentRecord`, `AgentRecord`, `TaskRecord`, `ActivityEventRecord`, `UserPreferencesRecord`, `ClipProject`, and `ClipAsset`.
  - `/src/lib/firebase.ts`: Initialized Firebase App, named Cloud Firestore instance, GoogleAuthProvider, structured `handleFirestoreError`, and `verifyFirestoreConnection`.
  - `/src/utils/persistenceLogic.ts`: Implemented pure domain-to-record mappers (`toWorkspaceGoalPayload`, `toDepartmentPayload`, `toAgentPayload`, `toTaskPayload`, `toActivityEventPayload`, `toUserPreferencesPayload`), record hydrators, idempotent workspace merging (`mergePersistedWorkspaceWithDemo`), and security rule evaluator (`evaluateUserScopedAccessRule`).
  - `/src/services/workspaceRepository.ts`: Implemented `createWorkspaceRepository` and `workspaceRepository` for first-run idempotent batch seeding, goal updates, atomic task + agent + activity batch updates, preference updates, and Google Auth helpers (`signInWithGooglePopup`, `signOutCurrentUser`, `subscribeToAuthChanges`).
  - `/src/components/Navbar.tsx`, `/src/components/HeroSection.tsx`, `/src/components/LiveCompanyDemo.tsx`, `/src/App.tsx`: Added Google Sign-In/Sign-Out controls, loading/saving/error banners, and async task/goal save confirmations without writing on `120ms` animation ticks.
  - `/src/utils/persistenceLogic.test.ts`: Added unit tests for data mapping, transient animation state stripping, idempotent first-run seeding, non-overwriting subsequent loads, error propagation, and user-scoped access rules.
  - `/PROJECT_ROADMAP.md`, `/CURRENT_STATUS.md`, `/CHANGELOG.md`, `/README.md`: Updated documentation with Phase 3 architecture and verification results.
- **Reason:** Enable MissionTown company goals, agent task assignments, department/agent configurations, and preferences to persist across browser refreshes per authenticated user in Cloud Firestore.
- **Tests run:**
  - Unit tests: `npx --yes tsx --test src/utils/companyLogic.test.ts src/utils/persistenceLogic.test.ts` (17/17 tests passed).
  - Firestore Security Rules linter: `ESLINT_USE_FLAT_CONFIG=true npx eslint DRAFT_firestore.rules` (0 errors, 0 warnings) + `fax.DeployRules` server-side compilation and deployment (succeeded).
  - TypeScript lint check: `npm run lint` (`tsc --noEmit`, 0 errors).
  - Production build: `npm run build` (`vite build`, succeeded).
  - Playwright headless Chromium verification at `http://localhost:3000` (`1440×900`): Verified `Sign in` button (`auth-signin-button`), `goal-persistence-status`, Agent Inspector task assignment (`task-saved-notice`), and zero console/page errors.
- **Result:** Passed (all automated unit tests, security rule lint/deployment checks, TypeScript check, production build, and Playwright UI checks passed; interactive Google OAuth popup login awaits user verification in browser).
- **Known issues:**
  - Headless Chromium in the container cannot complete interactive Google OAuth popup sign-in without real user credentials; interactive sign-in and refresh persistence must be verified by the user in the browser preview.
- **Next step:** User verifies interactive Google Sign-In + browser refresh persistence flow to complete Phase 3 acceptance.

---

## 2026-10-27 — Complete Phase 2 Verification Suite, Reduced-Motion Hardening & Root README
- **Phase:** Phase 2 — Frontend polish and demo-simulation reliability (and Phase 0 `README.md` baseline)
- **Workstream:** Frontend / UI, Interaction / Demo Simulation & DevOps
- **Changed:**
  - `/src/index.css`: Expanded `@media (prefers-reduced-motion: reduce)` to suppress all ambient animations (including `.animate-pulse`, `.animate-ping`, `.animate-bounce`, `.animate-spin`, and pseudo-elements) and force `animation: none !important; transition: none !important; scroll-behavior: auto !important;`.
  - `/src/App.tsx`: Added a `window.matchMedia('(prefers-reduced-motion: reduce)')` change listener and transition detector inside the unified `120ms` simulation loop so enabling reduced motion at runtime immediately pauses the simulation and clears travelling packets, while `scrollToSection` switches to `behavior: 'auto'`.
  - `/README.md`: Created root documentation recording the exact framework (React 19, TypeScript 7, Vite 8, Tailwind CSS 4), installed dependencies from `package.json`, prerequisites, installation steps, and commands (`npm run dev`, `npx --yes tsx --test src/utils/companyLogic.test.ts`, `npm run lint`, `npm run build`, `npm run preview`, `npm run clean`).
  - `/PROJECT_ROADMAP.md`, `/CURRENT_STATUS.md`, `/CHANGELOG.md`: Updated roadmap checkboxes, verification matrix, and changelog with evidence-based test results.
- **Reason:** Complete all remaining unverified items identified in `CURRENT_STATUS.md` (pointer-drag panning, `prefers-reduced-motion` media emulation, 9-chapter `How It Works` stepper, Agent Inspector sample task submission, and root `README.md`) to prepare Phase 2 for user acceptance.
- **Tests run:**
  - Unit tests: `npx --yes tsx --test src/utils/companyLogic.test.ts` (13/13 tests passed).
  - TypeScript lint check: `npm run lint` (`tsc --noEmit`, 0 errors).
  - Production build: `npm run build` (`vite build`, succeeded).
  - Playwright headless Chromium verification at `http://localhost:3000` (`1440×900`):
    - **Pointer-drag panning & View All reset:** Dragged `[data-testid="island-canvas-container"]` from `(0, 0)` to `pannedX: 96, pannedY: 60`, then clicked `View all` and verified `resetPanX: 0, resetPanY: 0, resetScale: 1`.
    - **9-chapter How It Works stepper:** Verified `tabsCount: 9`, stepped sequentially through `CH.01` → `CH.09` via `See next chapter`, verified forward wrap-around to `CH.01`, and backward wrap-around via `Previous chapter` to `CH.09`.
    - **Agent Inspector sample task submission:** Selected `Pixel`, filled `#agent-task-input` with `"Cut 9:16 creator highlight reel #42"`, clicked `Assign`, and verified confirmation notice (`savedNoticeVisible: true`), inspector task card (`inspectorUpdated: true`), roster & right-hand feed list (`rosterMatchesCount: 2`), and top canvas feed card (`"The Boss → Pixel: Assigned sample task: \"Cut 9:16 creator highlight reel #42\""`).
    - **`prefers-reduced-motion: reduce` media emulation:** Emulated `reducedMotion: "reduce"` at runtime and on fresh reload; verified `mediaMatches: true`, `playButtonVisibleWhenReduced: true`, `pausedOnFreshLoadWithReducedMotion: true`, `frozenUnderReducedMotion: true`, and computed `animationName: "none"` on `.animate-activity-enter`, `.animate-agent-walk`, and `.animate-pulse`.
    - **Console / Runtime errors:** `0` errors, `0` warnings.
- **Result:** Passed (all 13 unit tests, TypeScript check, production build, and all 4 targeted Playwright browser test suites passed).
- **Known issues:**
  - None in Phase 0, Phase 1, or Phase 2 scope. (In-memory state intentionally resets on full page refresh until Phase 3 backend persistence is implemented).
- **Next step:** Obtain user acceptance of Phase 2 before starting Phase 3 (Persistent application data and backend foundation).

---

## 2026-10-27 — Establish Project Management Documentation System
- **Phase:** Phase 2 — Frontend polish and demo-simulation reliability (and Phase 0 baseline documentation)
- **Workstream:** Product / DevOps
- **Changed:**
  - Created `/PROJECT_ROADMAP.md`
  - Created `/CURRENT_STATUS.md`
  - Created `/CHANGELOG.md`
- **Reason:** Establish a persistent, single-source-of-truth project-management system in the repository root so the agreed roadmap, current phase, workstream status, verified vs. unverified behavior, and change history remain documented across future development sessions.
- **Tests run:**
  - Inspected workspace directory structure (`/`, `/src`, `/src/components`, `/src/data`, `/src/utils`) and verified existing source files (`package.json`, `src/App.tsx`) against `/public/assets/aistudio/MissionTown_Project_Roadmap_3979783c.md`.
  - Verified all three Markdown files exist in `/` and match the required sections and status rules.
- **Result:** Passed (documentation files created and verified; no application source files modified).
- **Known issues:**
  - Root `README.md` with framework, dependencies, and run commands (Phase 0 item) had not been written yet.
  - Pointer-drag canvas panning, `prefers-reduced-motion: reduce` browser emulation, and `How it works` chapter stepping remained marked `IMPLEMENTED — UNVERIFIED` until explicitly asserted in automated browser tests.
- **Next step:** Run targeted Playwright checks for pointer-drag panning, reduced-motion emulation, and `How it works` chapter navigation, and create `README.md` to complete all Phase 0–2 checklist evidence for user sign-off.

---

## 2026-10-27 — Phase 2 Layout, Collision-Aware Labels, Dismissible Bubbles & Unified Simulation Loop
- **Phase:** Phase 2 — Frontend polish and demo-simulation reliability
- **Workstream:** Frontend / UI & Interaction / Demo Simulation
- **Changed:**
  - `/src/App.tsx`: Consolidated scenario dispatch, agent walking updates, and message packet progression into a single unified `120ms` `window.setInterval` loop; added `handleDismissBubble`; added `84px` navbar offset to `scrollToSection`.
  - `/src/components/LiveCompanyDemo.tsx`: Added `pt-24 pb-20 scroll-mt-24` to `#demo`; updated Goal card title (`data-testid="goal-card-title"`) and unit (`data-testid="goal-card-unit"`) to wrap cleanly without truncation; replaced `"Live"` badge on travelling feed items with `"SIMULATED"` (`data-testid="simulated-activity-badge"`).
  - `/src/components/IsometricIsland.tsx`: Added SVG overlay for displaced label leader lines and speech bubble tethers; styled prominent department banners above compact agent pills; added hover/selection z-index elevation (`z-45`); added zoom-aware label density (`<= 0.85` and `>= 1.2`); added dismiss (`×`) button on speech bubbles (`data-testid="dismiss-bubble-${agent.id}"`).
  - `/src/utils/companyLogic.ts`: Implemented 3-pass label collision repulsion (`resolveAgentLabelOffsets`) against fixed landmark banners and neighboring agents with `showLeaderLine` threshold; added `computeSafeBubblePosition` and `dismissAgentBubble`.
  - `/src/utils/companyLogic.test.ts`: Added unit tests covering multi-agent label repulsion, landmark banner repulsion, `showLeaderLine`, `dismissAgentBubble`, and `computeSafeBubblePosition`.
  - `/src/data/demoCompanyData.ts`: Spread all 15 agents' `islandCoords`, `homeCoords`, and `destinationCoords` across district courtyards; updated Echo's sample bubble text from `"Live on 4 formats"` to `"Sample staged on 4 formats"`.
- **Reason:** Fix navbar overlap on scroll, unclip the Goal card text, resolve central plaza label crowding, prevent speech bubbles from obscuring key UI, ensure deterministic `Play`/`Pause`/`Reset` behavior under a single timer loop, and ensure no sample activity is mislabeled as `LIVE`.
- **Tests run:**
  - Unit tests: `npx --yes tsx --test src/utils/companyLogic.test.ts` (13/13 tests passed).
  - TypeScript lint check: `npm run lint` (`tsc --noEmit`, 0 errors).
  - Production build: `npm run build` (`vite build`, succeeded).
  - Playwright headless Chromium verification at `http://localhost:3000` (`1440×900` desktop and `390×844` mobile).
- **Result:** Passed.
- **Known issues:**
  - Pointer-drag panning on the island canvas and `prefers-reduced-motion: reduce` media emulation were not separately asserted in the automated Playwright script.
- **Next step:** Establish project-management documentation (`PROJECT_ROADMAP.md`, `CURRENT_STATUS.md`, `CHANGELOG.md`) and complete remaining Phase 2 verification items for user acceptance.

---

## 2026-10-27 — Initial Prototype, Animated Island Agents & Detailed Isometric World (Historical Summary)
- **Phase:** Phase 0 & Phase 1 — Product baseline, frontend prototype, and isometric island upgrade
- **Workstream:** Frontend / UI & Interaction / Demo Simulation
- **Changed:**
  - `/index.html`, `/metadata.json`, `/src/types/mission.ts`, `/src/data/demoCompanyData.ts`, `/src/components/*`: Built the landing page, layered isometric island world with architectural landmarks, moving agents, activity feed, agent inspector drawer, and 9-chapter interactive guide.
- **Reason:** Establish the MissionTown visual identity, interactive miniature AI-company world, and modular frontend prototype based on the user's product brief and reference screenshots.
- **Tests run:**
  - Verified TypeScript compilation (`tsc --noEmit`), Vite production build (`vite build`), unit tests (`companyLogic.test.ts`), and browser rendering at desktop and mobile viewports.
- **Result:** Passed.
- **Known issues:** Initial prototype exhibited central label crowding and navbar overlap on anchor scroll, which were subsequently resolved in Phase 2.
- **Next step:** Proceed to Phase 2 polish and simulation reliability.
