import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_COMPANY_REPOSITORY } from '../data/demoCompanyData';
import {
  approveProposedTaskPlan,
  buildDeterministicClipBriefsPayload,
  buildDeterministicPlanPayload,
  computeTopologicalTaskOrder,
  evaluatePlanForQueueDispatch,
  isSupportedRealWorkerTaskType,
  MAX_JOB_RETRIES,
  prepareExecutionJobRetry,
  SAMPLE_AUTHORIZED_TRANSCRIPT,
  selectAgentForTaskType,
  updateProposedTaskInPlan,
  validateAndNormalizeStructuredPlan,
  validateAuthorizedTranscriptInput,
  validateClipBriefWorkerOutput,
  validateGoalForDelegation,
} from './orchestrationLogic';

test('validateGoalForDelegation rejects short or oversized goals and accepts valid company goals', () => {
  assert.equal(validateGoalForDelegation('   ').valid, false);
  assert.equal(validateGoalForDelegation('abc').valid, false);
  assert.equal(validateGoalForDelegation('x'.repeat(250)).valid, false);

  const valid = validateGoalForDelegation(
    '  Grow my clipping service to 10 paying creators.  '
  );
  assert.equal(valid.valid, true);
  assert.equal(
    valid.sanitizedGoalTitle,
    'Grow my clipping service to 10 paying creators.'
  );
});

test('validateAuthorizedTranscriptInput enforces explicit permissionConfirmed and length bounds', () => {
  const withoutPermission = validateAuthorizedTranscriptInput({
    transcriptText: SAMPLE_AUTHORIZED_TRANSCRIPT,
    permissionConfirmed: false,
  });
  assert.equal(withoutPermission.valid, false);
  assert.match(withoutPermission.error ?? '', /permission confirmation/i);

  const tooShort = validateAuthorizedTranscriptInput({
    transcriptText: 'Too short transcript.',
    permissionConfirmed: true,
  });
  assert.equal(tooShort.valid, false);

  const valid = validateAuthorizedTranscriptInput({
    transcriptText: SAMPLE_AUTHORIZED_TRANSCRIPT,
    permissionConfirmed: true,
  });
  assert.equal(valid.valid, true);
  assert.ok(valid.sanitizedTranscript.length > 100);
});

test('selectAgentForTaskType assigns agents based on declared capabilities', () => {
  const agents = DEMO_COMPANY_REPOSITORY.agents;

  const clipBriefAgent = selectAgentForTaskType('clip_brief_generation', agents);
  assert.equal(clipBriefAgent.id, 'agent-muse');

  const reframeAgent = selectAgentForTaskType('video_reframe_spec', agents);
  assert.equal(reframeAgent.id, 'agent-pixel');

  const captionAgent = selectAgentForTaskType('caption_styling_spec', agents);
  assert.equal(captionAgent.id, 'agent-ivy');

  const outreachAgent = selectAgentForTaskType('creator_outreach_draft', agents);
  assert.equal(outreachAgent.id, 'agent-closer');

  // Honors explicit preferredAgentId override
  const overridden = selectAgentForTaskType(
    'clip_brief_generation',
    agents,
    'agent-keys'
  );
  assert.equal(overridden.id, 'agent-keys');
});

test('computeTopologicalTaskOrder sorts DAG dependencies and detects cycles', () => {
  const rawPayload = buildDeterministicPlanPayload(
    DEMO_COMPANY_REPOSITORY.initialGoal.title
  );
  const { tasks, executionOrder } = validateAndNormalizeStructuredPlan(
    rawPayload,
    DEMO_COMPANY_REPOSITORY.initialGoal,
    DEMO_COMPANY_REPOSITORY.agents,
    'deterministic_local',
    'user-123',
    1700000000000
  );

  assert.equal(executionOrder[0], 'ptask-1');
  assert.equal(executionOrder[executionOrder.length - 1], 'ptask-4');

  // Introduce a circular dependency ptask-1 -> ptask-4
  const cyclicTasks = tasks.map((t) =>
    t.id === 'ptask-1' ? { ...t, dependsOnTaskIds: ['ptask-4'] } : t
  );
  const cycleCheck = computeTopologicalTaskOrder(cyclicTasks);
  assert.equal(cycleCheck.valid, false);
  assert.match(cycleCheck.error ?? '', /Circular task dependency/i);
});

test('updateProposedTaskInPlan allows manual task title editing and agent reassignment', () => {
  const rawPayload = buildDeterministicPlanPayload(
    DEMO_COMPANY_REPOSITORY.initialGoal.title
  );
  const { planRecord, tasks } = validateAndNormalizeStructuredPlan(
    rawPayload,
    DEMO_COMPANY_REPOSITORY.initialGoal,
    DEMO_COMPANY_REPOSITORY.agents,
    'deterministic_local',
    'user-123',
    1700000000000
  );

  assert.equal(planRecord.status, 'waiting_for_approval');
  assert.equal(tasks[0].assignedAgentId, 'agent-muse');

  const updated = updateProposedTaskInPlan(
    planRecord,
    tasks,
    'ptask-1',
    {
      title: 'Custom edited clip brief task title',
      assignedAgentId: 'agent-atlas',
    },
    DEMO_COMPANY_REPOSITORY.agents
  );

  assert.equal(updated.tasks[0].title, 'Custom edited clip brief task title');
  assert.equal(updated.tasks[0].assignedAgentId, 'agent-atlas');
  assert.equal(updated.tasks[0].assignedAgentName, 'Atlas');
});

test('evaluatePlanForQueueDispatch blocks unapproved plans and separates supported vs unsupported workers honestly', () => {
  const rawPayload = buildDeterministicPlanPayload(
    DEMO_COMPANY_REPOSITORY.initialGoal.title
  );
  const { planRecord, tasks } = validateAndNormalizeStructuredPlan(
    rawPayload,
    DEMO_COMPANY_REPOSITORY.initialGoal,
    DEMO_COMPANY_REPOSITORY.agents,
    'deterministic_local',
    'user-123',
    1700000000000
  );

  // 1. Blocked while waiting_for_approval
  const beforeApproval = evaluatePlanForQueueDispatch(planRecord, tasks, true);
  assert.equal(beforeApproval.canExecute, false);
  assert.match(beforeApproval.error ?? '', /waiting for user approval/i);

  // 2. Approve the plan
  const approved = approveProposedTaskPlan(planRecord, tasks);
  assert.equal(approved.planRecord.status, 'approved');

  // 3. Blocked if permissionConfirmed is false
  const withoutPermission = evaluatePlanForQueueDispatch(
    approved.planRecord,
    approved.tasks,
    false
  );
  assert.equal(withoutPermission.canExecute, false);

  // 4. Dispatches only supported `clip_brief_generation` worker when approved + permissionConfirmed
  const dispatchPlan = evaluatePlanForQueueDispatch(
    approved.planRecord,
    approved.tasks,
    true
  );
  assert.equal(dispatchPlan.canExecute, true);
  assert.equal(dispatchPlan.executableRealTasks.length, 1);
  assert.equal(
    dispatchPlan.executableRealTasks[0].taskType,
    'clip_brief_generation'
  );
  assert.equal(dispatchPlan.unsupportedTasks.length, 3);
  for (const unsupported of dispatchPlan.unsupportedTasks) {
    assert.equal(isSupportedRealWorkerTaskType(unsupported.taskType), false);
    assert.equal(unsupported.executionSupport, 'unsupported_worker');
  }
});

test('validateClipBriefWorkerOutput validates structured candidate clip briefs and rejects malformed output', () => {
  const rawBriefs = buildDeterministicClipBriefsPayload(
    SAMPLE_AUTHORIZED_TRANSCRIPT,
    'Grow my clipping service to 10 paying creators.'
  );

  const records = validateClipBriefWorkerOutput(rawBriefs, {
    jobId: 'job-101',
    planId: 'plan-101',
    taskId: 'ptask-1',
    agentId: 'agent-muse',
    ownerUid: 'user-123',
  });

  assert.equal(records.length, 3);
  assert.equal(records[0].aspectRatio, '9:16');
  assert.ok(records[0].hookLine.length > 10);
  assert.ok(records[0].captionDraft.includes('[9:16 KINETIC CAPTION]'));

  assert.throws(() =>
    validateClipBriefWorkerOutput(
      { briefs: [] },
      {
        jobId: 'job-101',
        planId: 'plan-101',
        taskId: 'ptask-1',
        agentId: 'agent-muse',
        ownerUid: 'user-123',
      }
    )
  );
});

test('prepareExecutionJobRetry enforces bounded retries and rejects non-failed or exhausted jobs', () => {
  const baseJob = {
    id: 'job-200',
    ownerUid: 'user-123',
    schemaVersion: 1,
    planId: 'plan-200',
    taskId: 'ptask-1',
    taskTitle: 'Extract clip briefs',
    taskType: 'clip_brief_generation' as const,
    assignedAgentId: 'agent-muse',
    assignedAgentName: 'Muse',
    providerId: 'ollama_local' as const,
    status: 'failed' as const,
    permissionConfirmed: true,
    retryCount: 0,
    maxRetries: MAX_JOB_RETRIES,
    sourceTranscriptExcerpt: 'Sample transcript excerpt',
    outputSummary: '',
    errorMessage: 'Local Ollama connection refused on 127.0.0.1:11434',
    isSampleData: false,
  };

  const firstRetry = prepareExecutionJobRetry(baseJob);
  assert.equal(firstRetry.canRetry, true);
  assert.equal(firstRetry.updatedJob?.retryCount, 1);
  assert.equal(firstRetry.updatedJob?.status, 'queued');

  const exhaustedJob = { ...baseJob, retryCount: MAX_JOB_RETRIES };
  const exhaustedRetry = prepareExecutionJobRetry(exhaustedJob);
  assert.equal(exhaustedRetry.canRetry, false);
  assert.match(exhaustedRetry.error ?? '', /Retry limit reached/i);
});
