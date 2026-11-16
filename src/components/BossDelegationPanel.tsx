import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  FileText,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  ActivityEvent,
  Agent,
  AuthUserSummary,
  ClipBriefRecord,
  DelegationPlanRecord,
  ExecutionJobRecord,
  Goal,
  ModelProviderId,
  PERSISTENCE_SCHEMA_VERSION,
  ProposedPlanTask,
  ProviderStatusInfo,
} from '../types/mission';
import {
  executeClipBriefGeneratorWorker,
  fetchOrchestratorProviders,
  requestBossTaskPlan,
} from '../services/orchestratorClient';
import {
  approveProposedTaskPlan,
  evaluatePlanForQueueDispatch,
  getAgentCapabilities,
  MAX_JOB_RETRIES,
  parseTasksFromPlanRecord,
  prepareExecutionJobRetry,
  SAMPLE_AUTHORIZED_TRANSCRIPT,
  TASK_TYPE_LABELS,
  updateProposedTaskInPlan,
} from '../utils/orchestrationLogic';

interface BossDelegationPanelProps {
  goal: Goal;
  agents: Agent[];
  authUser: AuthUserSummary | null;
  initialPlans: DelegationPlanRecord[];
  initialJobs: ExecutionJobRecord[];
  initialClipBriefs: ClipBriefRecord[];
  onRecordRealActivity: (event: ActivityEvent) => void;
  onPersistPlan?: (
    plan: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
    event?: ActivityEvent
  ) => Promise<void>;
  onPersistJobBundle?: (
    job: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>,
    briefs: Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>>,
    plan?: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>,
    event?: ActivityEvent
  ) => Promise<void>;
  onSelectAgentOnIsland?: (agentId: string) => void;
}

export const BossDelegationPanel: React.FC<BossDelegationPanelProps> = ({
  goal,
  agents,
  authUser,
  initialPlans,
  initialJobs,
  initialClipBriefs,
  onRecordRealActivity,
  onPersistPlan,
  onPersistJobBundle,
  onSelectAgentOnIsland,
}) => {
  const [providers, setProviders] = useState<ProviderStatusInfo[]>([]);
  const [selectedProviderId, setSelectedProviderId] =
    useState<ModelProviderId>('deterministic_local');
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(false);

  const [activePlan, setActivePlan] = useState<
    Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'> | null
  >(null);
  const [planTasks, setPlanTasks] = useState<ProposedPlanTask[]>([]);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  const [transcriptText, setTranscriptText] = useState<string>(
    SAMPLE_AUTHORIZED_TRANSCRIPT
  );
  const [permissionConfirmed, setPermissionConfirmed] =
    useState<boolean>(false);

  const [latestJob, setLatestJob] = useState<
    Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'> | null
  >(null);
  const [clipBriefs, setClipBriefs] = useState<
    Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>>
  >([]);
  const [isExecutingWorker, setIsExecutingWorker] = useState<boolean>(false);
  const [orchestrationError, setOrchestrationError] = useState<string | null>(
    null
  );
  const [orchestrationNotice, setOrchestrationNotice] = useState<string | null>(
    null
  );

  // Hydrate from persisted Firestore records when signed-in user loads workspace
  useEffect(() => {
    if (initialPlans.length > 0 && !activePlan) {
      const mostRecentPlan = initialPlans[initialPlans.length - 1];
      setActivePlan(mostRecentPlan);
      setPlanTasks(parseTasksFromPlanRecord(mostRecentPlan));
    }
    if (initialJobs.length > 0 && !latestJob) {
      setLatestJob(initialJobs[initialJobs.length - 1]);
    }
    if (initialClipBriefs.length > 0 && clipBriefs.length === 0) {
      setClipBriefs(initialClipBriefs);
    }
  }, [initialPlans, initialJobs, initialClipBriefs, activePlan, latestJob, clipBriefs.length]);

  const refreshProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const catalog = await fetchOrchestratorProviders();
      setProviders(catalog.providers);
    } catch (err) {
      setOrchestrationError(
        err instanceof Error
          ? err.message
          : 'Unable to inspect model providers.'
      );
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    void refreshProviders();
  }, []);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  const handleProposePlan = async () => {
    setIsPlanning(true);
    setOrchestrationError(null);
    setOrchestrationNotice(null);
    try {
      const result = await requestBossTaskPlan({
        goal,
        agents,
        providerId: selectedProviderId,
        ownerUid: authUser?.uid || 'anonymous-session',
      });

      setActivePlan(result.planRecord);
      setPlanTasks(result.tasks);
      setProviders((prev) =>
        prev.map((p) =>
          p.id === result.providerStatus.id ? result.providerStatus : p
        )
      );

      const bossEvent: ActivityEvent = {
        id: `evt-plan-${Date.now()}`,
        fromAgentName: 'The Boss',
        toAgentName: 'Mission Control',
        fromAgentId: 'agent-boss',
        departmentId: 'the-boss',
        destinationLabel: 'The Boss HQ',
        message: `[REAL PLAN] Proposed ${result.tasks.length}-task delegation plan for "${goal.title.slice(0, 55)}" (Waiting for Approval)`,
        timestampLabel: 'Live · Just now',
        createdAt: Date.now(),
        status: 'completed',
        eventType: 'milestone',
        isSampleData: false,
      };
      onRecordRealActivity(bossEvent);

      if (authUser && onPersistPlan) {
        await onPersistPlan(result.planRecord, bossEvent);
      }

      setOrchestrationNotice(
        `The Boss proposed ${result.tasks.length} dependency-ordered tasks using ${result.providerStatus.name}. Review, edit, or reassign tasks below, then click "Approve Plan for Execution".`
      );
    } catch (err) {
      setOrchestrationError(
        err instanceof Error ? err.message : 'Failed to generate task plan.'
      );
    } finally {
      setIsPlanning(false);
    }
  };

  const handleUpdateTaskField = (
    taskId: string,
    updates: { title?: string; assignedAgentId?: string }
  ) => {
    if (!activePlan) return;
    const updated = updateProposedTaskInPlan(
      activePlan,
      planTasks,
      taskId,
      updates,
      agents
    );
    setActivePlan(updated.planRecord);
    setPlanTasks(updated.tasks);
  };

  const handleApprovePlan = async () => {
    if (!activePlan) return;
    setOrchestrationError(null);
    try {
      const approved = approveProposedTaskPlan(activePlan, planTasks);
      setActivePlan(approved.planRecord);
      setPlanTasks(approved.tasks);

      const approvalEvent: ActivityEvent = {
        id: `evt-approve-${Date.now()}`,
        fromAgentName: 'The Boss',
        toAgentName: approved.tasks[0]?.assignedAgentName || 'Muse',
        fromAgentId: 'agent-boss',
        toAgentId: approved.tasks[0]?.assignedAgentId || 'agent-muse',
        departmentId: 'the-boss',
        destinationLabel: 'The Boss HQ',
        message: `[REAL APPROVAL] User approved task plan (${approved.tasks.length} tasks). Supported worker "Clip Brief Generator" unlocked for dispatch.`,
        timestampLabel: 'Live · Just now',
        createdAt: Date.now(),
        status: 'completed',
        eventType: 'quality_gate',
        isSampleData: false,
      };
      onRecordRealActivity(approvalEvent);

      if (authUser && onPersistPlan) {
        await onPersistPlan(approved.planRecord, approvalEvent);
      }

      setOrchestrationNotice(
        'Plan approved! Confirm transcript authorization below and click "Dispatch Approved Queue" to run the Clip Brief Generator worker.'
      );
    } catch (err) {
      setOrchestrationError(
        err instanceof Error ? err.message : 'Could not approve task plan.'
      );
    }
  };

  const handleRejectPlan = () => {
    setActivePlan(null);
    setPlanTasks([]);
    setOrchestrationError(null);
    setOrchestrationNotice('Proposed plan cleared. You can generate a fresh plan at any time.');
  };

  const runClipBriefWorkerJob = async (
    existingRetryJob?: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'>
  ) => {
    if (!activePlan) {
      setOrchestrationError('Please generate and approve a task plan first.');
      return;
    }

    const dispatchEval = evaluatePlanForQueueDispatch(
      activePlan,
      planTasks,
      permissionConfirmed
    );
    if (!dispatchEval.canExecute) {
      setOrchestrationError(dispatchEval.error ?? 'Cannot dispatch queue.');
      return;
    }

    const primaryTask = dispatchEval.executableRealTasks[0];
    const jobId = existingRetryJob?.id || `job-${Date.now()}`;
    const retryCount = existingRetryJob ? existingRetryJob.retryCount : 0;

    setIsExecutingWorker(true);
    setOrchestrationError(null);
    setOrchestrationNotice(null);

    // Mark supported task as running and unsupported tasks honestly as `unsupported_skipped`
    const runningTasks: ProposedPlanTask[] = planTasks.map((t) =>
      t.id === primaryTask.id
        ? { ...t, status: 'running' }
        : t.executionSupport === 'unsupported_worker'
        ? { ...t, status: 'unsupported_skipped' }
        : t
    );
    setPlanTasks(runningTasks);

    try {
      const workerResult = await executeClipBriefGeneratorWorker({
        goalTitle: goal.title,
        transcriptText,
        permissionConfirmed,
        planApproved:
          activePlan.status === 'approved' ||
          activePlan.status === 'executing' ||
          activePlan.status === 'completed',
        planId: activePlan.id,
        taskId: primaryTask.id,
        agentId: primaryTask.assignedAgentId,
        jobId,
        providerId: selectedProviderId,
        ownerUid: authUser?.uid || 'anonymous-session',
      });

      const completedTasks: ProposedPlanTask[] = runningTasks.map((t) =>
        t.id === primaryTask.id ? { ...t, status: 'completed' } : t
      );
      const completedPlan: Omit<
        DelegationPlanRecord,
        'createdAt' | 'updatedAt'
      > = {
        ...activePlan,
        status: 'completed',
        providerId: selectedProviderId,
        tasksJson: JSON.stringify(completedTasks),
      };

      const completedJob: Omit<
        ExecutionJobRecord,
        'createdAt' | 'updatedAt'
      > = {
        id: jobId,
        ownerUid: authUser?.uid || 'anonymous-session',
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        planId: activePlan.id,
        taskId: primaryTask.id,
        taskTitle: primaryTask.title,
        taskType: primaryTask.taskType,
        assignedAgentId: primaryTask.assignedAgentId,
        assignedAgentName: primaryTask.assignedAgentName,
        providerId: selectedProviderId,
        status: 'completed',
        permissionConfirmed: true,
        retryCount,
        maxRetries: MAX_JOB_RETRIES,
        sourceTranscriptExcerpt: workerResult.transcriptExcerpt,
        outputSummary: `Generated ${workerResult.briefs.length} validated 9:16 short-form clip briefs via ${workerResult.providerStatus.name}. (${dispatchEval.unsupportedTasks.length} downstream tasks remain Planned Only — workers not yet implemented).`,
        errorMessage: '',
        isSampleData: false,
      };

      setActivePlan(completedPlan);
      setPlanTasks(completedTasks);
      setLatestJob(completedJob);
      setClipBriefs(workerResult.briefs);
      setProviders((prev) =>
        prev.map((p) =>
          p.id === workerResult.providerStatus.id
            ? workerResult.providerStatus
            : p
        )
      );

      const executionEvent: ActivityEvent = {
        id: `evt-job-${Date.now()}`,
        fromAgentName: primaryTask.assignedAgentName,
        toAgentName: 'The Boss',
        fromAgentId: primaryTask.assignedAgentId,
        toAgentId: 'agent-boss',
        departmentId: primaryTask.departmentId,
        destinationLabel: 'The Boss HQ',
        message: `[REAL JOB COMPLETED] ${primaryTask.assignedAgentName} generated ${workerResult.briefs.length} candidate clip briefs from authorized transcript.`,
        timestampLabel: 'Live · Just now',
        createdAt: Date.now(),
        status: 'completed',
        eventType: 'clip_spec',
        isSampleData: false,
      };
      onRecordRealActivity(executionEvent);

      if (authUser && onPersistJobBundle) {
        await onPersistJobBundle(
          completedJob,
          workerResult.briefs,
          completedPlan,
          executionEvent
        );
      }

      setOrchestrationNotice(
        `Clip Brief Generator completed! ${workerResult.briefs.length} candidate short-form clip briefs validated. Downstream tasks (${dispatchEval.unsupportedTasks.length}) were honestly skipped because their Phase 5+ workers are not implemented yet.`
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Clip Brief Generator execution failed.';

      const failedTasks: ProposedPlanTask[] = runningTasks.map((t) =>
        t.id === primaryTask.id ? { ...t, status: 'failed' } : t
      );
      const failedJob: Omit<ExecutionJobRecord, 'createdAt' | 'updatedAt'> = {
        id: jobId,
        ownerUid: authUser?.uid || 'anonymous-session',
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        planId: activePlan.id,
        taskId: primaryTask.id,
        taskTitle: primaryTask.title,
        taskType: primaryTask.taskType,
        assignedAgentId: primaryTask.assignedAgentId,
        assignedAgentName: primaryTask.assignedAgentName,
        providerId: selectedProviderId,
        status: 'failed',
        permissionConfirmed,
        retryCount,
        maxRetries: MAX_JOB_RETRIES,
        sourceTranscriptExcerpt: transcriptText.slice(0, 200),
        outputSummary: '',
        errorMessage: errorMsg,
        isSampleData: false,
      };

      setPlanTasks(failedTasks);
      setLatestJob(failedJob);
      setOrchestrationError(errorMsg);
    } finally {
      setIsExecutingWorker(false);
    }
  };

  const handleRetryFailedJob = async () => {
    if (!latestJob) return;
    const retryCheck = prepareExecutionJobRetry(latestJob);
    if (!retryCheck.canRetry || !retryCheck.updatedJob) {
      setOrchestrationError(retryCheck.error ?? 'Cannot retry job.');
      return;
    }
    await runClipBriefWorkerJob(retryCheck.updatedJob);
  };

  return (
    <div
      id="delegation-studio"
      data-testid="boss-delegation-panel"
      className="mt-8 rounded-3xl bg-[#12161E] border border-[#E5C158]/30 p-6 sm:p-8 shadow-2xl"
    >
      {/* Header & Zero-Cost Architecture Guarantee */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#E5C158] text-[#0B0B0C] text-[11px] font-extrabold uppercase tracking-wider">
              Phase 4 · Real Orchestration
            </span>
            <span
              data-testid="zero-cost-policy-badge"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#34D399]/15 border border-[#34D399]/35 text-[#34D399] text-[11px] font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Cost-First · No Silent Paid Fallback</span>
            </span>
          </div>
          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#F5F2EB] tracking-tight">
            The Boss — Automatic Task Delegation &amp; Clip Brief Worker
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-[#F5F2EB]/70 max-w-3xl">
            Assign your company goal once. The Boss proposes a dependency-ordered
            task plan and selects agents by declared capability. Review, edit, or
            reassign tasks before approving execution. Only implemented workers (
            <code className="text-[#E5C158] font-mono-tabular">
              Clip Brief Generator
            </code>
            ) are dispatched.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="propose-plan-button"
            disabled={isPlanning}
            onClick={() => void handleProposePlan()}
            className="px-4 py-2.5 rounded-xl bg-[#E5C158] hover:bg-[#edd071] text-[#0B0B0C] text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPlanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Planning Goal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Have The Boss Propose Task Plan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Provider Interface & Explicit Quota Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F5F2EB]/85 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-[#E5C158]" />
            <span>Select Model Provider (Common Provider Interface)</span>
          </div>
          <button
            type="button"
            onClick={() => void refreshProviders()}
            disabled={isLoadingProviders}
            className="text-xs font-semibold text-[#E5C158] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingProviders ? 'animate-spin' : ''}`}
            />
            <span>Refresh Provider Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {providers.map((prov) => {
            const isSelected = selectedProviderId === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                data-testid={`provider-option-${prov.id}`}
                onClick={() => {
                  setSelectedProviderId(prov.id);
                  setOrchestrationError(null);
                }}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A2432] border-[#E5C158] ring-1 ring-[#E5C158]'
                    : 'bg-[#0B0B0C]/75 border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                    {prov.name}
                  </span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      prov.available
                        ? 'bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {prov.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="mt-1.5 text-[11px] font-mono-tabular text-[#E5C158]">
                  {prov.endpointOrModel}
                </div>

                <p className="mt-1.5 text-[11px] text-[#F5F2EB]/70 leading-relaxed">
                  {prov.statusDetail}
                </p>

                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10.5px] font-mono-tabular text-[#F5F2EB]/60">
                  <span>
                    Session Quota: {prov.sessionCallsUsed} / {prov.sessionCallsLimit}
                  </span>
                  <span>
                    {prov.requiresLocalWorker
                      ? 'Local Worker Required'
                      : 'Zero Paid Billing'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status / Error Banners */}
      {orchestrationError && (
        <div
          data-testid="orchestration-error-banner"
          role="alert"
          className="mt-5 p-4 rounded-2xl bg-rose-950/80 border border-rose-400/40 text-xs sm:text-sm text-rose-100 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Provider / Execution Report: </strong>
              <span>{orchestrationError}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOrchestrationError(null)}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {orchestrationNotice && (
        <div
          data-testid="orchestration-notice-banner"
          role="status"
          className="mt-5 p-4 rounded-2xl bg-[#162836]/90 border border-[#34D399]/40 text-xs sm:text-sm text-[#F5F2EB] flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
          <span>{orchestrationNotice}</span>
        </div>
      )}

      {/* Proposed / Approved Task Plan & User Control Table */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 rounded-2xl bg-[#0B0B0C]/80 border border-white/10 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-extrabold text-white">
                  1. Proposed Task Plan &amp; Agent Capabilities
                </h4>
                {activePlan && (
                  <span
                    data-testid="plan-status-badge"
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      activePlan.status === 'waiting_for_approval'
                        ? 'bg-[#E5C158]/20 text-[#E5C158] border border-[#E5C158]/40'
                        : activePlan.status === 'approved' ||
                          activePlan.status === 'completed'
                        ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40'
                        : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {activePlan.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#F5F2EB]/65">
                Goal:{' '}
                <span className="text-[#F5F2EB] font-semibold">
                  &ldquo;{goal.title}&rdquo;
                </span>
              </p>
            </div>

            {activePlan && (
              <div className="flex items-center gap-2 shrink-0">
                {activePlan.status === 'waiting_for_approval' && (
                  <button
                    type="button"
                    data-testid="approve-plan-button"
                    onClick={() => void handleApprovePlan()}
                    className="px-3.5 py-2 rounded-xl bg-[#34D399] hover:bg-[#4ADE80] text-[#0B0B0C] text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve Plan for Execution</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid="reject-plan-button"
                  onClick={handleRejectPlan}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#F5F2EB]/80 cursor-pointer"
                >
                  Clear Plan
                </button>
              </div>
            )}
          </div>

          {!activePlan || planTasks.length === 0 ? (
            <div
              data-testid="empty-plan-prompt"
              className="py-10 text-center text-xs sm:text-sm text-[#F5F2EB]/65"
            >
              Click{' '}
              <strong className="text-[#E5C158]">
                &ldquo;Have The Boss Propose Task Plan&rdquo;
              </strong>{' '}
              above to automatically break down your company goal into
              capability-matched agent tasks with dependencies.
            </div>
          ) : (
            <div className="mt-4 space-y-3.5">
              {planTasks.map((task, idx) => {
                const isSupportedWorker =
                  task.executionSupport === 'supported_real_worker';
                const agentCaps = getAgentCapabilities(task.assignedAgentId);

                return (
                  <div
                    key={task.id}
                    data-testid={`proposed-task-card-${task.id}`}
                    className={`p-4 rounded-xl border ${
                      isSupportedWorker
                        ? 'bg-[#152230]/85 border-[#34D399]/35'
                        : 'bg-white/[0.03] border-white/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono-tabular font-bold text-[#E5C158]">
                          Step {idx + 1} · {task.id}
                        </span>
                        <span
                          data-testid={`task-worker-badge-${task.id}`}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isSupportedWorker
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {isSupportedWorker
                            ? 'Real Worker: Clip Brief Generator'
                            : 'Planned Only: Worker Not Implemented'}
                        </span>
                      </div>

                      <span
                        data-testid={`task-status-label-${task.id}`}
                        className="text-[11px] font-mono-tabular font-semibold text-[#F5F2EB]/75"
                      >
                        Status:{' '}
                        {task.status === 'unsupported_skipped'
                          ? 'planned_only (not executed)'
                          : task.status}
                      </span>
                    </div>

                    {/* Editable Task Title */}
                    <div className="mt-2.5">
                      <label
                        htmlFor={`task-title-${task.id}`}
                        className="block text-[10px] font-bold uppercase tracking-wider text-[#F5F2EB]/55 mb-1"
                      >
                        Task Title (Editable before &amp; during approval)
                      </label>
                      <input
                        id={`task-title-${task.id}`}
                        data-testid={`plan-task-title-input-${task.id}`}
                        type="text"
                        value={task.title}
                        onChange={(e) =>
                          handleUpdateTaskField(task.id, {
                            title: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-[#E5C158]"
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-[#F5F2EB]/70 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Agent Capability Selection & Dependency Badges */}
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`agent-select-${task.id}`}
                          className="text-[11px] font-semibold text-[#F5F2EB]/70 shrink-0"
                        >
                          Assigned Agent:
                        </label>
                        <select
                          id={`agent-select-${task.id}`}
                          data-testid={`plan-task-agent-select-${task.id}`}
                          value={task.assignedAgentId}
                          onChange={(e) =>
                            handleUpdateTaskField(task.id, {
                              assignedAgentId: e.target.value,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#0B0B0C] border border-white/20 text-xs font-bold text-[#E5C158] focus:outline-none focus:border-[#E5C158]"
                        >
                          {agents.map((ag) => (
                            <option key={ag.id} value={ag.id}>
                              {ag.name} ({ag.role})
                            </option>
                          ))}
                        </select>
                        {onSelectAgentOnIsland && (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectAgentOnIsland(task.assignedAgentId)
                            }
                            className="text-[11px] text-[#34D399] hover:underline cursor-pointer"
                          >
                            Locate
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-tabular text-[#F5F2EB]/65">
                        <span className="inline-flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-[#E5C158]" />
                          {task.dependsOnTaskIds.length === 0
                            ? 'Deps: None (Root)'
                            : `Deps: ${task.dependsOnTaskIds.join(', ')}`}
                        </span>
                        <span className="text-white/30">|</span>
                        <span>
                          Capability:{' '}
                          {TASK_TYPE_LABELS[task.taskType]?.label.split(' (')[0]}
                        </span>
                        {agentCaps.includes(task.taskType) && (
                          <span className="text-[#34D399] font-bold">
                            ✓ Matched
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Authorized Transcript Intake & Queue Dispatch */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0B0B0C]/80 border border-white/10 p-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <h4 className="text-base sm:text-lg font-extrabold text-white">
                2. Clip Brief Generator Worker
              </h4>
              <p className="text-xs text-[#F5F2EB]/65">
                First real AI execution capability: extracts candidate hooks,
                timestamps &amp; 9:16 caption drafts from an authorized transcript.
              </p>
            </div>
            <button
              type="button"
              data-testid="load-sample-transcript-button"
              onClick={() => setTranscriptText(SAMPLE_AUTHORIZED_TRANSCRIPT)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-[#E5C158] shrink-0 cursor-pointer"
            >
              Reset Sample Transcript
            </button>
          </div>

          <div className="mt-3.5">
            <label
              htmlFor="authorized-transcript-textarea"
              className="block text-xs font-bold text-[#F5F2EB]/85 mb-1.5"
            >
              Authorized Source Transcript (Podcast / VOD Excerpt)
            </label>
            <textarea
              id="authorized-transcript-textarea"
              data-testid="transcript-input-textarea"
              rows={6}
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder="Paste an authorized podcast or stream transcript..."
              className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-[#F5F2EB] font-mono-tabular leading-relaxed focus:outline-none focus:border-[#E5C158]"
            />
          </div>

          {/* Explicit Permission Gate */}
          <label className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              data-testid="transcript-permission-checkbox"
              checked={permissionConfirmed}
              onChange={(e) => setPermissionConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#E5C158] rounded cursor-pointer"
            />
            <span className="text-xs text-[#F5F2EB]/85 leading-snug">
              <strong>Permission &amp; Zero-Spend Confirmation:</strong> I confirm I
              own or have authorization to process this transcript. No external
              publishing, outreach messaging, or paid API billing is permitted.
            </span>
          </label>

          {/* Queue Dispatch Button & Retry Control */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              data-testid="dispatch-queue-button"
              disabled={isExecutingWorker || !activePlan}
              onClick={() => void runClipBriefWorkerJob()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#34D399] hover:bg-[#4ADE80] text-[#0B0B0C] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer disabled:opacity-45"
            >
              {isExecutingWorker ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Clip Brief Worker...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Dispatch Approved Queue (Clip Brief Worker)</span>
                </>
              )}
            </button>

            {latestJob && latestJob.status === 'failed' && (
              <button
                type="button"
                data-testid="retry-job-button"
                disabled={
                  isExecutingWorker ||
                  latestJob.retryCount >= latestJob.maxRetries
                }
                onClick={() => void handleRetryFailedJob()}
                className="px-3.5 py-2.5 rounded-xl bg-[#E5C158] hover:bg-[#edd071] text-[#0B0B0C] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-45"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  Retry Job ({latestJob.retryCount}/{latestJob.maxRetries})
                </span>
              </button>
            )}
          </div>

          {/* Latest Execution Job Telemetry */}
          {latestJob && (
            <div
              data-testid="latest-execution-job-card"
              className="mt-4 p-3.5 rounded-xl bg-black/50 border border-white/12 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between font-mono-tabular">
                <span className="text-[11px] font-bold uppercase text-[#E5C158]">
                  Execution Job Record ({latestJob.id})
                </span>
                <span
                  data-testid="latest-job-status"
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    latestJob.status === 'completed'
                      ? 'bg-[#34D399]/20 text-[#34D399]'
                      : latestJob.status === 'failed'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {latestJob.status}
                </span>
              </div>
              <div className="text-[#F5F2EB]/75 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <span>
                  Agent: <strong className="text-white">{latestJob.assignedAgentName}</strong>
                </span>
                <span>
                  Provider: <strong className="text-white">{latestJob.providerId}</strong>
                </span>
                <span>
                  Retries: {latestJob.retryCount}/{latestJob.maxRetries}
                </span>
              </div>
              {latestJob.outputSummary && (
                <p className="text-[11px] text-[#34D399] leading-relaxed">
                  {latestJob.outputSummary}
                </p>
              )}
              {latestJob.errorMessage && (
                <p className="text-[11px] text-rose-300 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{latestJob.errorMessage}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generated Candidate Short-Form Clip Briefs Output */}
      {clipBriefs.length > 0 && (
        <div
          data-testid="generated-clip-briefs-section"
          className="mt-7 pt-6 border-t border-white/10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#34D399]" />
              <h4 className="text-lg sm:text-xl font-extrabold text-white">
                3. Validated Candidate Short-Form Clip Briefs ({clipBriefs.length})
              </h4>
            </div>
            <span className="text-xs font-mono-tabular text-[#34D399] font-semibold">
              REAL WORKER OUTPUT · 9:16 VERTICAL SPECS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {clipBriefs.map((brief, idx) => (
              <div
                key={brief.id}
                data-testid={`clip-brief-card-${idx}`}
                className="rounded-2xl bg-[#0B0B0C]/90 border border-[#34D399]/30 p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
                    <span className="px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] font-bold">
                      {brief.aspectRatio} · ~{brief.estimatedDurationSec}s
                    </span>
                    <span className="text-[#E5C158] font-semibold">
                      {brief.segmentTimestamp}
                    </span>
                  </div>

                  <h5 className="mt-2.5 text-sm font-extrabold text-white leading-snug">
                    {brief.clipTitle}
                  </h5>

                  <div className="mt-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E5C158]">
                      Opening 3-Second Hook
                    </span>
                    <p className="mt-0.5 text-xs font-semibold text-white leading-snug">
                      {brief.hookLine}
                    </p>
                  </div>

                  <div className="mt-2 text-xs text-[#F5F2EB]/75">
                    <span className="font-bold text-[#F5F2EB]/90">
                      Transcript Segment:{' '}
                    </span>
                    &ldquo;{brief.segmentQuote}&rdquo;
                  </div>

                  <div className="mt-2.5 p-2.5 rounded-xl bg-[#162836]/60 border border-[#E5C158]/25">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#34D399]">
                      Caption Draft
                    </span>
                    <p className="mt-0.5 text-[11px] font-mono-tabular text-[#F5F2EB] leading-relaxed">
                      {brief.captionDraft}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-[11px] text-[#F5F2EB]/65 leading-snug">
                  <strong className="text-[#F5F2EB]/85">Why it holds retention: </strong>
                  {brief.retentionRationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
