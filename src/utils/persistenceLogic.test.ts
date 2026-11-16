import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_COMPANY_REPOSITORY } from '../data/demoCompanyData';
import {
  createWorkspaceRepository,
  WorkspaceStorageAdapter,
} from '../services/workspaceRepository';
import {
  ActivityEventRecord,
  AgentRecord,
  ClipBriefRecord,
  DelegationPlanRecord,
  DepartmentRecord,
  ExecutionJobRecord,
  PERSISTENCE_SCHEMA_VERSION,
  TaskRecord,
  UserPreferencesRecord,
  WorkspaceGoalRecord,
} from '../types/mission';
import {
  evaluateUserScopedAccessRule,
  fromActivityEventRecord,
  fromAgentRecord,
  fromDepartmentRecord,
  fromTaskRecord,
  fromWorkspaceGoalRecord,
  mergePersistedWorkspaceWithDemo,
  PREFERENCES_DOC_ID,
  shouldSeedInitialWorkspace,
  toActivityEventPayload,
  toAgentPayload,
  toClipBriefPayload,
  toDelegationPlanPayload,
  toDepartmentPayload,
  toExecutionJobPayload,
  toTaskPayload,
  toUserPreferencesPayload,
  toWorkspaceGoalPayload,
  WORKSPACE_DOC_ID,
} from './persistenceLogic';

function createInMemoryStorageAdapter(): {
  adapter: WorkspaceStorageAdapter;
  seedCount: () => number;
  setShouldFailWrites: (fail: boolean) => void;
} {
  const goals = new Map<string, WorkspaceGoalRecord>();
  const departments = new Map<string, Map<string, DepartmentRecord>>();
  const agents = new Map<string, Map<string, AgentRecord>>();
  const tasks = new Map<string, Map<string, TaskRecord>>();
  const activities = new Map<string, Map<string, ActivityEventRecord>>();
  const preferences = new Map<string, UserPreferencesRecord>();
  const taskPlans = new Map<string, Map<string, DelegationPlanRecord>>();
  const executionJobs = new Map<string, Map<string, ExecutionJobRecord>>();
  const clipBriefs = new Map<string, Map<string, ClipBriefRecord>>();
  let seedsTriggered = 0;
  let shouldFailWrites = false;

  const ensureWriteAllowed = () => {
    if (shouldFailWrites) {
      throw new Error('Simulated Firestore write failure');
    }
  };

  const adapter: WorkspaceStorageAdapter = {
    async getWorkspaceGoal(uid) {
      return goals.get(uid) ?? null;
    },
    async getAllCollections(uid) {
      return {
        departments: Array.from(departments.get(uid)?.values() ?? []),
        agents: Array.from(agents.get(uid)?.values() ?? []),
        tasks: Array.from(tasks.get(uid)?.values() ?? []),
        activities: Array.from(activities.get(uid)?.values() ?? []),
        preferences: preferences.get(uid) ?? null,
        taskPlans: Array.from(taskPlans.get(uid)?.values() ?? []),
        executionJobs: Array.from(executionJobs.get(uid)?.values() ?? []),
        clipBriefs: Array.from(clipBriefs.get(uid)?.values() ?? []),
      };
    },
    async seedInitialWorkspace(uid, payloads) {
      ensureWriteAllowed();
      seedsTriggered += 1;
      goals.set(uid, { ...payloads.goal });
      departments.set(
        uid,
        new Map(payloads.departments.map((d) => [d.id, { ...d }]))
      );
      agents.set(
        uid,
        new Map(payloads.agents.map((a) => [a.id, { ...a }]))
      );
      tasks.set(
        uid,
        new Map(payloads.tasks.map((t) => [t.id, { ...t }]))
      );
      activities.set(
        uid,
        new Map(payloads.activities.map((e) => [e.id, { ...e }]))
      );
      preferences.set(uid, { ...payloads.preferences });
    },
    async updateWorkspaceGoal(uid, goalPayload) {
      ensureWriteAllowed();
      goals.set(uid, { ...goalPayload });
    },
    async updateTaskAndAgentWithActivity(
      uid,
      taskPayload,
      agentPayload,
      activityPayload
    ) {
      ensureWriteAllowed();
      const userTasks = tasks.get(uid) ?? new Map();
      userTasks.set(taskPayload.id, { ...taskPayload });
      tasks.set(uid, userTasks);

      const userAgents = agents.get(uid) ?? new Map();
      userAgents.set(agentPayload.id, { ...agentPayload });
      agents.set(uid, userAgents);

      const userActivities = activities.get(uid) ?? new Map();
      userActivities.set(activityPayload.id, { ...activityPayload });
      activities.set(uid, userActivities);
    },
    async updateAgentConfig(uid, agentPayload) {
      ensureWriteAllowed();
      const userAgents = agents.get(uid) ?? new Map();
      userAgents.set(agentPayload.id, { ...agentPayload });
      agents.set(uid, userAgents);
    },
    async updateDepartmentConfig(uid, deptPayload) {
      ensureWriteAllowed();
      const userDepts = departments.get(uid) ?? new Map();
      userDepts.set(deptPayload.id, { ...deptPayload });
      departments.set(uid, userDepts);
    },
    async updatePreferences(uid, prefsPayload) {
      ensureWriteAllowed();
      preferences.set(uid, { ...prefsPayload });
    },
    async deleteActivity(uid, activityId) {
      ensureWriteAllowed();
      activities.get(uid)?.delete(activityId);
    },
    async saveTaskPlan(uid, planPayload, activityPayload) {
      ensureWriteAllowed();
      const userPlans = taskPlans.get(uid) ?? new Map();
      userPlans.set(planPayload.id, { ...planPayload });
      taskPlans.set(uid, userPlans);

      if (activityPayload) {
        const userActivities = activities.get(uid) ?? new Map();
        userActivities.set(activityPayload.id, { ...activityPayload });
        activities.set(uid, userActivities);
      }
    },
    async saveExecutionJobAndBriefs(
      uid,
      jobPayload,
      briefPayloads,
      planPayload,
      activityPayload
    ) {
      ensureWriteAllowed();
      const userJobs = executionJobs.get(uid) ?? new Map();
      userJobs.set(jobPayload.id, { ...jobPayload });
      executionJobs.set(uid, userJobs);

      const userBriefs = clipBriefs.get(uid) ?? new Map();
      for (const b of briefPayloads) {
        userBriefs.set(b.id, { ...b });
      }
      clipBriefs.set(uid, userBriefs);

      if (planPayload) {
        const userPlans = taskPlans.get(uid) ?? new Map();
        userPlans.set(planPayload.id, { ...planPayload });
        taskPlans.set(uid, userPlans);
      }

      if (activityPayload) {
        const userActivities = activities.get(uid) ?? new Map();
        userActivities.set(activityPayload.id, { ...activityPayload });
        activities.set(uid, userActivities);
      }
    },
  };

  return {
    adapter,
    seedCount: () => seedsTriggered,
    setShouldFailWrites: (fail: boolean) => {
      shouldFailWrites = fail;
    },
  };
}

test('data mapping: toAgentPayload strips transient movement and bubble state while preserving homeCoords', () => {
  const sampleAgent = {
    ...DEMO_COMPANY_REPOSITORY.agents[0],
    islandCoords: { x: 612, y: 422 },
    homeCoords: { x: 500, y: 178 },
    destinationCoords: { x: 612, y: 422 },
    waypoints: [{ x: 550, y: 300 }],
    animationState: 'walking' as const,
    sampleBubbleText: 'Transient bubble message',
    bubbleExpiresAt: Date.now() + 5000,
  };

  const payload = toAgentPayload(sampleAgent, 'user_123');
  assert.equal(payload.id, sampleAgent.id);
  assert.equal(payload.ownerUid, 'user_123');
  assert.equal(payload.schemaVersion, PERSISTENCE_SCHEMA_VERSION);
  assert.equal(payload.homeX, 500);
  assert.equal(payload.homeY, 178);
  assert.equal('waypoints' in payload, false);
  assert.equal('sampleBubbleText' in payload, false);
  assert.equal('bubbleExpiresAt' in payload, false);

  const hydrated = fromAgentRecord(payload);
  assert.deepEqual(hydrated.islandCoords, { x: 500, y: 178 });
  assert.deepEqual(hydrated.homeCoords, { x: 500, y: 178 });
  assert.equal(hydrated.waypoints, undefined);
});

test('data mapping: goal, department, task, and activity round-trip cleanly with schemaVersion 1', () => {
  const uid = 'user_abc';
  const goalPayload = toWorkspaceGoalPayload(
    DEMO_COMPANY_REPOSITORY.initialGoal,
    uid
  );
  assert.equal(goalPayload.id, WORKSPACE_DOC_ID);
  assert.equal(goalPayload.ownerUid, uid);
  assert.equal(goalPayload.schemaVersion, 1);

  const restoredGoal = fromWorkspaceGoalRecord(
    goalPayload,
    DEMO_COMPANY_REPOSITORY.initialGoal
  );
  assert.equal(restoredGoal.title, DEMO_COMPANY_REPOSITORY.initialGoal.title);

  const deptPayload = toDepartmentPayload(
    DEMO_COMPANY_REPOSITORY.departments[1],
    uid
  );
  const restoredDept = fromDepartmentRecord(deptPayload);
  assert.equal(restoredDept.id, 'content-studio');
  assert.deepEqual(restoredDept.islandPosition, { x: 605, y: 405 });

  const taskPayload = toTaskPayload(DEMO_COMPANY_REPOSITORY.tasks[0], uid);
  const restoredTask = fromTaskRecord(taskPayload);
  assert.equal(restoredTask.id, DEMO_COMPANY_REPOSITORY.tasks[0].id);
  assert.equal(restoredTask.title, DEMO_COMPANY_REPOSITORY.tasks[0].title);

  const evtPayload = toActivityEventPayload(
    DEMO_COMPANY_REPOSITORY.activityEvents[0],
    uid,
    1700000009000
  );
  const restoredEvt = fromActivityEventRecord(evtPayload);
  assert.equal(restoredEvt.id, DEMO_COMPANY_REPOSITORY.activityEvents[0].id);
  assert.equal(restoredEvt.message, DEMO_COMPANY_REPOSITORY.activityEvents[0].message);
});

test('persistence service: seeds initial workspace once and never overwrites saved goal or task on reload', async () => {
  const { adapter, seedCount, setShouldFailWrites } =
    createInMemoryStorageAdapter();
  const repo = createWorkspaceRepository(adapter);
  const uid = 'user_mission_1';

  assert.equal(shouldSeedInitialWorkspace(false), true);
  assert.equal(shouldSeedInitialWorkspace(true), false);

  // 1. First login seeds workspace
  const firstLoad = await repo.loadOrInitializeUserWorkspace(
    uid,
    DEMO_COMPANY_REPOSITORY
  );
  assert.equal(firstLoad.wasSeededFirstRun, true);
  assert.equal(seedCount(), 1);
  assert.equal(firstLoad.state.agents.length, 15);
  assert.equal(firstLoad.state.departments.length, 4);

  // 2. User updates goal and assigns a custom sample task to Pixel
  const customGoal = {
    ...firstLoad.state.goal,
    title: 'Sign 25 podcast creators for daily 9:16 shorts.',
  };
  await repo.saveWorkspaceGoal(uid, customGoal);

  const pixelAgent = firstLoad.state.agents.find((a) => a.id === 'agent-pixel')!;
  const pixelTask = firstLoad.state.tasks.find(
    (t) => t.id === pixelAgent.currentTaskId
  )!;
  const updatedTask = {
    ...pixelTask,
    title: 'Cut 60fps vertical highlight for Creator Episode #88',
    progressPercent: 55,
  };
  const updatedAgent = {
    ...pixelAgent,
    progressPercent: 55,
  };
  const customActivity = {
    id: 'evt-custom-88',
    fromAgentName: 'The Boss',
    toAgentName: 'Pixel',
    fromAgentId: 'agent-boss',
    toAgentId: 'agent-pixel',
    departmentId: 'content-studio' as const,
    destinationLabel: 'Content Studio',
    message: 'Assigned sample task: "Cut 60fps vertical highlight for Creator Episode #88"',
    timestampLabel: 'Sample · Just now',
    createdAt: Date.now(),
    status: 'completed' as const,
    eventType: 'clip_spec' as const,
    isSampleData: true,
  };

  await repo.saveAgentTaskAssignment(
    uid,
    updatedAgent,
    updatedTask,
    customActivity
  );
  await repo.saveUserPreferences(uid, {
    defaultDepartmentFilter: 'content-studio',
    selectedAgentId: 'agent-pixel',
    simulationAutoplay: true,
  });

  // 3. Browser refresh / second login must NOT re-seed or overwrite saved data
  const secondLoad = await repo.loadOrInitializeUserWorkspace(
    uid,
    DEMO_COMPANY_REPOSITORY
  );
  assert.equal(secondLoad.wasSeededFirstRun, false);
  assert.equal(seedCount(), 1);
  assert.equal(
    secondLoad.state.goal.title,
    'Sign 25 podcast creators for daily 9:16 shorts.'
  );
  const reloadedPixelTask = secondLoad.state.tasks.find(
    (t) => t.id === pixelAgent.currentTaskId
  );
  assert.equal(
    reloadedPixelTask?.title,
    'Cut 60fps vertical highlight for Creator Episode #88'
  );
  assert.equal(
    secondLoad.state.preferences.defaultDepartmentFilter,
    'content-studio'
  );
  assert.equal(secondLoad.state.preferences.selectedAgentId, 'agent-pixel');

  // 4. Write failures propagate errors so the UI never reports a false save
  setShouldFailWrites(true);
  await assert.rejects(
    async () => {
      await repo.saveWorkspaceGoal(uid, customGoal);
    },
    /Simulated Firestore write failure/
  );
});

test('user-scoped security rules: enforces authentication, verified email, owner isolation, and schema bounds', () => {
  const ownerAuth = { uid: 'user_owner', emailVerified: true };
  const attackerAuth = { uid: 'user_attacker', emailVerified: true };
  const unverifiedAuth = { uid: 'user_owner', emailVerified: false };

  // 1. Deny unauthenticated access
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: null,
      pathUserId: 'user_owner',
      collection: 'workspaces',
      docId: 'main',
      operation: 'get',
    }).allowed,
    false
  );

  // 2. Deny unverified email access
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: unverifiedAuth,
      pathUserId: 'user_owner',
      collection: 'workspaces',
      docId: 'main',
      operation: 'get',
    }).allowed,
    false
  );

  // 3. Deny cross-user read and write
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: attackerAuth,
      pathUserId: 'user_owner',
      collection: 'workspaces',
      docId: 'main',
      operation: 'get',
    }).allowed,
    false
  );

  // 4. Deny unknown collection (default-deny catch-all)
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'unknown',
      docId: 'main',
      operation: 'get',
    }).allowed,
    false
  );

  // 5. Allow valid owner create with server timestamps
  const validGoalDoc = {
    ...toWorkspaceGoalPayload(DEMO_COMPANY_REPOSITORY.initialGoal, 'user_owner'),
    createdAt: 'SERVER_TIMESTAMP',
    updatedAt: 'SERVER_TIMESTAMP',
  };
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'workspaces',
      docId: 'main',
      operation: 'create',
      requestData: validGoalDoc,
    }).allowed,
    true
  );

  // 6. Deny extra undocumented keys or oversized title
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'workspaces',
      docId: 'main',
      operation: 'create',
      requestData: {
        ...validGoalDoc,
        isAdmin: true,
      },
    }).allowed,
    false
  );

  // 7. Deny mutating ownerUid or createdAt on update
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'workspaces',
      docId: 'main',
      operation: 'update',
      existingData: validGoalDoc,
      requestData: {
        ...validGoalDoc,
        createdAt: 'FORGED_PAST_TIME',
      },
    }).allowed,
    false
  );

  const prefsPayload = toUserPreferencesPayload(
    { defaultDepartmentFilter: 'growth', selectedAgentId: 'agent-echo' },
    'user_owner'
  );
  assert.equal(prefsPayload.id, PREFERENCES_DOC_ID);

  // 8. Phase 4 collections (taskPlans, executionJobs, clipBriefs)
  const planDoc = {
    ...toDelegationPlanPayload(
      {
        id: 'plan-1',
        ownerUid: 'user_owner',
        schemaVersion: 1,
        goalId: 'goal-1',
        goalTitle: 'Grow my clipping service to 10 paying creators.',
        providerId: 'deterministic_local',
        status: 'waiting_for_approval',
        autoRunApprovedTypesOnly: true,
        tasksJson: '[{"id":"ptask-1"}]',
        taskCount: 1,
        supportedTaskCount: 1,
      },
      'user_owner'
    ),
    createdAt: 'SERVER_TIMESTAMP',
    updatedAt: 'SERVER_TIMESTAMP',
  };
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'taskPlans',
      docId: 'plan-1',
      operation: 'create',
      requestData: planDoc,
    }).allowed,
    true
  );

  const jobDoc = {
    ...toExecutionJobPayload(
      {
        id: 'job-1',
        ownerUid: 'user_owner',
        schemaVersion: 1,
        planId: 'plan-1',
        taskId: 'ptask-1',
        taskTitle: 'Extract clip briefs',
        taskType: 'clip_brief_generation',
        assignedAgentId: 'agent-muse',
        assignedAgentName: 'Muse',
        providerId: 'deterministic_local',
        status: 'completed',
        permissionConfirmed: true,
        retryCount: 0,
        maxRetries: 2,
        sourceTranscriptExcerpt: 'Sample podcast excerpt',
        outputSummary: 'Generated 3 candidate clip briefs',
        errorMessage: '',
        isSampleData: false,
      },
      'user_owner'
    ),
    createdAt: 'SERVER_TIMESTAMP',
    updatedAt: 'SERVER_TIMESTAMP',
  };
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'executionJobs',
      docId: 'job-1',
      operation: 'create',
      requestData: jobDoc,
    }).allowed,
    true
  );

  const briefDoc = {
    ...toClipBriefPayload(
      {
        id: 'brief-1',
        ownerUid: 'user_owner',
        schemaVersion: 1,
        jobId: 'job-1',
        planId: 'plan-1',
        taskId: 'ptask-1',
        agentId: 'agent-muse',
        clipTitle: 'Counter-Intuitive Pricing Hook',
        hookLine: 'Why raising our retainer dropped churn to zero.',
        segmentTimestamp: '00:04:39 (+38s)',
        segmentQuote: 'When we raised our creator retainer from $600 to $1,800...',
        estimatedDurationSec: 38,
        aspectRatio: '9:16',
        captionDraft: '[9:16 CAPTION] CHURN DROPPED TO ZERO',
        retentionRationale: 'Opens with a concrete number and broken assumption.',
      },
      'user_owner'
    ),
    createdAt: 'SERVER_TIMESTAMP',
    updatedAt: 'SERVER_TIMESTAMP',
  };
  assert.equal(
    evaluateUserScopedAccessRule({
      auth: ownerAuth,
      pathUserId: 'user_owner',
      collection: 'clipBriefs',
      docId: 'brief-1',
      operation: 'create',
      requestData: briefDoc,
    }).allowed,
    true
  );
});

