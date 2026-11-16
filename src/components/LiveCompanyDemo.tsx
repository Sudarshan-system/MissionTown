import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Cloud,
  FastForward,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  ActiveMessagePacket,
  ActivityEvent,
  Agent,
  AuthUserSummary,
  CanvasTransform,
  ClipBriefRecord,
  DelegationPlanRecord,
  Department,
  DepartmentId,
  ExecutionJob,
  ExecutionJobRecord,
  Goal,
  PersistenceStatus,
  Task,
} from '../types/mission';
import {
  calculateGoalProgressPercentage,
  filterAgentsByDepartmentAndQuery,
  panCanvasTransform,
  resetCanvasTransform,
  stepZoom,
} from '../utils/companyLogic';
import { BossDelegationPanel } from './BossDelegationPanel';
import { IsometricIsland } from './IsometricIsland';

interface LiveCompanyDemoProps {
  goal: Goal;
  departments: Department[];
  agents: Agent[];
  tasks: Task[];
  executionJobs: ExecutionJob[];
  activityEvents: ActivityEvent[];
  activePackets: ActiveMessagePacket[];
  isSimulating: boolean;
  selectedAgentId: string | null;
  departmentFilter: DepartmentId | 'all';
  authUser: AuthUserSummary | null;
  persistenceStatus: PersistenceStatus;
  persistenceError: string | null;
  taskPlans?: DelegationPlanRecord[];
  persistedJobs?: ExecutionJobRecord[];
  clipBriefs?: ClipBriefRecord[];
  onSelectAgentId: (agentId: string | null) => void;
  onDepartmentFilterChange: (deptId: DepartmentId | 'all') => void;
  onGoalChange: (newTitle: string) => void;
  onSaveGoal: (newTitle?: string) => Promise<void>;
  onAssignSampleTask: (agentId: string, newTaskTitle: string) => Promise<boolean>;
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
  onDismissPersistenceError: () => void;
  onToggleSimulation: () => void;
  onStepSimulation: () => void;
  onResetSimulation: () => void;
  onDismissBubble: (agentId: string) => void;
}

const STATUS_LABELS: Record<
  Agent['status'],
  { label: string; textClass: string; badgeClass: string }
> = {
  working: {
    label: 'Working (Sample)',
    textClass: 'text-[#34D399]',
    badgeClass: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30',
  },
  reviewing: {
    label: 'Quality Gate (Sample)',
    textClass: 'text-[#E5C158]',
    badgeClass: 'bg-[#E5C158]/15 text-[#E5C158] border-[#E5C158]/30',
  },
  queued: {
    label: 'Queued (Sample)',
    textClass: 'text-[#60A5FA]',
    badgeClass: 'bg-[#60A5FA]/15 text-[#60A5FA] border-[#60A5FA]/30',
  },
  idle: {
    label: 'Standby (Sample)',
    textClass: 'text-[#F5F2EB]/60',
    badgeClass: 'bg-white/10 text-[#F5F2EB]/75 border-white/15',
  },
};

export const LiveCompanyDemo: React.FC<LiveCompanyDemoProps> = ({
  goal,
  departments,
  agents,
  tasks,
  executionJobs,
  activityEvents,
  activePackets,
  isSimulating,
  selectedAgentId,
  departmentFilter,
  authUser,
  persistenceStatus,
  persistenceError,
  taskPlans = [],
  persistedJobs = [],
  clipBriefs = [],
  onSelectAgentId,
  onDepartmentFilterChange,
  onGoalChange,
  onSaveGoal,
  onAssignSampleTask,
  onRecordRealActivity,
  onPersistPlan,
  onPersistJobBundle,
  onDismissPersistenceError,
  onToggleSimulation,
  onStepSimulation,
  onResetSimulation,
  onDismissBubble,
}) => {
  const [transform, setTransform] = useState<CanvasTransform>(
    resetCanvasTransform()
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingGoalInline, setIsEditingGoalInline] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskSavedNotice, setTaskSavedNotice] = useState(false);

  const progressPercentage = calculateGoalProgressPercentage(goal);
  const workingCount = agents.filter(
    (a) => a.status === 'working' || a.status === 'reviewing'
  ).length;

  const selectedAgent =
    agents.find((agent) => agent.id === selectedAgentId) ?? null;
  const selectedAgentTask = selectedAgent
    ? tasks.find((t) => t.id === selectedAgent.currentTaskId)
    : undefined;
  const selectedAgentJob = selectedAgent
    ? executionJobs.find((j) => j.id === selectedAgent.executionJobId)
    : undefined;
  const selectedAgentDepartment = selectedAgent
    ? departments.find((d) => d.id === selectedAgent.departmentId)
    : undefined;

  const filteredAgents = filterAgentsByDepartmentAndQuery(
    agents,
    departmentFilter,
    searchQuery
  );

  const handleSelectAgent = (agent: Agent) => {
    onSelectAgentId(agent.id);
    const agentTask = tasks.find((t) => t.id === agent.currentTaskId);
    setTaskDraft(agentTask?.title ?? '');
    setTaskSavedNotice(false);
  };

  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: stepZoom(prev.scale, 'in'),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      scale: stepZoom(prev.scale, 'out'),
    }));
  };

  const handleViewAll = () => {
    setTransform(resetCanvasTransform());
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setTransform((prev) => panCanvasTransform(prev, dx, dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleSaveTaskDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !taskDraft.trim() || isSavingTask) return;
    setIsSavingTask(true);
    setTaskSavedNotice(false);
    const succeeded = await onAssignSampleTask(selectedAgent.id, taskDraft);
    setIsSavingTask(false);
    if (succeeded) {
      setTaskSavedNotice(true);
    }
  };

  const handleToggleGoalInlineEdit = async () => {
    if (isEditingGoalInline) {
      setIsEditingGoalInline(false);
      await onSaveGoal(goal.title);
    } else {
      setIsEditingGoalInline(true);
    }
  };

  return (
    <section
      id="demo"
      aria-label="Your company, live"
      className="relative max-w-[1280px] mx-auto px-4 sm:px-6 pt-24 pb-20 scroll-mt-24"
    >
      {/* Loading / Error Banners for Cloud Firestore Persistence */}
      {persistenceStatus === 'loading' && (
        <div
          data-testid="workspace-loading-banner"
          role="status"
          className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#162836]/90 border border-[#E5C158]/40 text-xs sm:text-sm text-[#F5F2EB] shadow-lg"
        >
          <Loader2 className="w-4 h-4 text-[#E5C158] animate-spin shrink-0" />
          <span>
            Loading your saved MissionTown workspace from Cloud Firestore...
          </span>
        </div>
      )}

      {persistenceError && (
        <div
          data-testid="persistence-error-banner"
          role="alert"
          className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-rose-950/85 border border-rose-400/40 text-xs sm:text-sm text-rose-100 shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Persistence Error:</strong> {persistenceError}
            </span>
          </div>
          <button
            type="button"
            onClick={onDismissPersistenceError}
            aria-label="Dismiss error banner"
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section Header Row (Matching Screenshot 1) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
        <div>
          <h2 className="text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-tight text-[#F5F2EB] leading-none">
            Your company, live.
          </h2>
        </div>
        <p className="text-sm sm:text-base font-medium text-[#F5F2EB]/65">
          Drag around. Click anyone. Inspect their sample task &amp; clipping
          pipeline.
        </p>
      </div>

      {/* Large Bright Cyan-Blue Visualization Canvas (Matching Screenshot 1) */}
      <div
        data-testid="island-canvas-container"
        data-scale={transform.scale}
        data-pan-x={transform.x}
        data-pan-y={transform.y}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-[640px] sm:h-[690px] rounded-[28px] bg-gradient-to-b from-[#29BDF0] via-[#21B5E8] to-[#1AA8DC] border border-white/15 shadow-2xl overflow-hidden flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Interactive Isometric Island World */}
        <div className="scale-[0.58] sm:scale-90 lg:scale-100 lg:translate-x-8 transition-transform">
          <IsometricIsland
            agents={agents}
            departments={departments}
            selectedAgentId={selectedAgentId}
            activeDepartmentFilter={departmentFilter}
            transform={transform}
            isDragging={isDragging}
            activePackets={activePackets}
            onSelectAgent={handleSelectAgent}
            onSelectDepartment={(deptId) =>
              onDepartmentFilterChange(
                departmentFilter === deptId ? 'all' : deptId
              )
            }
            onDismissBubble={onDismissBubble}
          />
        </div>

        {/* Top-Left Mission / Progress Card (Unclipped & Responsive) */}
        <div
          data-testid="goal-progress-card"
          className="absolute top-3 left-3 sm:top-6 sm:left-6 z-30 w-[212px] sm:w-[348px] rounded-2xl bg-[#162836]/94 backdrop-blur-md border border-white/15 p-3 sm:p-4.5 shadow-xl text-[#F5F2EB]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#E5C158] text-[#0B0B0C] text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase shrink-0 -rotate-2">
                GOAL
              </span>
              <span
                data-testid="goal-card-title"
                className="text-[11px] sm:text-[13.5px] font-bold text-[#F5F2EB] leading-snug break-words"
              >
                {goal.title}
              </span>
            </div>
            <button
              type="button"
              data-testid="goal-inline-edit-toggle"
              onClick={() => void handleToggleGoalInlineEdit()}
              className="text-[11px] font-semibold text-[#E5C158] hover:underline shrink-0 cursor-pointer"
            >
              {isEditingGoalInline ? 'Done' : 'Edit'}
            </button>
          </div>

          {isEditingGoalInline && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleToggleGoalInlineEdit();
              }}
              className="mt-2"
            >
              <label htmlFor="canvas-goal-input" className="sr-only">
                Edit Mission Goal
              </label>
              <input
                id="canvas-goal-input"
                type="text"
                value={goal.title}
                onChange={(e) => onGoalChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-black/40 border border-white/20 text-[#F5F2EB] focus:outline-none focus:border-[#E5C158]"
              />
            </form>
          )}

          {/* Metric Display */}
          <div className="mt-2 sm:mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              style={{ whiteSpace: 'nowrap' }}
              className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono-tabular whitespace-nowrap shrink-0"
            >
              {goal.metricLabel}
            </span>
            <span
              data-testid="goal-card-unit"
              className="text-[10.5px] sm:text-xs font-medium text-[#F5F2EB]/80 whitespace-nowrap"
            >
              {goal.unit}
            </span>
          </div>

          {/* Fresh Green Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Sample goal progress"
            className="mt-2 sm:mt-2.5 w-full h-2 sm:h-2.5 rounded-full bg-white/15 overflow-hidden"
          >
            <div
              style={{ width: `${progressPercentage}%` }}
              className="h-full rounded-full bg-[#4ADE80] transition-all duration-300"
            />
          </div>

          {/* Progress Footer Row */}
          <div className="mt-2 flex items-center justify-between text-[10px] sm:text-xs font-medium text-[#F5F2EB]/75 font-mono-tabular">
            <span>{progressPercentage}% there (Sample)</span>
            <span>{goal.deadlineLabel}</span>
          </div>
        </div>

        {/* Top-Center Drag Instruction Pill (Matching Screenshot 1) */}
        <div className="hidden xl:flex absolute top-6 left-[48%] -translate-x-1/2 z-20 items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-[#162836] text-[11px] font-semibold shadow-md pointer-events-none whitespace-nowrap">
          <span>
            Drag to look around · Click anyone to inspect ({Math.round(transform.scale * 100)}%)
          </span>
        </div>

        {/* Top-Right Sample Demo Status & Simulation Controls */}
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-30 flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-[#162836]/90 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs font-semibold text-[#F5F2EB] shadow-lg whitespace-nowrap">
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full shrink-0 ${
                isSimulating ? 'bg-[#34D399] animate-pulse' : 'bg-[#E5C158]'
              }`}
            />
            <span className="font-bold text-[#E5C158]">Sample demo</span>
            <span className="hidden sm:inline text-[#F5F2EB]/80 font-mono-tabular">
              {agents.length} agents · {workingCount} active
            </span>
          </div>

          <div
            role="group"
            aria-label="Simulation playback controls"
            className="flex items-center gap-1 p-1 rounded-full bg-[#162836]/92 backdrop-blur-md border border-white/15 shadow-lg"
          >
            <button
              type="button"
              onClick={onToggleSimulation}
              aria-label={isSimulating ? 'Pause simulation' : 'Play simulation'}
              title={isSimulating ? 'Pause sample simulation' : 'Play sample simulation'}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#F5F2EB] text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3 h-3 text-[#E5C158]" />
                  <span className="hidden md:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-[#34D399]" />
                  <span className="hidden md:inline">Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStepSimulation}
              aria-label="Trigger sample handoff"
              title="Trigger next sample agent handoff"
              className="p-1.5 rounded-full hover:bg-white/15 text-[#F5F2EB]/85 hover:text-white transition-colors cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onResetSimulation}
              aria-label="Reset simulation"
              title="Reset sample simulation positions and events"
              className="p-1.5 rounded-full hover:bg-white/15 text-[#F5F2EB]/85 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom-Left Floating Animated Sample Activity Notifications */}
        <div
          aria-label="Sample activity notifications"
          data-testid="canvas-activity-feed"
          className="absolute bottom-14 left-3 sm:bottom-6 sm:left-6 z-20 flex flex-col gap-1.5 sm:gap-2 w-[calc(100%-1.5rem)] sm:w-[355px]"
        >
          {activityEvents.slice(0, 4).map((evt, idx) => {
            const targetAgent = agents.find((a) => a.id === evt.fromAgentId);
            const isTravelling = evt.status === 'travelling' && idx === 0;
            return (
              <button
                key={evt.id}
                type="button"
                data-testid={`canvas-activity-item-${idx}`}
                onClick={() => {
                  if (targetAgent) handleSelectAgent(targetAgent);
                }}
                className={`${
                  idx >= 2 ? 'hidden sm:flex' : 'flex'
                } animate-activity-enter w-full items-center justify-between gap-2 text-left px-3 py-2 rounded-xl bg-[#162836]/88 hover:bg-[#162836]/96 backdrop-blur-md border ${
                  isTravelling
                    ? 'border-[#E5C158]/60 ring-1 ring-[#E5C158]/40'
                    : 'border-white/15'
                } text-[11px] sm:text-xs text-[#F5F2EB]/95 shadow-md transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                <div className="truncate">
                  <span className="font-bold text-white">
                    {evt.fromAgentName}
                    {evt.toAgentName ? ` → ${evt.toAgentName}: ` : ': '}
                  </span>
                  <span className="text-[#F5F2EB]/85">{evt.message}</span>
                </div>
                {isTravelling && (
                  <span
                    data-testid="simulated-activity-badge"
                    className="shrink-0 px-1.5 py-0.5 rounded bg-[#E5C158]/20 text-[#E5C158] text-[9px] font-bold uppercase tracking-wider"
                  >
                    SIMULATED
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom-Right Zoom & View All Controls (Matching Screenshot 1) */}
        <div
          role="group"
          aria-label="Island zoom controls"
          className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-30 flex items-center gap-1.5 sm:gap-2"
        >
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#162836]/90 hover:bg-[#162836] text-white border border-white/25 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#162836]/90 hover:bg-[#162836] text-white border border-white/25 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleViewAll}
            aria-label="View all"
            className="px-3 sm:px-4 h-9 sm:h-10 rounded-xl bg-[#162836]/90 hover:bg-[#162836] text-white border-2 border-white/75 text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            View all
          </button>
        </div>

        {/* Interactive Agent Details Drawer (Opens when an agent is clicked) */}
        {selectedAgent && (
          <aside
            aria-label={`Agent details for ${selectedAgent.name}`}
            className="absolute top-3 right-3 bottom-14 sm:top-5 sm:right-5 sm:bottom-18 z-40 w-[calc(100%-1.5rem)] sm:w-[370px] rounded-2xl bg-[#11161D]/96 backdrop-blur-xl border border-white/20 p-4 text-[#F5F2EB] shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            <div>
              {/* Header with Agent Name, Department & Close Button */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-[#E5C158] font-semibold">
                    <span>{selectedAgentDepartment?.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>Sample Agent Profile</span>
                  </div>
                  <h3 className="mt-0.5 text-xl font-extrabold text-white">
                    {selectedAgent.name}
                  </h3>
                  <p className="text-xs text-[#F5F2EB]/75 font-medium">
                    {selectedAgent.role}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAgentId(null)}
                  aria-label="Close agent details"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F5F2EB] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status, Animation State & Progress Row */}
              <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#F5F2EB]/70">Current Status:</span>
                  <span
                    className={`font-bold ${
                      STATUS_LABELS[selectedAgent.status].textClass
                    }`}
                  >
                    {STATUS_LABELS[selectedAgent.status].label} ·{' '}
                    {selectedAgent.progressPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#F5F2EB]/60">Island Activity:</span>
                  <span className="font-mono-tabular text-[#E5C158]">
                    {selectedAgent.animationState === 'walking'
                      ? `Walking → ${selectedAgent.destinationLabel ?? 'Station'} (Paused while inspecting)`
                      : selectedAgent.animationState === 'communicating'
                      ? `Communicating @ ${selectedAgent.destinationLabel ?? 'Station'}`
                      : `Stationed @ ${selectedAgent.destinationLabel ?? selectedAgentDepartment?.name}`}
                  </span>
                </div>
              </div>

              {/* Specialty */}
              <div className="mt-2 text-xs text-[#F5F2EB]/80 leading-snug">
                <span className="font-semibold text-white">Specialty: </span>
                {selectedAgent.specialty}
              </div>

              {/* Current Sample Task Card */}
              {selectedAgentTask && (
                <div className="mt-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-[10px] text-[#E5C158] font-bold uppercase tracking-wider">
                    <span>Current Sample Task</span>
                    <span className="font-mono-tabular">
                      Priority: {selectedAgentTask.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-white leading-snug">
                    {selectedAgentTask.title}
                  </p>
                  <p className="mt-1 text-[11px] text-[#F5F2EB]/75 leading-snug">
                    {selectedAgentTask.description}
                  </p>
                  <p className="mt-1.5 pt-1.5 border-t border-white/10 text-[11px] text-[#34D399] font-medium">
                    {selectedAgentTask.sampleOutputSummary}
                  </p>
                </div>
              )}

              {/* Simulated ExecutionJob Contract Preview */}
              {selectedAgentJob && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-black/40 border border-white/10 text-[11px]">
                  <div className="flex items-center justify-between text-[10px] text-[#F5F2EB]/60 font-mono-tabular">
                    <span>EXECUTION JOB SPEC (SIMULATED)</span>
                    <span>{selectedAgentJob.pipelineStage}</span>
                  </div>
                  <div className="mt-1.5 space-y-0.5 text-[#F5F2EB]/85">
                    <div className="truncate">
                      <span className="text-[#F5F2EB]/55">Input: </span>
                      <span className="font-mono-tabular">
                        {selectedAgentJob.sourceSpec}
                      </span>
                    </div>
                    <div className="truncate">
                      <span className="text-[#F5F2EB]/55">Output: </span>
                      <span className="font-mono-tabular">
                        {selectedAgentJob.targetFormat}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[#E5C158]/90 pt-0.5">
                      {selectedAgentJob.integrationNote}
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Sample Task Reassignment Form */}
              <form onSubmit={(e) => void handleSaveTaskDraft(e)} className="mt-3">
                <label
                  htmlFor="agent-task-input"
                  className="block text-xs font-bold text-[#F5F2EB]/85 mb-1"
                >
                  Update Sample Task for {selectedAgent.name}
                </label>
                <div className="flex gap-2">
                  <input
                    id="agent-task-input"
                    type="text"
                    value={taskDraft}
                    onChange={(e) => {
                      setTaskDraft(e.target.value);
                      setTaskSavedNotice(false);
                    }}
                    placeholder="Assign a new sample clipping task..."
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white focus:outline-none focus:border-[#E5C158]"
                  />
                  <button
                    type="submit"
                    disabled={isSavingTask}
                    className="px-3 py-1.5 rounded-lg bg-[#E5C158] hover:bg-[#edd071] text-[#0B0B0C] text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isSavingTask ? 'Saving...' : 'Assign'}
                  </button>
                </div>
                {taskSavedNotice && (
                  <p
                    data-testid="task-saved-notice"
                    className="mt-1 text-[11px] text-[#34D399] flex items-center gap-1 font-medium"
                  >
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {authUser
                        ? 'Sample task updated on island, roster & saved to Cloud Firestore.'
                        : 'Sample task updated on island & roster.'}
                    </span>
                  </p>
                )}
              </form>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-[#F5F2EB]/55 flex items-center justify-between gap-2">
              <span>
                Sample Data Notice: No background video rendering or paid API calls
                are running.
              </span>
              {authUser && (
                <span className="inline-flex items-center gap-1 text-[#34D399] font-semibold shrink-0">
                  <Cloud className="w-3 h-3" />
                  <span>Firestore Sync</span>
                </span>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Phase 4: The Boss Automatic Task Delegation & Clip Brief Generator Studio */}
      <BossDelegationPanel
        goal={goal}
        agents={agents}
        authUser={authUser}
        initialPlans={taskPlans}
        initialJobs={persistedJobs}
        initialClipBriefs={clipBriefs}
        onRecordRealActivity={onRecordRealActivity}
        onPersistPlan={onPersistPlan}
        onPersistJobBundle={onPersistJobBundle}
        onSelectAgentOnIsland={(agentId) => {
          const found = agents.find((a) => a.id === agentId);
          if (found) handleSelectAgent(found);
        }}
      />

      {/* Below-Canvas Workspace: Agent Roster, Department Filters & Readable Activity Feed */}
      <div
        id="roster"
        className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left 8 Columns: Interactive Agent Roster & Department Filter Bar */}
        <div className="lg:col-span-8 rounded-3xl bg-[#121418] border border-white/10 p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#F5F2EB]">
                Company Agent Roster
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[#F5F2EB]/65">
                Click any agent to highlight them on the island and inspect
                their sample clipping task.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#F5F2EB]/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search agents by name or specialty"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents or roles..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0B0B0C] border border-white/12 text-xs sm:text-sm text-[#F5F2EB] placeholder:text-white/40 focus:outline-none focus:border-[#E5C158]"
              />
            </div>
          </div>

          {/* Interactive Department Filter Controls */}
          <div
            role="tablist"
            aria-label="Filter agents by department"
            className="mt-4 flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={departmentFilter === 'all'}
              onClick={() => onDepartmentFilterChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                departmentFilter === 'all'
                  ? 'bg-[#E5C158] text-[#0B0B0C]'
                  : 'bg-white/5 text-[#F5F2EB]/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              All Departments ({agents.length})
            </button>
            {departments.map((dept) => {
              const count = agents.filter(
                (a) => a.departmentId === dept.id
              ).length;
              const isSelected = departmentFilter === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onDepartmentFilterChange(dept.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#E5C158] text-[#0B0B0C]'
                      : 'bg-white/5 text-[#F5F2EB]/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {dept.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Agent Roster Grid */}
          {filteredAgents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[#F5F2EB]/70">
                No agents match your current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  onDepartmentFilterChange('all');
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-[#E5C158] cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredAgents.map((agent) => {
                const agentTask = tasks.find(
                  (t) => t.id === agent.currentTaskId
                );
                const dept = departments.find(
                  (d) => d.id === agent.departmentId
                );
                const isSelected = selectedAgentId === agent.id;

                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectAgent(agent)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B222D] border-[#E5C158] ring-1 ring-[#E5C158]'
                        : 'bg-[#0B0B0C]/70 border-white/10 hover:border-white/25 hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-extrabold text-white">
                        {agent.name}
                      </span>
                      <span
                        className={`text-[11px] font-semibold ${
                          STATUS_LABELS[agent.status].textClass
                        }`}
                      >
                        {STATUS_LABELS[agent.status].label}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#F5F2EB]/65">
                      <span>{agent.role}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#E5C158] font-medium">
                        {dept?.name}
                      </span>
                    </div>

                    {agentTask && (
                      <p className="mt-2.5 text-xs text-[#F5F2EB]/85 line-clamp-2 leading-relaxed">
                        <span className="text-[#F5F2EB]/50">Sample task: </span>
                        {agentTask.title}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          style={{ width: `${agent.progressPercent}%` }}
                          className="h-full rounded-full bg-[#4ADE80]"
                        />
                      </div>
                      <span className="text-[11px] font-mono-tabular text-[#F5F2EB]/65">
                        {agent.progressPercent}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 Columns: Readable Sample Activity Feed & Clipping Architecture Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl bg-[#121418] border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#F5F2EB]">
                Sample Activity Feed
              </h3>
              <span className="text-xs text-[#E5C158] font-semibold">
                Simulated Log
              </span>
            </div>
            <p className="mt-1 text-xs text-[#F5F2EB]/60">
              Click any sample handoff event to inspect the responsible agent on
              the island.
            </p>

            <div className="mt-4 divide-y divide-white/10">
              {activityEvents.map((evt) => {
                const fromAgent = agents.find((a) => a.id === evt.fromAgentId);
                return (
                  <div key={evt.id} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (fromAgent) handleSelectAgent(fromAgent);
                      }}
                      className="w-full text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-[#F5F2EB]/55 font-mono-tabular">
                        <span className="font-sans font-bold text-[#F5F2EB] group-hover:text-[#E5C158] transition-colors truncate">
                          {evt.fromAgentName}
                          {evt.toAgentName ? ` → ${evt.toAgentName}` : ''}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              evt.isSampleData
                                ? 'bg-white/10 text-[#E5C158]'
                                : 'bg-[#34D399]/20 text-[#34D399]'
                            }`}
                          >
                            {evt.isSampleData ? 'SIMULATED' : 'LIVE'}
                          </span>
                          <span>{evt.timestampLabel}</span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[#F5F2EB]/80 leading-relaxed">
                        {evt.message}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Future Video Clipping Engine Integration Readiness Box */}
          <div className="rounded-3xl bg-[#121418] border border-white/10 p-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#34D399] uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Clipping Engine Adapter Ready</span>
            </div>
            <h4 className="mt-2 text-base font-extrabold text-white">
              Modular Data Layer (`MissionDataRepository`)
            </h4>
            <p className="mt-1.5 text-xs text-[#F5F2EB]/70 leading-relaxed">
              This workspace separates UI components from data providers. When
              your long-to-short video clipping engine is connected, swap{' '}
              <code className="text-[#E5C158] font-mono-tabular">
                DEMO_COMPANY_REPOSITORY
              </code>{' '}
              with your live job queue without changing the island or roster UI.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
