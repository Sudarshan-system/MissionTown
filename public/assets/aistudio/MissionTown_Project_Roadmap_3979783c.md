# MissionTown — Project Roadmap & Status

> **Purpose:** This document is the single source of truth for what MissionTown is, what phase we are in, what is already implemented, what remains, and how changes should be recorded.
>
> **Important status note:** Status below is based on the screenshots and conversation so far, not a direct inspection of the current source code. Before marking any feature as technically verified, inspect and test it in the project.

## 1. Project vision

Build a personal AI-company control room inspired by an interactive miniature town. The user defines goals, sees departments and agents, follows tasks and activity, and eventually connects real workflows. The first real production workflow will be a video-clipping pipeline that turns videos the user has permission to process into reviewed short clips.

### Product principles
- Build a working, understandable product—not just a visual demo.
- Keep UI, saved application data, task execution, and video processing as separate layers.
- Clearly distinguish **demo/simulated activity** from **real execution**.
- Preserve working features; make small, testable changes rather than rewriting the app unnecessarily.
- Prefer free/local tools for early development, but verify limits, licensing, security, and performance before production.
- Every major change must be tested and documented.

## 2. Current status snapshot

**Current phase: Phase 2 — Frontend polish and demo-simulation reliability.**

| Area | Current status | What that means |
|---|---|---|
| Product name and visual direction | Established | Working name is MissionTown; dark UI, gold accents, bright-blue island canvas, miniature-town style. |
| Landing/navigation | Present in prototype; needs layout verification | The MissionTown navigation exists, but the latest screenshot showed it overlapping/clipping some content. |
| Island world | Visual prototype present | Buildings, paths, trees, department areas and shoreline details have been added. |
| Agents and labels | Demo UI present | Named agent characters/labels appear on the island; label crowding needs improvement. |
| Activity feed and speech bubbles | Demo UI present | Sample activity appears; positioning, legibility and event relationships need testing. |
| Movement simulation | UI controls and visible characters present; must verify | Play/Pause/Reset and event-driven movement should be tested. A screenshot alone cannot prove the simulation logic works correctly. |
| Persistent data / backend | Not yet confirmed as implemented | Do not assume goals, agents or tasks survive refreshes until tested. |
| Real AI agent execution | Not implemented/verified yet | Current activity must be treated as demo data unless a real runner is connected and validated. |
| Real video clipping | Not implemented yet | No real upload-to-clips workflow has been verified. |
| Authentication, customer accounts, payments | Not in current scope | Add only when genuinely needed. |
| Deployment, security and monitoring | Later phase | Test locally first, then deploy deliberately. |

## 3. Phase-by-phase roadmap

### Phase 0 — Define the product and baseline
**Category:** Product planning / design
**Status:** Mostly complete

- [x] Choose working name: MissionTown.
- [x] Define core concept: personal AI company represented as a miniature interactive town.
- [x] Collect reference screenshots for landing page, live-company world and “How it works” section.
- [x] Choose Google AI Studio as the initial prototyping tool.
- [ ] Check the current source repository and establish a known-good baseline/backup.
- [ ] Record the current framework, installed dependencies and run commands in the README.

**Exit criteria:** A saved, runnable project baseline exists and its actual stack/run steps are documented.

### Phase 1 — Frontend prototype
**Category:** Frontend / UI
**Status:** Prototype exists; verify details

- [x] Landing page and MissionTown navigation are present in screenshots.
- [x] Live company/island view is present.
- [x] Goal/progress card is present.
- [x] Departments and named agent labels are present.
- [x] Activity feed/message bubbles are present.
- [x] Zoom controls and View All are visible.
- [x] “How it works” chapter concept has been requested.
- [ ] Verify all navigation links and buttons work.
- [ ] Verify layout on desktop and mobile.
- [ ] Ensure the project has reusable components instead of one oversized component.

**Exit criteria:** Core screens render reliably, responsive layout works, and all visible controls either work or are clearly marked as placeholders.

### Phase 2 — Frontend polish and demo simulation reliability
**Category:** Frontend / interaction / quality
**Status:** Current active phase

**Immediate priorities:**
- [ ] Fix sticky/fixed navigation overlap and any clipped goal or island content.
- [ ] Reduce collisions between agent names, department labels, buildings and message bubbles.
- [ ] Keep labels anchored to agents through movement, pan, zoom and resize.
- [ ] Improve message bubble placement, readability and dismissal.
- [ ] Ensure activity feed is ordered newest-first and has a reasonable visible-item limit.
- [ ] Test Play, Pause and Reset; make sure there is only one simulation loop.
- [ ] Confirm agents move to valid destinations, stop on arrival and do not wander outside the island.
- [ ] Ensure zoom, pan and View All transform the world, paths, characters and labels consistently.
- [ ] Mark all sample events and sample progress clearly as **DEMO** or **SIMULATED**; reserve **LIVE** for real connected execution.
- [ ] Respect reduced-motion preferences and avoid excessive CPU usage.

**Exit criteria:** The experience is coherent and usable; simulation controls behave correctly; demo data is never confused with real work.

### Phase 3 — Persistent application data and backend foundation
**Category:** Backend / database / state management
**Status:** Not started / not verified

Build only after Phase 2 is stable.

- [ ] Inspect the current app framework and choose the simplest compatible backend.
- [ ] Define data models: Goal, Department, Agent, Task, ExecutionJob, ActivityEvent, ClipProject and ClipAsset.
- [ ] Create a database schema and migrations.
- [ ] Save and reload goals, agent configuration, tasks and user preferences.
- [ ] Add backend endpoints/actions with validation and meaningful error states.
- [ ] Add loading, empty, success and failure states to the frontend.
- [ ] Keep secrets server-side; never place API keys in client code.
- [ ] Add authentication only if personal access across sessions/devices or cloud execution requires it.
- [ ] Ensure page refresh does not silently reset saved business data.

**Exit criteria:** Data is persisted reliably and the UI reads/writes through a real, tested backend rather than only in-memory sample data.

### Phase 4 — Real task execution and agent orchestration
**Category:** Backend / AI / jobs / observability
**Status:** Not started

- [ ] Implement an execution-job lifecycle: queued, running, waiting for approval, completed, failed, cancelled.
- [ ] Build a task runner/worker that can execute a small set of allowlisted actions.
- [ ] Add a planner/orchestrator that breaks a goal into explicit tasks; require approval for risky actions.
- [ ] Add retries with limits, timeouts, cancellation and failure reporting.
- [ ] Record structured logs and events for each job.
- [ ] Stream status changes to the UI using the simplest reliable method (polling first if sufficient; server-sent events/WebSockets if needed).
- [ ] Separate an LLM's proposed action from actual tool execution; validate inputs and permissions server-side.
- [ ] Start with one practical workflow before adding multiple autonomous agents.
- [ ] Show genuine execution status only when backed by real job records.

**Exit criteria:** One real, bounded task can run end-to-end with observable status, logs, safe failure handling and human review where required.

### Phase 5 — Content Studio and real video clipping
**Category:** Video pipeline / local compute / storage / UI integration
**Status:** Not started

- [ ] Evaluate an existing clipping tool and verify its license, Windows compatibility, automation interface, model needs and output quality.
- [ ] Prove one source video can produce useful candidate clips locally before building integration.
- [ ] Create a ClipProject/job record with source file, owner/permission confirmation, settings and status.
- [ ] Add a safe file intake path and limits for file size/type/duration.
- [ ] Keep large video assets out of the database; store file references and metadata in the database.
- [ ] Run processing in a worker or local service, not inside a normal short web request.
- [ ] Generate candidate clips, captions and metadata; track each output asset.
- [ ] Add preview, approve/reject, retry, reprocess and download flows.
- [ ] Add quality checks for duration, aspect ratio, file validity, caption timing and missing audio.
- [ ] Show real processing progress and errors; never fabricate completed clips.
- [ ] Keep human approval before delivery/publishing.

**Exit criteria:** An authorized source video goes through a reproducible pipeline and produces real reviewable clips with recoverable job status.

### Phase 6 — Personal automation and workflow expansion
**Category:** AI workflows / integrations
**Status:** Not started; only after the clipping flow works

- [ ] Automate intake, job creation, file organization, notifications and delivery.
- [ ] Add reusable clip presets and per-project settings.
- [ ] Add AI assistance for clip selection, titles, descriptions or quality review only where it improves outcomes.
- [ ] Add scheduled jobs only with clear limits, logs and a way to pause/cancel.
- [ ] Introduce additional departments/workflows one at a time, based on real need.
- [ ] Track cost per job, processing time, acceptance rate and manual correction time.

**Exit criteria:** Repeated work is measurably easier, more reliable or cheaper than doing it manually.

### Phase 7 — Security, deployment and reliability
**Category:** DevOps / security / release
**Status:** Not started

- [ ] Keep code in a private Git repository with checkpoints before major changes.
- [ ] Configure separate development and production environments.
- [ ] Secure file access and ensure users cannot access another user's files if multi-user support is ever added.
- [ ] Restrict upload types and sizes; treat all uploaded files as untrusted.
- [ ] Store secrets in environment/secret management, not source code.
- [ ] Add rate limits, cost controls and audit logs before public exposure.
- [ ] Test backup and recovery for important data.
- [ ] Add error monitoring and health checks.
- [ ] Review dependency licenses and the licenses of code/assets copied or adapted.
- [ ] Deploy only after a production build and core workflow tests pass.

**Exit criteria:** The app can be deployed and maintained with known risks, controlled costs and a recovery plan.

### Phase 8 — Optional multi-user service/business features
**Category:** Product / accounts / billing
**Status:** Optional future phase

- [ ] Decide whether MissionTown remains a personal tool or becomes a service for customers.
- [ ] If selling access, add account boundaries, plans/quotas, billing, support and user-facing terms.
- [ ] Add customer onboarding and usage/cost reporting.
- [ ] Validate willingness to pay before building a large billing or marketing system.

**Exit criteria:** Only proceed if multi-user or commercial distribution is a deliberate product goal.

## 4. Workstream view: frontend vs backend vs AI

| Workstream | Includes | Current state | Next meaningful work |
|---|---|---|---|
| Frontend / UI | Landing page, island, agent labels, panels, navigation, responsive layout | Main prototype exists | Fix overlap/crowding and verify every control. |
| Interaction / demo simulation | Movement, bubbles, event feed, Play/Pause/Reset, zoom/pan | Present in demo; behavior must be tested | Make one deterministic simulation loop and validate coordinate alignment. |
| Backend / data | API, database, persistence, user preferences, jobs | Not started / not verified | Design the minimal schema after frontend stabilization. |
| Real AI agents | Planner, task execution, tools, permissions, logs | Not started | Create one bounded, observable real workflow after backend foundation. |
| Video clipping | Intake, transcription/highlight selection, rendering, captions, review/export | Not started | First evaluate and run a local clipper independently. |
| DevOps / security | Git checkpoints, secrets, builds, deployment, monitoring, backups | Partial/unknown | Confirm source backup and run commands; production safeguards later. |
| Product/business | Pricing, customer accounts, usage limits, onboarding | Not current priority | Keep out of scope until the personal workflow works. |

## 5. Definition of status labels

- **NOT STARTED:** No implementation is known to exist.
- **PLANNED:** Agreed future work, not currently being implemented.
- **IN PROGRESS:** Work is actively being performed.
- **IMPLEMENTED — UNVERIFIED:** Code/UI appears to exist, but relevant tests have not been run.
- **VERIFIED:** The feature was tested with a recorded result.
- **BLOCKED:** Work cannot proceed until a stated issue is resolved.
- **DEFERRED:** Deliberately postponed; explain why.

Never mark a feature VERIFIED based only on a screenshot or on the AI coding tool's untested claim.

## 6. Change log format

After every meaningful development session, append an entry to `CHANGELOG.md` with:

```md
## YYYY-MM-DD — Short change title
- **Phase:** Phase N — Name
- **Workstream:** Frontend / Backend / AI / Video / DevOps / Product
- **Changed:** Files or features changed
- **Reason:** Why this was needed
- **Tests run:** Exact checks actually performed
- **Result:** Passed / Failed / Not verified
- **Known issues:** Remaining defects
- **Next step:** One clear next task
```

## 7. Working agreement for AI coding tools

Before each task:
1. Read `PROJECT_ROADMAP.md`, `CURRENT_STATUS.md`, `CHANGELOG.md` and relevant project files.
2. Identify the current phase and the smallest useful next change.
3. Inspect existing code before editing.
4. Do not rewrite working features without a strong reason.
5. Implement only the requested scope; list optional ideas separately.
6. Run relevant checks and report actual results honestly.
7. Update `CURRENT_STATUS.md` and `CHANGELOG.md` after the work. Update phase checkboxes only when justified by evidence.
8. Tell the user what changed, why it matters, what they should test, and the next recommended step.

## 8. Immediate next task

**Phase 2 — Frontend polish and demo simulation reliability**

1. Fix MissionTown navbar/layout overlap and clipped goal/island content.
2. Improve agent label and speech-bubble collisions.
3. Verify Play/Pause/Reset and ensure there is only one simulation loop.
4. Verify pan/zoom/View All with all scene elements aligned.
5. Ensure sample activity is labelled DEMO/SIMULATED, not LIVE.
6. Test desktop and mobile layouts.
7. Record exact results in `CURRENT_STATUS.md` and `CHANGELOG.md`.

Do not start persistent backend development, real AI execution or video-clipping integration until this phase has been tested and accepted.
