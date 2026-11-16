import {
  Agent,
  AgentCapabilityId,
  ClipBriefRecord,
  DelegatedTaskType,
  DelegationPlanRecord,
  DepartmentId,
  ExecutionJobRecord,
  Goal,
  ModelProviderId,
  PERSISTENCE_SCHEMA_VERSION,
  ProposedPlanTask,
} from '../types/mission';

/**
 * Only `clip_brief_generation` has a real executable worker in Phase 4.
 * All other task types may be planned by The Boss, edited, reassigned, and approved,
 * but the execution queue MUST NOT claim they have executed when their worker does not exist.
 */
export const SUPPORTED_REAL_WORKER_TASK_TYPES: readonly DelegatedTaskType[] = [
  'clip_brief_generation',
] as const;

export const VALID_DELEGATED_TASK_TYPES: readonly DelegatedTaskType[] = [
  'clip_brief_generation',
  'transcript_indexing',
  'video_reframe_spec',
  'caption_styling_spec',
  'quality_gate_audit',
  'growth_retention_plan',
  'creator_outreach_draft',
] as const;

export const MAX_JOB_RETRIES = 2;

/**
 * Declared capability matrix for all 15 MissionTown agents.
 * Used by the Assignment Engine to deterministically select suitable agents for each task type.
 */
export const AGENT_CAPABILITY_MATRIX: Record<string, AgentCapabilityId[]> = {
  'agent-boss': ['goal_decomposition', 'quality_gate_audit'],
  'agent-muse': ['clip_brief_generation', 'growth_retention_plan'],
  'agent-keys': ['transcript_indexing', 'clip_brief_generation'],
  'agent-atlas': ['clip_brief_generation', 'transcript_indexing'],
  'agent-pixel': ['video_reframe_spec'],
  'agent-ivy': ['caption_styling_spec'],
  'agent-critic': ['quality_gate_audit', 'clip_brief_generation'],
  'agent-patch': ['quality_gate_audit', 'video_reframe_spec'],
  'agent-giggles': ['growth_retention_plan', 'caption_styling_spec'],
  'agent-doodle': ['growth_retention_plan'],
  'agent-echo': ['growth_retention_plan', 'quality_gate_audit'],
  'agent-courier': ['growth_retention_plan'],
  'agent-closer': ['creator_outreach_draft'],
  'agent-biscuit': ['creator_outreach_draft'],
  'agent-calico': ['creator_outreach_draft', 'clip_brief_generation'],
};

export const TASK_TYPE_LABELS: Record<
  DelegatedTaskType,
  { label: string; defaultDepartmentId: DepartmentId; workerImplemented: boolean }
> = {
  clip_brief_generation: {
    label: 'Clip Brief Generator (Real AI Worker)',
    defaultDepartmentId: 'the-boss',
    workerImplemented: true,
  },
  transcript_indexing: {
    label: 'Transcript Word-Timestamp Indexing',
    defaultDepartmentId: 'content-studio',
    workerImplemented: false,
  },
  video_reframe_spec: {
    label: '9:16 Active-Speaker Reframe Spec',
    defaultDepartmentId: 'content-studio',
    workerImplemented: false,
  },
  caption_styling_spec: {
    label: 'Kinetic Caption Styling Spec',
    defaultDepartmentId: 'content-studio',
    workerImplemented: false,
  },
  quality_gate_audit: {
    label: 'Safe-Zone & Pacing Quality Gate',
    defaultDepartmentId: 'the-boss',
    workerImplemented: false,
  },
  growth_retention_plan: {
    label: 'Short-Form Hook & Retention Experiment',
    defaultDepartmentId: 'growth',
    workerImplemented: false,
  },
  creator_outreach_draft: {
    label: 'Creator Prospect Audition Pack Prep',
    defaultDepartmentId: 'sales-community',
    workerImplemented: false,
  },
};

export const SAMPLE_AUTHORIZED_TRANSCRIPT = `[00:04:12] HOST (Maya): Most podcasters think they need a 4-camera LA studio before they can post vertical clips. That's backwards. Our highest-performing reel last month came from a Zoom recording where the guest shared a single counter-intuitive pricing rule.
[00:04:39] GUEST (Devon): Exactly! When we raised our creator retainer from $600 to $1,800 a month, churn actually dropped to zero. Why? Because low-ticket clients debate every font choice, while serious founders only care if 3 clips a week bring qualified inbound leads.
[00:05:14] HOST (Maya): Let's break down the 3-second hook formula you used on that clip. You didn't start with "Welcome back to Episode 42." You started mid-sentence right on the tension point.
[00:05:38] GUEST (Devon): Rule number one: cut the throat-clearing. Start with a bold number or a broken assumption in the first 1.8 seconds, pair it with high-contrast 3-word kinetic subtitles above the TikTok UI safe zone, and end on an open loop at second 38.`;

export interface GoalValidationResult {
  valid: boolean;
  sanitizedGoalTitle: string;
  error?: string;
}

export function validateGoalForDelegation(goalTitle: string): GoalValidationResult {
  const trimmed = goalTitle.trim();
  if (trimmed.length < 5) {
    return {
      valid: false,
      sanitizedGoalTitle: trimmed,
      error: 'Company goal must be at least 5 characters before The Boss can generate a task plan.',
    };
  }
  if (trimmed.length > 240) {
    return {
      valid: false,
      sanitizedGoalTitle: trimmed.slice(0, 240),
      error: 'Company goal must not exceed 240 characters.',
    };
  }
  return {
    valid: true,
    sanitizedGoalTitle: trimmed,
  };
}

export interface TranscriptValidationResult {
  valid: boolean;
  sanitizedTranscript: string;
  excerpt: string;
  error?: string;
}

export function validateAuthorizedTranscriptInput(input: {
  transcriptText: string;
  permissionConfirmed: boolean;
}): TranscriptValidationResult {
  if (!input.permissionConfirmed) {
    return {
      valid: false,
      sanitizedTranscript: '',
      excerpt: '',
      error:
        'Explicit permission confirmation is required before processing any transcript or executing AI tasks.',
    };
  }

  const trimmed = input.transcriptText.trim();
  if (trimmed.length < 40) {
    return {
      valid: false,
      sanitizedTranscript: trimmed,
      excerpt: trimmed,
      error:
        'Authorized transcript must be at least 40 characters so the Clip Brief Generator can extract meaningful segments.',
    };
  }
  if (trimmed.length > 12000) {
    return {
      valid: false,
      sanitizedTranscript: trimmed.slice(0, 12000),
      excerpt: trimmed.slice(0, 220),
      error: 'Transcript exceeds the 12,000-character free-tier safety limit.',
    };
  }

  return {
    valid: true,
    sanitizedTranscript: trimmed,
    excerpt: trimmed.slice(0, 220),
  };
}

export function isSupportedRealWorkerTaskType(
  taskType: DelegatedTaskType
): boolean {
  return SUPPORTED_REAL_WORKER_TASK_TYPES.includes(taskType);
}

export function getAgentCapabilities(agentId: string): AgentCapabilityId[] {
  return AGENT_CAPABILITY_MATRIX[agentId] ?? [];
}

/**
 * Selects the best-fit agent for a given task type using declared capabilities.
 * Honors `preferredAgentId` if that agent exists in the roster.
 */
export function selectAgentForTaskType(
  taskType: DelegatedTaskType,
  agents: Agent[],
  preferredAgentId?: string
): Agent {
  if (agents.length === 0) {
    throw new Error('Cannot assign task: agent roster is empty.');
  }

  if (preferredAgentId) {
    const explicitMatch = agents.find((a) => a.id === preferredAgentId);
    if (explicitMatch) {
      return explicitMatch;
    }
  }

  // Primary capability match (first capability in agent's list matches taskType)
  const primaryMatch = agents.find((a) => {
    const caps = getAgentCapabilities(a.id);
    return caps[0] === taskType;
  });
  if (primaryMatch) {
    return primaryMatch;
  }

  // Secondary capability match (any capability in agent's list matches taskType)
  const secondaryMatch = agents.find((a) =>
    getAgentCapabilities(a.id).includes(taskType)
  );
  if (secondaryMatch) {
    return secondaryMatch;
  }

  // Fallback to The Boss or first agent
  return agents.find((a) => a.id === 'agent-boss') ?? agents[0];
}

export interface RawProposedTaskItem {
  id?: string;
  title?: string;
  description?: string;
  taskType?: string;
  preferredAgentId?: string;
  dependsOnTaskIds?: string[];
}

export interface RawStructuredPlanPayload {
  tasks?: RawProposedTaskItem[];
}

/**
 * Kahn's algorithm topological sort + cycle detector for task dependencies.
 */
export function computeTopologicalTaskOrder(tasks: ProposedPlanTask[]): {
  valid: boolean;
  orderedTaskIds: string[];
  error?: string;
} {
  const idSet = new Set(tasks.map((t) => t.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const t of tasks) {
    inDegree.set(t.id, 0);
    adjacency.set(t.id, []);
  }

  for (const t of tasks) {
    for (const depId of t.dependsOnTaskIds) {
      if (depId === t.id) {
        return {
          valid: false,
          orderedTaskIds: [],
          error: `Task "${t.id}" cannot depend on itself.`,
        };
      }
      if (!idSet.has(depId)) {
        return {
          valid: false,
          orderedTaskIds: [],
          error: `Task "${t.id}" references unknown dependency "${depId}".`,
        };
      }
      adjacency.get(depId)!.push(t.id);
      inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const t of tasks) {
    if ((inDegree.get(t.id) ?? 0) === 0) {
      queue.push(t.id);
    }
  }

  const orderedTaskIds: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    orderedTaskIds.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const nextDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (orderedTaskIds.length !== tasks.length) {
    return {
      valid: false,
      orderedTaskIds: [],
      error: 'Circular task dependency detected in proposed plan.',
    };
  }

  return {
    valid: true,
    orderedTaskIds,
  };
}

/**
 * Validates and normalizes a raw structured AI response into a safe DelegationPlanRecord
 * and ProposedPlanTask[] list. Rejects malformed or empty plans.
 */
export function validateAndNormalizeStructuredPlan(
  rawPayload: unknown,
  goal: Goal,
  agents: Agent[],
  providerId: ModelProviderId,
  ownerUid: string,
  nowMs: number = Date.now()
): {
  planRecord: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>;
  tasks: ProposedPlanTask[];
  executionOrder: string[];
} {
  const goalCheck = validateGoalForDelegation(goal.title);
  if (!goalCheck.valid) {
    throw new Error(goalCheck.error);
  }

  if (!rawPayload || typeof rawPayload !== 'object') {
    throw new Error('Structured AI plan response must be a valid JSON object.');
  }

  const candidate = rawPayload as RawStructuredPlanPayload;
  if (!Array.isArray(candidate.tasks) || candidate.tasks.length === 0) {
    throw new Error('Structured AI plan response must contain at least 1 task.');
  }
  if (candidate.tasks.length > 8) {
    throw new Error('Structured AI plan response cannot exceed 8 tasks per plan.');
  }

  const planId = `plan-${nowMs}`;

  const rawTasks = candidate.tasks;
  const normalizedIds = rawTasks.map((_, idx) => `ptask-${idx + 1}`);
  const rawIdMap = new Map<string, string>();
  rawTasks.forEach((rt, idx) => {
    const normId = normalizedIds[idx];
    rawIdMap.set(normId, normId);
    if (typeof rt.id === 'string' && rt.id.trim()) {
      rawIdMap.set(rt.id.trim(), normId);
    }
  });

  const proposedTasks: ProposedPlanTask[] = rawTasks.map((rt, idx) => {
    const normId = normalizedIds[idx];
    const rawType = typeof rt.taskType === 'string' ? rt.taskType.trim() : '';
    const taskType: DelegatedTaskType = (
      VALID_DELEGATED_TASK_TYPES as readonly string[]
    ).includes(rawType)
      ? (rawType as DelegatedTaskType)
      : idx === 0
      ? 'clip_brief_generation'
      : 'quality_gate_audit';

    const title =
      typeof rt.title === 'string' && rt.title.trim().length >= 3
        ? rt.title.trim().slice(0, 180)
        : `${TASK_TYPE_LABELS[taskType].label} for "${goalCheck.sanitizedGoalTitle.slice(0, 60)}"`;

    const description =
      typeof rt.description === 'string' && rt.description.trim().length >= 3
        ? rt.description.trim().slice(0, 360)
        : `Delegated by The Boss under goal: ${goalCheck.sanitizedGoalTitle.slice(0, 120)}`;

    const assignedAgent = selectAgentForTaskType(
      taskType,
      agents,
      typeof rt.preferredAgentId === 'string' ? rt.preferredAgentId : undefined
    );

    const mappedDeps: string[] = Array.isArray(rt.dependsOnTaskIds)
      ? Array.from(
          new Set(
            rt.dependsOnTaskIds
              .map((d) => (typeof d === 'string' ? rawIdMap.get(d.trim()) : undefined))
              .filter((d): d is string => Boolean(d) && d !== normId)
          )
        )
      : [];

    const isSupported = isSupportedRealWorkerTaskType(taskType);

    return {
      id: normId,
      planId,
      title,
      description,
      taskType,
      departmentId: assignedAgent.departmentId,
      assignedAgentId: assignedAgent.id,
      assignedAgentName: assignedAgent.name,
      requiredCapability: taskType,
      dependsOnTaskIds: mappedDeps,
      executionSupport: isSupported
        ? 'supported_real_worker'
        : 'unsupported_worker',
      status: 'proposed',
    };
  });

  // Ensure at least one task is the supported Clip Brief Generator worker
  if (!proposedTasks.some((t) => t.taskType === 'clip_brief_generation')) {
    const museAgent = selectAgentForTaskType('clip_brief_generation', agents);
    proposedTasks[0] = {
      ...proposedTasks[0],
      taskType: 'clip_brief_generation',
      departmentId: museAgent.departmentId,
      assignedAgentId: museAgent.id,
      assignedAgentName: museAgent.name,
      requiredCapability: 'clip_brief_generation',
      executionSupport: 'supported_real_worker',
    };
  }

  const topo = computeTopologicalTaskOrder(proposedTasks);
  if (!topo.valid) {
    throw new Error(topo.error ?? 'Invalid dependency graph in proposed plan.');
  }

  const supportedTaskCount = proposedTasks.filter(
    (t) => t.executionSupport === 'supported_real_worker'
  ).length;

  const planRecord: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'> = {
    id: planId,
    ownerUid: ownerUid || 'anonymous-session',
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    goalId: goal.id,
    goalTitle: goalCheck.sanitizedGoalTitle,
    providerId,
    status: 'waiting_for_approval',
    autoRunApprovedTypesOnly: true,
    tasksJson: JSON.stringify(proposedTasks),
    taskCount: proposedTasks.length,
    supportedTaskCount,
  };

  return {
    planRecord,
    tasks: proposedTasks,
    executionOrder: topo.orderedTaskIds,
  };
}

export function parseTasksFromPlanRecord(
  plan: Pick<DelegationPlanRecord, 'tasksJson'>
): ProposedPlanTask[] {
  try {
    const parsed = JSON.parse(plan.tasksJson);
    return Array.isArray(parsed) ? (parsed as ProposedPlanTask[]) : [];
  } catch {
    return [];
  }
}

/**
 * Allows manual editing of a proposed task's title, description, or assigned agent.
 */
export function updateProposedTaskInPlan(
  plan: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
  tasks: ProposedPlanTask[],
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    assignedAgentId?: string;
  },
  agents: Agent[]
): {
  planRecord: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>;
  tasks: ProposedPlanTask[];
} {
  const nextTasks = tasks.map((t) => {
    if (t.id !== taskId) return t;
    const nextTitle =
      updates.title !== undefined && updates.title.trim().length > 0
        ? updates.title.trim().slice(0, 180)
        : t.title;
    const nextDescription =
      updates.description !== undefined && updates.description.trim().length > 0
        ? updates.description.trim().slice(0, 360)
        : t.description;

    let nextAgentId = t.assignedAgentId;
    let nextAgentName = t.assignedAgentName;
    let nextDeptId = t.departmentId;

    if (updates.assignedAgentId) {
      const targetAgent = agents.find((a) => a.id === updates.assignedAgentId);
      if (targetAgent) {
        nextAgentId = targetAgent.id;
        nextAgentName = targetAgent.name;
        nextDeptId = targetAgent.departmentId;
      }
    }

    return {
      ...t,
      title: nextTitle,
      description: nextDescription,
      assignedAgentId: nextAgentId,
      assignedAgentName: nextAgentName,
      departmentId: nextDeptId,
    };
  });

  return {
    planRecord: {
      ...plan,
      tasksJson: JSON.stringify(nextTasks),
      taskCount: nextTasks.length,
      supportedTaskCount: nextTasks.filter(
        (t) => t.executionSupport === 'supported_real_worker'
      ).length,
    },
    tasks: nextTasks,
  };
}

/**
 * Transitions a proposed task plan from `waiting_for_approval` to `approved`.
 */
export function approveProposedTaskPlan(
  plan: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
  tasks: ProposedPlanTask[]
): {
  planRecord: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>;
  tasks: ProposedPlanTask[];
} {
  if (plan.status === 'rejected') {
    throw new Error('Cannot approve a rejected plan. Generate a new plan first.');
  }

  const topo = computeTopologicalTaskOrder(tasks);
  if (!topo.valid) {
    throw new Error(topo.error ?? 'Cannot approve plan with invalid dependencies.');
  }

  const nextTasks: ProposedPlanTask[] = tasks.map((t) => ({
    ...t,
    status: 'approved',
  }));

  return {
    planRecord: {
      ...plan,
      status: 'approved',
      tasksJson: JSON.stringify(nextTasks),
    },
    tasks: nextTasks,
  };
}

export interface QueueDispatchPlan {
  canExecute: boolean;
  error?: string;
  orderedTasks: ProposedPlanTask[];
  executableRealTasks: ProposedPlanTask[];
  unsupportedTasks: ProposedPlanTask[];
}

/**
 * Evaluates an approved plan for queue dispatch:
 * - Enforces approval before execution (`plan.status === 'approved'` or `'executing'` or `'completed'`)
 * - Enforces explicit transcript permission (`permissionConfirmed === true`)
 * - Orders tasks topologically by dependencies
 * - Separates supported `clip_brief_generation` tasks from unsupported tasks (never fabricates execution)
 */
export function evaluatePlanForQueueDispatch(
  plan: Pick<DelegationPlanRecord, 'id' | 'status'>,
  tasks: ProposedPlanTask[],
  permissionConfirmed: boolean
): QueueDispatchPlan {
  if (
    plan.status !== 'approved' &&
    plan.status !== 'executing' &&
    plan.status !== 'completed'
  ) {
    return {
      canExecute: false,
      error:
        'Plan is waiting for user approval. Please review and approve The Boss’s task plan before running workers.',
      orderedTasks: [],
      executableRealTasks: [],
      unsupportedTasks: [],
    };
  }

  if (!permissionConfirmed) {
    return {
      canExecute: false,
      error:
        'User permission confirmation is required before dispatching the Clip Brief Generator worker.',
      orderedTasks: [],
      executableRealTasks: [],
      unsupportedTasks: [],
    };
  }

  const topo = computeTopologicalTaskOrder(tasks);
  if (!topo.valid) {
    return {
      canExecute: false,
      error: topo.error,
      orderedTasks: [],
      executableRealTasks: [],
      unsupportedTasks: [],
    };
  }

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const orderedTasks = topo.orderedTaskIds
    .map((id) => taskMap.get(id))
    .filter((t): t is ProposedPlanTask => Boolean(t));

  const executableRealTasks = orderedTasks.filter((t) =>
    isSupportedRealWorkerTaskType(t.taskType)
  );
  const unsupportedTasks = orderedTasks.filter(
    (t) => !isSupportedRealWorkerTaskType(t.taskType)
  );

  if (executableRealTasks.length === 0) {
    return {
      canExecute: false,
      error:
        'No supported real worker tasks (`clip_brief_generation`) were found in this plan.',
      orderedTasks,
      executableRealTasks: [],
      unsupportedTasks,
    };
  }

  return {
    canExecute: true,
    orderedTasks,
    executableRealTasks,
    unsupportedTasks,
  };
}

export interface RawClipBriefCandidate {
  clipTitle?: string;
  hookLine?: string;
  segmentTimestamp?: string;
  segmentQuote?: string;
  estimatedDurationSec?: number;
  aspectRatio?: string;
  captionDraft?: string;
  retentionRationale?: string;
}

export interface RawClipBriefWorkerResponse {
  briefs?: RawClipBriefCandidate[];
}

/**
 * Validates the structured output from the Clip Brief Generator worker.
 */
export function validateClipBriefWorkerOutput(
  rawOutput: unknown,
  context: {
    jobId: string;
    planId: string;
    taskId: string;
    agentId: string;
    ownerUid: string;
  }
): Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>> {
  if (!rawOutput || typeof rawOutput !== 'object') {
    throw new Error('Clip Brief Generator returned a non-object response.');
  }

  const candidate = rawOutput as RawClipBriefWorkerResponse;
  if (!Array.isArray(candidate.briefs) || candidate.briefs.length === 0) {
    throw new Error(
      'Clip Brief Generator response must contain a non-empty `briefs` array.'
    );
  }

  return candidate.briefs.slice(0, 5).map((item, idx) => {
    const clipTitle =
      typeof item.clipTitle === 'string' && item.clipTitle.trim().length >= 3
        ? item.clipTitle.trim().slice(0, 140)
        : `Candidate Short Clip #${idx + 1}`;
    const hookLine =
      typeof item.hookLine === 'string' && item.hookLine.trim().length >= 5
        ? item.hookLine.trim().slice(0, 220)
        : '';
    const segmentTimestamp =
      typeof item.segmentTimestamp === 'string' &&
      item.segmentTimestamp.trim().length >= 3
        ? item.segmentTimestamp.trim().slice(0, 40)
        : `00:0${idx + 1}:00–00:0${idx + 1}:42`;
    const segmentQuote =
      typeof item.segmentQuote === 'string' && item.segmentQuote.trim().length >= 5
        ? item.segmentQuote.trim().slice(0, 400)
        : '';
    const captionDraft =
      typeof item.captionDraft === 'string' && item.captionDraft.trim().length >= 5
        ? item.captionDraft.trim().slice(0, 320)
        : '';
    const retentionRationale =
      typeof item.retentionRationale === 'string' &&
      item.retentionRationale.trim().length >= 5
        ? item.retentionRationale.trim().slice(0, 320)
        : 'Opens with high-tension claim and resolves within 45 seconds.';

    if (!hookLine || !segmentQuote || !captionDraft) {
      throw new Error(
        `Clip brief #${idx + 1} is missing required fields (hookLine, segmentQuote, or captionDraft).`
      );
    }

    const rawDuration =
      typeof item.estimatedDurationSec === 'number' &&
      Number.isFinite(item.estimatedDurationSec)
        ? Math.round(item.estimatedDurationSec)
        : 38;
    const estimatedDurationSec = Math.max(12, Math.min(90, rawDuration));

    const aspectRatio: ClipBriefRecord['aspectRatio'] =
      item.aspectRatio === '1:1' || item.aspectRatio === '16:9'
        ? item.aspectRatio
        : '9:16';

    return {
      id: `${context.jobId}-brief-${idx + 1}`,
      ownerUid: context.ownerUid || 'anonymous-session',
      schemaVersion: PERSISTENCE_SCHEMA_VERSION,
      jobId: context.jobId,
      planId: context.planId,
      taskId: context.taskId,
      agentId: context.agentId,
      clipTitle,
      hookLine,
      segmentTimestamp,
      segmentQuote,
      estimatedDurationSec,
      aspectRatio,
      captionDraft,
      retentionRationale,
    };
  });
}

/**
 * Evaluates whether a failed execution job can be safely retried within bounded limits.
 */
export function prepareExecutionJobRetry(
  job: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>
): {
  canRetry: boolean;
  updatedJob?: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>;
  error?: string;
} {
  if (job.status !== 'failed') {
    return {
      canRetry: false,
      error: `Only failed jobs can be retried (current status: ${job.status}).`,
    };
  }
  if (job.retryCount >= job.maxRetries) {
    return {
      canRetry: false,
      error: `Retry limit reached (${job.retryCount}/${job.maxRetries}). Inspect provider status or edit input before creating a new job.`,
    };
  }

  return {
    canRetry: true,
    updatedJob: {
      ...job,
      status: 'queued',
      retryCount: job.retryCount + 1,
      errorMessage: '',
    },
  };
}

/**
 * Built-in Zero-Cost Deterministic Local Planner (used ONLY when `deterministic_local`
 * is explicitly chosen by the user — never silently substituted for Ollama or Gemini).
 */
export function buildDeterministicPlanPayload(
  goalTitle: string
): RawStructuredPlanPayload {
  const cleanGoal = goalTitle.trim();
  return {
    tasks: [
      {
        id: 'ptask-1',
        title: `Extract 3 high-retention short-form clip briefs aligned with: "${cleanGoal.slice(0, 70)}"`,
        description:
          'Scans the authorized transcript for contrarian hooks, timestamps, pull-quotes, and 9:16 kinetic caption drafts.',
        taskType: 'clip_brief_generation',
        preferredAgentId: 'agent-muse',
        dependsOnTaskIds: [],
      },
      {
        id: 'ptask-2',
        title: 'Prepare 9:16 active-speaker vertical crop & split-screen framing spec',
        description:
          'Defines bounding-box camera cuts for the extracted clip timestamps (Planned Phase 5 video worker).',
        taskType: 'video_reframe_spec',
        preferredAgentId: 'agent-pixel',
        dependsOnTaskIds: ['ptask-1'],
      },
      {
        id: 'ptask-3',
        title: 'Audit hook pacing & TikTok/Reels UI safe-zone margins',
        description:
          'Verifies that opening hooks land within 2.5 seconds and captions clear right-rail overlays (Planned quality worker).',
        taskType: 'quality_gate_audit',
        preferredAgentId: 'agent-critic',
        dependsOnTaskIds: ['ptask-1'],
      },
      {
        id: 'ptask-4',
        title: 'Package 3-clip prospect audition reel for creator outreach',
        description:
          'Stages approved clip briefs into a creator pitch sequence (Planned outreach worker — requires explicit publishing permission).',
        taskType: 'creator_outreach_draft',
        preferredAgentId: 'agent-closer',
        dependsOnTaskIds: ['ptask-2', 'ptask-3'],
      },
    ],
  };
}

/**
 * Built-in Zero-Cost Deterministic Clip Brief Extractor (used ONLY when `deterministic_local`
 * is explicitly chosen by the user). Parses actual sentences and timestamps from the user's transcript.
 */
export function buildDeterministicClipBriefsPayload(
  transcriptText: string,
  goalTitle: string
): RawClipBriefWorkerResponse {
  const lines = transcriptText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  const sentences =
    lines.length >= 3
      ? lines
      : transcriptText
          .split(/(?<=[.!?])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 15);

  const extractTimestamp = (text: string, fallbackIndex: number): string => {
    const match = text.match(/\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/);
    if (match) {
      return `${match[1]} (+38s)`;
    }
    return `Segment #${fallbackIndex + 1} (00:0${fallbackIndex + 1}:10–00:0${fallbackIndex + 1}:48)`;
  };

  const cleanSpeakerAndTime = (text: string): string =>
    text
      .replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/g, '')
      .replace(/^[A-Z0-9 _()-]{2,25}:\s*/i, '')
      .trim();

  const segments = [
    sentences[0] ?? transcriptText.slice(0, 180),
    sentences[Math.min(1, sentences.length - 1)] ?? transcriptText.slice(0, 180),
    sentences[Math.min(2, sentences.length - 1)] ??
      sentences[sentences.length - 1] ??
      transcriptText.slice(0, 180),
  ];

  const hookPrefixes = [
    'Counter-Intuitive Truth:',
    'High-Tension Breakdown:',
    'Actionable Playbook:',
  ];

  return {
    briefs: segments.map((rawSeg, idx) => {
      const cleanQuote = cleanSpeakerAndTime(rawSeg).slice(0, 320);
      const firstClause = cleanQuote.split(/[.!?]/)[0]?.trim() || cleanQuote.slice(0, 90);
      const timestamp = extractTimestamp(rawSeg, idx);

      return {
        clipTitle: `${hookPrefixes[idx]} ${firstClause.slice(0, 64)}`,
        hookLine: `"${firstClause.slice(0, 140)}"`,
        segmentTimestamp: timestamp,
        segmentQuote: cleanQuote,
        estimatedDurationSec: 34 + idx * 5,
        aspectRatio: '9:16',
        captionDraft: `[9:16 KINETIC CAPTION] ${firstClause.toUpperCase().slice(0, 85)} — "${cleanQuote.slice(0, 150)}"`,
        retentionRationale: `Selected for goal "${goalTitle.slice(0, 65)}": opens immediately on a concrete claim without intro fluff and fits a ${34 + idx * 5}s vertical retention arc.`,
      };
    }),
  };
}
