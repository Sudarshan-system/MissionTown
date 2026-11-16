import {
  ActivityEvent,
  ActivityEventRecord,
  Agent,
  AgentRecord,
  ClipBriefRecord,
  DelegationPlanRecord,
  Department,
  DepartmentId,
  DepartmentRecord,
  ExecutionJobRecord,
  Goal,
  MissionDataRepository,
  PERSISTENCE_SCHEMA_VERSION,
  Task,
  TaskRecord,
  UserPreferencesRecord,
  WorkspaceGoalRecord,
} from '../types/mission';

export const WORKSPACE_DOC_ID = 'main';
export const PREFERENCES_DOC_ID = 'settings';

const VALID_DEPARTMENTS: ReadonlySet<DepartmentId> = new Set([
  'the-boss',
  'content-studio',
  'growth',
  'sales-community',
]);

function clampString(value: string | undefined, maxLen: number, fallback = ''): string {
  const clean = (value ?? fallback).trim();
  if (!clean) return fallback;
  return clean.slice(0, maxLen);
}

export function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
  return cleaned || 'doc-default';
}

export function shouldSeedInitialWorkspace(existingGoalDocExists: boolean): boolean {
  return !existingGoalDocExists;
}

export function toWorkspaceGoalPayload(
  goal: Goal,
  ownerUid: string,
  workspaceId: string = WORKSPACE_DOC_ID
): Omit<WorkspaceGoalRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: sanitizeDocId(workspaceId),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    title: clampString(goal.title, 240, 'Grow my clipping service to 10 paying creators.'),
    metricLabel: clampString(goal.metricLabel, 60, '0 / 10'),
    currentValue: Math.max(0, Math.min(1000000, Number(goal.currentValue) || 0)),
    targetValue: Math.max(1, Math.min(1000000, Number(goal.targetValue) || 10)),
    unit: clampString(goal.unit, 80, 'paying creators (Sample)'),
    currentDay: Math.max(0, Math.min(3650, Math.round(Number(goal.currentDay) || 1))),
    totalDays: Math.max(1, Math.min(3650, Math.round(Number(goal.totalDays) || 30))),
    deadlineLabel: clampString(goal.deadlineLabel, 80, 'Day 12 of 30'),
    countdownDisplay: clampString(goal.countdownDisplay, 60, '18D 11:33:12'),
    isSampleData: Boolean(goal.isSampleData),
  };
}

export function fromWorkspaceGoalRecord(
  record: WorkspaceGoalRecord,
  fallbackGoal: Goal
): Goal {
  return {
    id: fallbackGoal.id,
    title: record.title || fallbackGoal.title,
    metricLabel: record.metricLabel || fallbackGoal.metricLabel,
    currentValue:
      typeof record.currentValue === 'number'
        ? record.currentValue
        : fallbackGoal.currentValue,
    targetValue:
      typeof record.targetValue === 'number'
        ? record.targetValue
        : fallbackGoal.targetValue,
    unit: record.unit || fallbackGoal.unit,
    currentDay:
      typeof record.currentDay === 'number'
        ? record.currentDay
        : fallbackGoal.currentDay,
    totalDays:
      typeof record.totalDays === 'number'
        ? record.totalDays
        : fallbackGoal.totalDays,
    deadlineLabel: record.deadlineLabel || fallbackGoal.deadlineLabel,
    countdownDisplay: record.countdownDisplay || fallbackGoal.countdownDisplay,
    isSampleData:
      typeof record.isSampleData === 'boolean'
        ? record.isSampleData
        : fallbackGoal.isSampleData,
  };
}

export function toDepartmentPayload(
  dept: Department,
  ownerUid: string
): Omit<DepartmentRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: dept.id,
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    name: clampString(dept.name, 80, 'Department'),
    shortLabel: clampString(dept.shortLabel, 60, 'DEPT'),
    description: clampString(dept.description, 500, 'Department workspace'),
    accentColor: clampString(dept.accentColor, 20, '#34D399'),
    badgeBg: clampString(dept.badgeBg, 20, '#27B869'),
    badgeBorder: clampString(dept.badgeBorder, 20, '#134E2E'),
    badgeText: clampString(dept.badgeText, 20, '#FFFFFF'),
    islandX: Math.max(0, Math.min(1000, Math.round(dept.islandPosition.x))),
    islandY: Math.max(0, Math.min(1000, Math.round(dept.islandPosition.y))),
    futureEngineHook: clampString(dept.futureEngineHook, 200, 'Future engine adapter'),
  };
}

export function fromDepartmentRecord(record: DepartmentRecord): Department {
  return {
    id: record.id,
    name: record.name,
    shortLabel: record.shortLabel,
    description: record.description,
    accentColor: record.accentColor,
    badgeBg: record.badgeBg,
    badgeBorder: record.badgeBorder,
    badgeText: record.badgeText,
    islandPosition: {
      x: record.islandX,
      y: record.islandY,
    },
    futureEngineHook: record.futureEngineHook,
  };
}

/**
 * Strips temporary animation state (islandCoords while walking, waypoints,
 * active speech bubbles, expiration timers) so only durable agent metadata is stored.
 */
export function toAgentPayload(
  agent: Agent,
  ownerUid: string
): Omit<AgentRecord, 'createdAt' | 'updatedAt'> {
  const baseHome = agent.homeCoords ?? agent.islandCoords;
  return {
    id: sanitizeDocId(agent.id),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    name: clampString(agent.name, 80, 'Agent'),
    role: clampString(agent.role, 120, 'Specialist'),
    departmentId: VALID_DEPARTMENTS.has(agent.departmentId)
      ? agent.departmentId
      : 'content-studio',
    status: agent.status,
    badgeColor: agent.badgeColor,
    progressPercent: Math.max(0, Math.min(100, Math.round(agent.progressPercent))),
    homeX: Math.max(0, Math.min(1000, Math.round(baseHome.x))),
    homeY: Math.max(0, Math.min(1000, Math.round(baseHome.y))),
    destinationLabel: clampString(agent.destinationLabel, 120, 'Assigned Station'),
    speedPxPerSec: Math.max(10, Math.min(300, Math.round(agent.speedPxPerSec ?? 70))),
    currentTaskId: sanitizeDocId(agent.currentTaskId),
    executionJobId: sanitizeDocId(agent.executionJobId),
    specialty: clampString(agent.specialty, 300, 'AI workflow specialist'),
    isSampleData: Boolean(agent.isSampleData),
  };
}

export function fromAgentRecord(
  record: AgentRecord,
  templateAgent?: Agent
): Agent {
  const homePoint = { x: record.homeX, y: record.homeY };
  return {
    id: record.id,
    name: record.name,
    role: record.role,
    departmentId: record.departmentId,
    status: record.status,
    animationState:
      templateAgent?.animationState ??
      (record.status === 'idle' ? 'idle' : 'working'),
    badgeColor: record.badgeColor,
    progressPercent: record.progressPercent,
    islandCoords: homePoint,
    homeCoords: homePoint,
    destinationCoords: homePoint,
    destinationLabel: record.destinationLabel,
    speedPxPerSec: record.speedPxPerSec,
    currentTaskId: record.currentTaskId,
    executionJobId: record.executionJobId,
    specialty: record.specialty,
    sampleBubbleText: templateAgent?.sampleBubbleText,
    bubbleOffset: templateAgent?.bubbleOffset,
    isSampleData: record.isSampleData,
  };
}

export function toTaskPayload(
  task: Task,
  ownerUid: string
): Omit<TaskRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: sanitizeDocId(task.id),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    title: clampString(task.title, 240, 'Sample clipping task'),
    description: clampString(task.description, 500, 'Assigned workflow task'),
    departmentId: VALID_DEPARTMENTS.has(task.departmentId)
      ? task.departmentId
      : 'content-studio',
    assignedAgentId: sanitizeDocId(task.assignedAgentId),
    status: task.status,
    priority: task.priority,
    progressPercent: Math.max(0, Math.min(100, Math.round(task.progressPercent))),
    sampleOutputSummary: clampString(
      task.sampleOutputSummary,
      400,
      'Sample output summary (Simulated).'
    ),
    isSampleData: Boolean(task.isSampleData),
  };
}

export function fromTaskRecord(record: TaskRecord): Task {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    departmentId: record.departmentId,
    assignedAgentId: record.assignedAgentId,
    status: record.status,
    priority: record.priority,
    progressPercent: record.progressPercent,
    sampleOutputSummary: record.sampleOutputSummary,
    isSampleData: record.isSampleData,
  };
}

export function toActivityEventPayload(
  event: ActivityEvent,
  ownerUid: string,
  nowMs: number = Date.now()
): Omit<ActivityEventRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: sanitizeDocId(event.id),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    fromAgentName: clampString(event.fromAgentName, 80, 'The Boss'),
    toAgentName: (event.toAgentName ?? '').trim().slice(0, 80),
    fromAgentId: sanitizeDocId(event.fromAgentId),
    toAgentId: event.toAgentId ? sanitizeDocId(event.toAgentId) : '',
    departmentId: VALID_DEPARTMENTS.has(event.departmentId)
      ? event.departmentId
      : 'content-studio',
    destinationLabel: (event.destinationLabel ?? '').trim().slice(0, 120),
    message: clampString(event.message, 320, 'Sample activity event'),
    timestampLabel: clampString(event.timestampLabel, 80, 'Sample · Just now'),
    eventTimestampMs: Math.max(
      0,
      Math.min(9999999999999, Math.round(event.createdAt ?? nowMs))
    ),
    status: event.status ?? 'completed',
    eventType: event.eventType,
    isSampleData: Boolean(event.isSampleData),
  };
}

export function fromActivityEventRecord(
  record: ActivityEventRecord
): ActivityEvent {
  return {
    id: record.id,
    fromAgentName: record.fromAgentName,
    toAgentName: record.toAgentName || undefined,
    fromAgentId: record.fromAgentId,
    toAgentId: record.toAgentId || undefined,
    departmentId: record.departmentId,
    destinationLabel: record.destinationLabel || undefined,
    message: record.message,
    timestampLabel: record.timestampLabel,
    createdAt: record.eventTimestampMs,
    status: record.status,
    eventType: record.eventType,
    isSampleData: record.isSampleData,
  };
}

export function toUserPreferencesPayload(
  prefs: {
    defaultDepartmentFilter?: DepartmentId | 'all';
    selectedAgentId?: string | null;
    simulationAutoplay?: boolean;
  },
  ownerUid: string
): Omit<UserPreferencesRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: PREFERENCES_DOC_ID,
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    defaultDepartmentFilter: prefs.defaultDepartmentFilter ?? 'all',
    selectedAgentId: prefs.selectedAgentId
      ? sanitizeDocId(prefs.selectedAgentId)
      : '',
    simulationAutoplay: prefs.simulationAutoplay ?? true,
  };
}

export function toDelegationPlanPayload(
  plan: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
  ownerUid: string
): Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: sanitizeDocId(plan.id),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    goalId: sanitizeDocId(plan.goalId || 'goal-default'),
    goalTitle: clampString(
      plan.goalTitle,
      240,
      'Grow my clipping service to 10 paying creators.'
    ),
    providerId: plan.providerId,
    status: plan.status,
    autoRunApprovedTypesOnly: Boolean(plan.autoRunApprovedTypesOnly),
    tasksJson: clampString(plan.tasksJson, 8000, '[]'),
    taskCount: Math.max(1, Math.min(8, Math.round(plan.taskCount || 1))),
    supportedTaskCount: Math.max(
      0,
      Math.min(8, Math.round(plan.supportedTaskCount || 0))
    ),
  };
}

export function toExecutionJobPayload(
  job: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>,
  ownerUid: string
): Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: sanitizeDocId(job.id),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    planId: sanitizeDocId(job.planId),
    taskId: sanitizeDocId(job.taskId),
    taskTitle: clampString(job.taskTitle, 200, 'Delegated task'),
    taskType: job.taskType,
    assignedAgentId: sanitizeDocId(job.assignedAgentId),
    assignedAgentName: clampString(job.assignedAgentName, 80, 'Agent'),
    providerId: job.providerId,
    status: job.status,
    permissionConfirmed: Boolean(job.permissionConfirmed),
    retryCount: Math.max(0, Math.min(5, Math.round(job.retryCount || 0))),
    maxRetries: Math.max(1, Math.min(5, Math.round(job.maxRetries || 2))),
    sourceTranscriptExcerpt: (job.sourceTranscriptExcerpt ?? '')
      .trim()
      .slice(0, 300),
    outputSummary: (job.outputSummary ?? '').trim().slice(0, 400),
    errorMessage: (job.errorMessage ?? '').trim().slice(0, 320),
    isSampleData: Boolean(job.isSampleData),
  };
}

export function toClipBriefPayload(
  brief: Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>,
  ownerUid: string
): Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'> {
  return {
    id: sanitizeDocId(brief.id),
    ownerUid,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    jobId: sanitizeDocId(brief.jobId),
    planId: sanitizeDocId(brief.planId),
    taskId: sanitizeDocId(brief.taskId),
    agentId: sanitizeDocId(brief.agentId),
    clipTitle: clampString(brief.clipTitle, 140, 'Candidate Short Clip'),
    hookLine: clampString(brief.hookLine, 220, 'Opening hook line'),
    segmentTimestamp: clampString(brief.segmentTimestamp, 40, '00:01:00–00:01:38'),
    segmentQuote: clampString(brief.segmentQuote, 400, 'Source segment quote'),
    estimatedDurationSec: Math.max(
      12,
      Math.min(90, Math.round(brief.estimatedDurationSec || 38))
    ),
    aspectRatio: brief.aspectRatio,
    captionDraft: clampString(brief.captionDraft, 320, '[9:16 CAPTION]'),
    retentionRationale: clampString(
      brief.retentionRationale,
      320,
      'Retention rationale'
    ),
  };
}

export interface PersistedWorkspaceBundle {
  goal: WorkspaceGoalRecord | null;
  departments: DepartmentRecord[];
  agents: AgentRecord[];
  tasks: TaskRecord[];
  activities: ActivityEventRecord[];
  preferences: UserPreferencesRecord | null;
  taskPlans?: DelegationPlanRecord[];
  executionJobs?: ExecutionJobRecord[];
  clipBriefs?: ClipBriefRecord[];
}

export interface HydratedWorkspaceState {
  goal: Goal;
  departments: Department[];
  agents: Agent[];
  tasks: Task[];
  activityEvents: ActivityEvent[];
  preferences: {
    defaultDepartmentFilter: DepartmentId | 'all';
    selectedAgentId: string | null;
    simulationAutoplay: boolean;
  };
  taskPlans: DelegationPlanRecord[];
  executionJobs: ExecutionJobRecord[];
  clipBriefs: ClipBriefRecord[];
}

/**
 * Merges persisted user records with the default demo repository templates
 * without overwriting saved user modifications on reload or subsequent logins.
 */
export function mergePersistedWorkspaceWithDemo(
  persisted: PersistedWorkspaceBundle,
  demoRepo: MissionDataRepository
): HydratedWorkspaceState {
  const goal = persisted.goal
    ? fromWorkspaceGoalRecord(persisted.goal, demoRepo.initialGoal)
    : demoRepo.initialGoal;

  const deptById = new Map<string, DepartmentRecord>(
    persisted.departments.map((d) => [d.id, d])
  );
  const departments = demoRepo.departments.map((demoDept) => {
    const saved = deptById.get(demoDept.id);
    return saved ? fromDepartmentRecord(saved) : demoDept;
  });

  const agentById = new Map<string, AgentRecord>(
    persisted.agents.map((a) => [a.id, a])
  );
  const agents = demoRepo.agents.map((demoAgent) => {
    const saved = agentById.get(demoAgent.id);
    return saved ? fromAgentRecord(saved, demoAgent) : demoAgent;
  });

  const taskById = new Map<string, TaskRecord>(
    persisted.tasks.map((t) => [t.id, t])
  );
  const baseTasks = demoRepo.tasks.map((demoTask) => {
    const saved = taskById.get(demoTask.id);
    return saved ? fromTaskRecord(saved) : demoTask;
  });
  // Include any additional user-created tasks not in the initial demo list
  const demoTaskIds = new Set(demoRepo.tasks.map((t) => t.id));
  const extraTasks = persisted.tasks
    .filter((t) => !demoTaskIds.has(t.id))
    .map(fromTaskRecord);
  const tasks = [...baseTasks, ...extraTasks];

  const sortedActivities =
    persisted.activities.length > 0
      ? [...persisted.activities]
          .sort((a, b) => b.eventTimestampMs - a.eventTimestampMs)
          .slice(0, 12)
          .map(fromActivityEventRecord)
      : demoRepo.activityEvents;

  const preferences = {
    defaultDepartmentFilter:
      persisted.preferences?.defaultDepartmentFilter ?? 'all',
    selectedAgentId: persisted.preferences?.selectedAgentId
      ? persisted.preferences.selectedAgentId
      : null,
    simulationAutoplay: persisted.preferences?.simulationAutoplay ?? true,
  };

  return {
    goal,
    departments,
    agents,
    tasks,
    activityEvents: sortedActivities,
    preferences,
    taskPlans: persisted.taskPlans ?? [],
    executionJobs: persisted.executionJobs ?? [],
    clipBriefs: persisted.clipBriefs ?? [],
  };
}

/**
 * Pure security-rule evaluator mirroring `/firestore.rules` for deterministic unit testing
 * of user-scoped isolation, default deny, schema validation, and immutability invariants.
 */
export interface RuleAuthContext {
  uid: string;
  emailVerified: boolean;
}

export function evaluateUserScopedAccessRule(params: {
  auth: RuleAuthContext | null;
  pathUserId: string;
  collection:
    | 'workspaces'
    | 'departments'
    | 'agents'
    | 'tasks'
    | 'activities'
    | 'preferences'
    | 'taskPlans'
    | 'executionJobs'
    | 'clipBriefs'
    | 'unknown';
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestData?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  requestTimeTag?: string;
}): { allowed: boolean; reason: string } {
  const {
    auth,
    pathUserId,
    collection,
    docId,
    operation,
    requestData,
    existingData,
    requestTimeTag = 'SERVER_TIMESTAMP',
  } = params;

  const validIdRegex = /^[a-zA-Z0-9_-]{1,80}$/;

  if (!auth || !auth.uid) {
    return { allowed: false, reason: 'unauthenticated_denied' };
  }
  if (!auth.emailVerified) {
    return { allowed: false, reason: 'unverified_email_denied' };
  }
  if (!validIdRegex.test(pathUserId) || !validIdRegex.test(docId)) {
    return { allowed: false, reason: 'invalid_document_id' };
  }
  if (auth.uid !== pathUserId) {
    return { allowed: false, reason: 'cross_user_access_denied' };
  }
  if (collection === 'unknown') {
    return { allowed: false, reason: 'default_deny_catch_all' };
  }

  if (operation === 'get' || operation === 'list' || operation === 'delete') {
    return { allowed: true, reason: 'owner_allowed' };
  }

  if (!requestData) {
    return { allowed: false, reason: 'missing_request_payload' };
  }

  if (requestData.id !== docId || requestData.ownerUid !== pathUserId) {
    return { allowed: false, reason: 'path_to_data_mismatch' };
  }
  if (requestData.schemaVersion !== PERSISTENCE_SCHEMA_VERSION) {
    return { allowed: false, reason: 'invalid_schema_version' };
  }

  if (operation === 'create') {
    if (
      requestData.createdAt !== requestTimeTag ||
      requestData.updatedAt !== requestTimeTag
    ) {
      return { allowed: false, reason: 'invalid_server_timestamps' };
    }
  }

  if (operation === 'update') {
    if (!existingData) {
      return { allowed: false, reason: 'missing_existing_document' };
    }
    if (
      requestData.id !== existingData.id ||
      requestData.ownerUid !== existingData.ownerUid ||
      requestData.schemaVersion !== existingData.schemaVersion ||
      requestData.createdAt !== existingData.createdAt ||
      requestData.updatedAt !== requestTimeTag
    ) {
      return { allowed: false, reason: 'immutable_field_or_timestamp_violation' };
    }
  }

  if (collection === 'workspaces') {
    const requiredKeys = [
      'id',
      'ownerUid',
      'schemaVersion',
      'title',
      'metricLabel',
      'currentValue',
      'targetValue',
      'unit',
      'currentDay',
      'totalDays',
      'deadlineLabel',
      'countdownDisplay',
      'isSampleData',
      'createdAt',
      'updatedAt',
    ];
    const actualKeys = Object.keys(requestData);
    if (
      actualKeys.length !== requiredKeys.length ||
      !requiredKeys.every((k) => actualKeys.includes(k))
    ) {
      return { allowed: false, reason: 'schema_keys_violation' };
    }
    if (
      typeof requestData.title !== 'string' ||
      requestData.title.length < 1 ||
      requestData.title.length > 240
    ) {
      return { allowed: false, reason: 'invalid_title_bounds' };
    }
    if (
      typeof requestData.targetValue !== 'number' ||
      requestData.targetValue < 1 ||
      requestData.targetValue > 1000000
    ) {
      return { allowed: false, reason: 'invalid_numeric_bounds' };
    }
  }

  if (collection === 'tasks') {
    const requiredKeys = [
      'id',
      'ownerUid',
      'schemaVersion',
      'title',
      'description',
      'departmentId',
      'assignedAgentId',
      'status',
      'priority',
      'progressPercent',
      'sampleOutputSummary',
      'isSampleData',
      'createdAt',
      'updatedAt',
    ];
    const actualKeys = Object.keys(requestData);
    if (
      actualKeys.length !== requiredKeys.length ||
      !requiredKeys.every((k) => actualKeys.includes(k))
    ) {
      return { allowed: false, reason: 'schema_keys_violation' };
    }
    if (
      typeof requestData.title !== 'string' ||
      requestData.title.length < 1 ||
      requestData.title.length > 240
    ) {
      return { allowed: false, reason: 'invalid_title_bounds' };
    }
  }

  if (collection === 'taskPlans') {
    const requiredKeys = [
      'id',
      'ownerUid',
      'schemaVersion',
      'goalId',
      'goalTitle',
      'providerId',
      'status',
      'autoRunApprovedTypesOnly',
      'tasksJson',
      'taskCount',
      'supportedTaskCount',
      'createdAt',
      'updatedAt',
    ];
    const actualKeys = Object.keys(requestData);
    if (
      actualKeys.length !== requiredKeys.length ||
      !requiredKeys.every((k) => actualKeys.includes(k))
    ) {
      return { allowed: false, reason: 'schema_keys_violation' };
    }
  }

  if (collection === 'executionJobs') {
    const requiredKeys = [
      'id',
      'ownerUid',
      'schemaVersion',
      'planId',
      'taskId',
      'taskTitle',
      'taskType',
      'assignedAgentId',
      'assignedAgentName',
      'providerId',
      'status',
      'permissionConfirmed',
      'retryCount',
      'maxRetries',
      'sourceTranscriptExcerpt',
      'outputSummary',
      'errorMessage',
      'isSampleData',
      'createdAt',
      'updatedAt',
    ];
    const actualKeys = Object.keys(requestData);
    if (
      actualKeys.length !== requiredKeys.length ||
      !requiredKeys.every((k) => actualKeys.includes(k))
    ) {
      return { allowed: false, reason: 'schema_keys_violation' };
    }
  }

  if (collection === 'clipBriefs') {
    const requiredKeys = [
      'id',
      'ownerUid',
      'schemaVersion',
      'jobId',
      'planId',
      'taskId',
      'agentId',
      'clipTitle',
      'hookLine',
      'segmentTimestamp',
      'segmentQuote',
      'estimatedDurationSec',
      'aspectRatio',
      'captionDraft',
      'retentionRationale',
      'createdAt',
      'updatedAt',
    ];
    const actualKeys = Object.keys(requestData);
    if (
      actualKeys.length !== requiredKeys.length ||
      !requiredKeys.every((k) => actualKeys.includes(k))
    ) {
      return { allowed: false, reason: 'schema_keys_violation' };
    }
  }

  return { allowed: true, reason: 'valid_owner_mutation' };
}
