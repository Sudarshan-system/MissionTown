# MissionTown Phase 3 — Firestore Security Specification (`security_spec.md`)

## 1. Security Invariants & Access Model
- **Zero-Trust Default Deny:** All paths default to `allow read, write: if false;`.
- **Strict User Partitioning:** All application records live under `/users/{userId}/{collection}/{docId}`. Only an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true && request.auth.uid == userId`) can read or write documents inside their own `/users/{userId}/...` namespace.
- **Cross-User Isolation:** No user can read, list, create, update, or delete any document under another user's `{userId}` path.
- **Path-to-Data Consistency:** Every document must store `id == docId` and `ownerUid == userId == request.auth.uid`.
- **Immutable Metadata:** `id`, `ownerUid`, `schemaVersion`, and `createdAt` cannot be modified on `update`.
- **Server Timestamps Only:** `createdAt` and `updatedAt` must equal `request.time` on `create`, and `updatedAt == request.time` on `update`.
- **No Unbounded Payloads:** Every string field enforces strict `.size()` bounds, every numeric field enforces range bounds, and every document enforces `keys().hasAll(...) && keys().hasOnly(...)`.

## 2. "Dirty Dozen" Attack Payloads & Mitigations

| # | Attack Vector / Payload | Target Collection | Mitigation in `firestore.rules` |
|---|---|---|---|
| 1 | Unauthenticated read/write (`auth == null`) | `/users/{userId}/**` | Blocked by `isOwner(userId)` requiring `request.auth != null` and `email_verified == true`. |
| 2 | Cross-user read (`auth.uid == 'attacker'`, path `userId == 'victim'`) | `/users/{userId}/workspaces/main` | Blocked by `request.auth.uid == userId`. |
| 3 | Cross-user write / Ownership hijacking (`ownerUid: 'victim'`) | `/users/{userId}/tasks/{taskId}` | Blocked by `request.resource.data.ownerUid == userId` on create and `request.resource.data.ownerUid == resource.data.ownerUid` on update. |
| 4 | Extra undocumented fields (`isAdmin: true`, `injectedField: 'x'`) | All collections | Blocked by `request.resource.data.keys().hasOnly([...])` on create and `diff(resource.data).affectedKeys().hasOnly([...])` on update. |
| 5 | Oversized string DoS (`title` of 50,000 chars) | `workspaces`, `tasks`, `activities` | Blocked by strict `.size() <= 240` / `<= 320` / `<= 500` checks on every string field. |
| 6 | Type confusion (`targetValue: "10"` instead of number, or `NaN`/`Infinity`) | `workspaces`, `agents`, `tasks` | Blocked by `is number` / `is int` and finite range bounds (`>= 0 && <= 1000000`). |
| 7 | Forged timestamps (`createdAt` set in past or future) | All collections | Blocked by `request.resource.data.createdAt == request.time` and `request.resource.data.updatedAt == request.time`. |
| 8 | Mutating `createdAt` or `id` on update | All collections | Blocked by `affectedKeys().hasOnly(...)` excluding `id`, `ownerUid`, `schemaVersion`, and `createdAt`, plus explicit equality assertions. |
| 9 | Invalid enum injection (`departmentId: "hacked-dept"`, `status: "root"`) | `departments`, `agents`, `tasks`, `activities` | Blocked by explicit `in [...]` list membership checks for `departmentId`, `status`, `priority`, `badgeColor`, `eventType`. |
| 10 | Malformed document IDs (path traversal or 200-char IDs) | All collections | Blocked by `isValidId(docId)` enforcing `docId.matches('^[a-zA-Z0-9_-]{1,80}$')`. |
| 11 | Out-of-bounds island coordinates (`homeX: -99999`) | `departments`, `agents` | Blocked by `>= 0 && <= 1000` coordinate range validation. |
| 12 | Unverified email token (`email_verified == false`) | All collections | Blocked by `isSignedIn()` requiring `request.auth.token.email_verified == true`. |
| 13 | Unauthorized or unapproved task plan / execution job injection (`providerId: "paid-api"`, `retryCount: 999`) | `taskPlans`, `executionJobs`, `clipBriefs` | Blocked by strict enum checks (`providerId in ['ollama_local', 'gemini_free_tier', 'deterministic_local']`), bounded `retryCount <= 5`, and `tasksJson.size() <= 8000`. |

| 13 | Unauthorized or unapproved task plan / execution job injection (`providerId: "paid-api"`, `retryCount: 999`) | `taskPlans`, `executionJobs`, `clipBriefs` | Blocked by strict enum checks (`providerId in ['ollama_local', 'gemini_free_tier', 'deterministic_local']`), bounded `retryCount <= 5`, and `tasksJson.size() <= 8000`. |

