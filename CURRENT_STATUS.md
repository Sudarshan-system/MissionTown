# MissionTown — Current Status

> **Last Updated:** 2026-10-27
> **Current Phase:** **Phase 3 — Persistent Application Data and Backend Foundation**
> **Overall Phase Status:** **IN PROGRESS — FIREBASE PROVISIONED, RULES DEPLOYED, REPOSITORY & UNIT TESTS VERIFIED; AWAITING INTERACTIVE USER GOOGLE SIGN-IN VERIFICATION**

---

## 1. Executive Summary

MissionTown is a modular React 19 + TypeScript + Tailwind CSS v4 application running on Vite (`port 3000`), now connected to **Firebase Authentication (Google Sign-In)** and **Cloud Firestore** (`projectId: atomic-subject-c3skh`, `firestoreDatabaseId: ai-studio-missiontown-16d33c1f-8b65-4437-be0f-a545b16165fa`, provisioned in `asia-south1`).

- **Phase 0, Phase 1, and Phase 2** are **VERIFIED / COMPLETE**.
- **Phase 3** has been implemented and verified across:
  1. Provisioned Firebase project and named Cloud Firestore database (`firebase-applet-config.json`).
  2. Persistent user-scoped data model (`schemaVersion: 1`, `ownerUid`, `createdAt`, `updatedAt`) defined in `src/types/mission.ts` and `firebase-blueprint.json`.
  3. Hardened, default-deny, user-scoped Firestore Security Rules (`firestore.rules` & `security_spec.md`), linted with `@firebase/eslint-plugin-security-rules` (0 errors) and deployed via `fax.DeployRules`.
  4. Repository/service layer (`src/services/workspaceRepository.ts` & `src/utils/persistenceLogic.ts`) separating durable business state from the `120ms` client-side island animation loop.
  5. Automated unit tests (`17/17` passing across `companyLogic.test.ts` and `persistenceLogic.test.ts`), TypeScript compilation (`tsc --noEmit`), Vite production build (`vite build`), and headless Chromium Playwright verification (`http://localhost:3000`).

---

## 2. Feature & Verification Matrix

Behavior is strictly separated into:
- **VERIFIED:** Tested via automated unit tests (`companyLogic.test.ts`, `persistenceLogic.test.ts`), ESLint security rules check (`eslint firestore.rules`), `fax.DeployRules`, TypeScript compiler (`tsc --noEmit`), Vite production build (`vite build`), and live Playwright headless browser inspection at `http://localhost:3000`.
- **IMPLEMENTED — UNVERIFIED IN HEADLESS ENVIRONMENT:** Present in source code and unit-tested against the repository contract, but requires interactive user Google OAuth popup sign-in in a real browser session.
- **NOT STARTED / BLOCKED:** Planned for Phases 4–8.

### A. Verified Behavior (Backed by Recorded Tests on 2026-10-27)

| Feature / Requirement | Phase | Workstream | Status | Verification Evidence |
|---|---|---|---|---|
| **Phase 0–2 Frontend, Isometric Island & Simulation Suite** | Phase 0–2 | Frontend / UI & Simulation | **VERIFIED** | Accepted by user; all 13 `companyLogic.test.ts` unit tests and Playwright checks continue to pass without regression. |
| **Firebase Project & Named Firestore Provisioning (`asia-south1`)** | Phase 3 | Backend / Data & DevOps | **VERIFIED** | User accepted Firebase ToS (`GetFirebaseTos: {"accepted":true}`); `fax.ProvisionFirebase` provisioned `atomic-subject-c3skh` and database `ai-studio-missiontown-16d33c1f-8b65-4437-be0f-a545b16165fa` (`firebase-applet-config.json`). |
| **Persistent User-Scoped Data Model (`schemaVersion: 1`)** | Phase 3 | Backend / Data | **VERIFIED** | Defined `WorkspaceGoalRecord`, `DepartmentRecord`, `AgentRecord`, `TaskRecord`, `ActivityEventRecord`, `UserPreferencesRecord`, `ClipProject`, and `ClipAsset` in `src/types/mission.ts` and `firebase-blueprint.json`. |
| **Hardened Firestore Security Rules & Deployment** | Phase 3 | DevOps / Security | **VERIFIED** | `firestore.rules` enforces default-deny catch-all, `request.auth != null`, `email_verified == true`, `request.auth.uid == userId`, strict `hasAll`/`hasOnly` keys, string/number bounds, `request.time` timestamps, and immutable metadata. Passed `ESLINT_USE_FLAT_CONFIG=true npx eslint DRAFT_firestore.rules` (0 errors) and deployed via `fax.DeployRules`. |
| **Repository Layer & Separation of Animation Ticks from Durable Data** | Phase 3 | Backend / Data | **VERIFIED** | `src/utils/persistenceLogic.ts` and `src/services/workspaceRepository.ts` strip transient movement/bubble state on save and restore `homeCoords` on load. Verified by `src/utils/persistenceLogic.test.ts` (`4/4` new test suites passing; `17/17` total). |
| **Idempotent First-Run Seeding & Non-Overwriting Reload Logic** | Phase 3 | Backend / Data | **VERIFIED** | Verified in `persistenceLogic.test.ts`: first load seeds 1 goal, 4 departments, 15 agents, 15 tasks, 5 activities, and preferences (`seedCount: 1`); subsequent loads preserve saved goal & task titles (`wasSeededFirstRun: false`, `seedCount: 1`). |
| **Auth UI, Save Status Feedback & Unauthenticated Sample Preview** | Phase 3 | Frontend / UI | **VERIFIED** | Playwright verified `Sign in` button (`data-testid="auth-signin-button"`), `goal-persistence-status` banner, and Agent Inspector task assignment (`task-saved-notice`) at `1440×900` with 0 console errors and 0 warnings. |

---

### B. Implemented in Code — Unverified in Headless Container

| Item | Phase | Workstream | Status | Reason & How to Verify |
|---|---|---|---|---|
| **Interactive Google OAuth Popup Sign-In (`signInWithPopup`) & Live Browser Refresh Round-Trip** | Phase 3 | Frontend / Backend | **IMPLEMENTED — UNVERIFIED IN HEADLESS BROWSER** | Automated headless Chromium in the container cannot complete interactive Google account login popups or 2FA challenges. Repository logic and security rules are verified via unit tests and `fax.DeployRules`; final end-to-end verification requires the user to click **Sign in** in the preview UI, edit the goal and an agent task, and refresh the browser. |
| **Firebase Emulator `@firebase/rules-unit-testing` JVM Execution** | Phase 3 | DevOps / Security | **UNVERIFIED IN CONTAINER (JVM EMULATOR NOT RUNNING)** | The container does not run a local Java Firestore Emulator daemon; rule logic is verified via `@firebase/eslint-plugin-security-rules`, `fax.DeployRules` server-side compilation, and the rule-equivalent unit test suite in `src/utils/persistenceLogic.test.ts`. |

---

### C. Blocked / Future Phases

| Item | Phase | Workstream | Status | Notes |
|---|---|---|---|---|
| **Real AI task runner & orchestrator** | Phase 4 | AI / Agent Orchestration | **NOT STARTED** | Blocked until Phase 3 interactive sign-in persistence is accepted by the user. |
| **Content Studio real video clipping pipeline** | Phase 5 | Video Pipeline | **NOT STARTED** | Blocked on Phases 3–4 and local clipper evaluation. |

---

## 3. Current Active Task & Next Recommended Task

### Current Active Task
- **Phase 3 — Persistent Application Data and Backend Foundation**:
  - Provisioned Firebase Auth + Cloud Firestore (`asia-south1`), deployed hardened user-scoped `firestore.rules`, implemented `workspaceRepository.ts` and `persistenceLogic.ts`, wired auth/loading/saving/error UI into `Navbar.tsx`, `HeroSection.tsx`, `LiveCompanyDemo.tsx`, and `App.tsx`, and verified all 17 unit tests, ESLint rules check, TypeScript check, production build, and Playwright UI checks.

### Next Recommended Task
- **Interactive User Verification of Phase 3 Sign-In & Refresh Flow → Accept Phase 3**:
  - Test the 7-step Google Sign-In flow in your browser (Sign in → View company → Change goal → Assign sample task → Refresh browser → Confirm saved goal & task persist → Sign out & sign back in). Once confirmed, mark Phase 3 **VERIFIED / COMPLETE** before planning Phase 4.
