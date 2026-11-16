# MissionTown

MissionTown is a personal AI-company control room represented as an interactive miniature isometric town. Define high-level company goals, inspect specialized departments and named AI agents on the island, follow simulated task handoffs, persist your company workspace in Cloud Firestore, and prepare workflows for future automated long-to-short video clipping integration.

> **Current Phase:** **Phase 3 — Persistent Application Data and Backend Foundation**
> Company goals, department configurations, agent roles, assigned tasks, durable activity events, and user preferences persist across browser refreshes per authenticated Google user in **Cloud Firestore**. Island movement and handoff scenarios remain explicitly labeled as **Sample / Simulated** (`DEMO_COMPANY_REPOSITORY`) with zero background AI or video-rendering API calls.
>
> See [`PROJECT_ROADMAP.md`](./PROJECT_ROADMAP.md), [`CURRENT_STATUS.md`](./CURRENT_STATUS.md), and [`CHANGELOG.md`](./CHANGELOG.md) for the authoritative roadmap, verification matrix, and change history.

---

## Tech Stack & Dependencies

Inspected directly from [`package.json`](./package.json) and [`vite.config.ts`](./vite.config.ts):

### Core Framework & Build Tooling
- **React:** `^19.0.1` (`react`, `react-dom`)
- **Build System / Dev Server:** Vite `^8.3.0` with `@vitejs/plugin-react` (`^6.1.1`)
- **Language / Type Checking:** TypeScript `^7.0.2` (`tsc --noEmit`)
- **Styling:** Tailwind CSS `^4.3.3` via `@tailwindcss/vite` (`^4.3.3`) and `src/index.css`
- **Icons:** `lucide-react` (`^0.546.0`)

### Persistence, Authentication & Security Tooling (Phase 3)
- **Firebase Web SDK:** `firebase` (Google Authentication via `firebase/auth` and named Cloud Firestore database via `firebase/firestore`)
- **Firestore Security Rules Linter:** `@firebase/eslint-plugin-security-rules` + `eslint` (`^8.57.0`) configured via `eslint.config.mjs`
- **TypeScript Executor & Unit Testing:** `tsx` (`^4.21.0`) running Node's built-in test runner (`node:test` + `node:assert/strict`)

### Additional Installed Packages (Reserved for Future Phases / Runtime)
- **Backend / AI SDK Dependencies (Installed, Not Yet Connected in Phase 3):** `express` (`^4.21.2`), `dotenv` (`^17.2.3`), `@google/genai` (`^2.4.0`), `motion` (`^12.23.24`)

---

## Prerequisites

- **Node.js:** v20+ (v22 recommended; `@types/node` is `^22.14.0`)
- **Package Manager:** `npm`
- **Firebase Configuration:** Provisioned via Google AI Studio in `firebase-applet-config.json` (project `atomic-subject-c3skh`, database `ai-studio-missiontown-16d33c1f-8b65-4437-be0f-a545b16165fa` in `asia-south1`).

---

## Installation

Install project dependencies from `package.json`:

```bash
npm install
```

Copy `.env.example` to `.env` when configuring local environment variables:

```bash
cp .env.example .env
```

---

## Running the Application & Checks

### 1. Start the Development Server
Starts the Vite development server on `http://0.0.0.0:3000` (`http://localhost:3000`):

```bash
npm run dev
```

### 2. Run Pure Logic & Persistence Unit Tests
Executes all 17 unit tests across `src/utils/companyLogic.test.ts` (13 simulation, routing, zoom/pan, and collision-avoidance tests) and `src/utils/persistenceLogic.test.ts` (4 persistence service, data mapping, idempotent seeding, and user-scoped security rule tests):

```bash
npx --yes tsx --test src/utils/companyLogic.test.ts src/utils/persistenceLogic.test.ts
```

### 3. Lint Firestore Security Rules
Validates `firestore.rules` (and `DRAFT_firestore.rules`) using `@firebase/eslint-plugin-security-rules`:

```bash
ESLINT_USE_FLAT_CONFIG=true npx eslint firestore.rules
```

### 4. Run TypeScript Type Checking / Lint
Validates all TypeScript types across the codebase without emitting build files:

```bash
npm run lint
```

### 5. Build for Production
Compiles and bundles the frontend application into `dist/` via Vite:

```bash
npm run build
```

### 6. Preview the Production Build
Serves the compiled production build locally:

```bash
npm run preview
```

### 7. Clean Build Artifacts
Removes `dist` and `server.js`:

```bash
npm run clean
```

---

## Project Structure

```text
/
├── PROJECT_ROADMAP.md          # Authoritative phase-by-phase development plan
├── CURRENT_STATUS.md           # Verified vs. unverified behavior & current phase status
├── CHANGELOG.md                # Chronological log of code changes and test results
├── README.md                   # Stack, dependencies, and run/test commands
├── firebase-applet-config.json # Provisioned public Firebase Web SDK configuration
├── firebase-blueprint.json     # User-scoped Firestore entity & collection schema blueprint
├── security_spec.md            # Security invariants & "Dirty Dozen" attack mitigations
├── firestore.rules             # Deployed zero-trust user-scoped Firestore Security Rules
├── eslint.config.mjs           # Flat ESLint configuration for Firestore Security Rules
├── index.html                  # HTML entry point
├── package.json                # Scripts and dependencies
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite + React + Tailwind v4 configuration
└── src/
    ├── App.tsx                 # Root state, Firebase Auth subscription, Firestore sync & 120ms simulation loop
    ├── index.css               # Tailwind v4 import, keyframes & prefers-reduced-motion rules
    ├── main.tsx                # React DOM mount entry
    ├── lib/
    │   └── firebase.ts         # Firebase App, Auth, named Firestore & structured error handler
    ├── services/
    │   └── workspaceRepository.ts # User-scoped Firestore repository & idempotent first-run seeding
    ├── components/
    │   ├── Navbar.tsx          # Fixed pill navigation with Google Sign-In/Out & sync indicator
    │   ├── HeroSection.tsx     # Miniature world hero banner & persistent goal editor
    │   ├── LiveCompanyDemo.tsx # Island container, Goal card, playback controls, Inspector & Roster
    │   ├── IsometricIsland.tsx # Pan/zoom world layer, collision-avoided agent labels & bubbles
    │   ├── IslandScenery.tsx   # Layered SVG isometric shoreline, roads, plaza & 3D buildings
    │   ├── HowItWorksSection.tsx # Interactive 9-chapter system guide
    │   └── Footer.tsx          # Footer navigation & sample simulation notice
    ├── data/
    │   └── demoCompanyData.ts  # Separated sample data repository (4 depts, 15 agents, 9 chapters)
    ├── types/
    │   └── mission.ts          # Domain & persistent record interfaces (schemaVersion: 1)
    └── utils/
        ├── companyLogic.ts     # Pure functions for simulation, routing, zoom/pan & collision math
        ├── companyLogic.test.ts # Automated simulation & UI logic unit tests (13 tests)
        ├── persistenceLogic.ts # Pure mappers, hydrators, workspace merger & security rule evaluator
        └── persistenceLogic.test.ts # Automated persistence & security rule unit tests (4 suites)
```
