export type DepartmentId =
  | 'the-boss'
  | 'content-studio'
  | 'growth'
  | 'sales-community';

export type AgentStatus = 'working' | 'reviewing' | 'queued' | 'idle';

export type AgentAnimationState =
  | 'idle'
  | 'walking'
  | 'working'
  | 'communicating';

export interface IslandPoint {
  x: number;
  y: number;
}

export type TaskPriority = 'high' | 'medium' | 'low';

export type ExecutionJobStage =
  | 'ingest_vod'
  | 'scene_detection'
  | 'hook_extraction'
  | 'caption_render'
  | 'quality_gate'
  | 'distribution_prep';

export interface Goal {
  id: string;
  title: string;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  currentDay: number;
  totalDays: number;
  deadlineLabel: string;
  countdownDisplay: string;
  isSampleData: boolean;
}

export interface Department {
  id: DepartmentId;
  name: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  islandPosition: IslandPoint;
  futureEngineHook: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  departmentId: DepartmentId;
  assignedAgentId: string;
  status: 'in_progress' | 'completed_sample' | 'queued' | 'awaiting_gate';
  priority: TaskPriority;
  progressPercent: number;
  sampleOutputSummary: string;
  isSampleData: boolean;
}

export interface ExecutionJob {
  id: string;
  taskId: string;
  agentId: string;
  pipelineStage: ExecutionJobStage;
  sourceSpec: string;
  targetFormat: string;
  estimatedDurationLabel: string;
  executionMode: 'simulated_preview';
  integrationNote: string;
  isSampleData: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  departmentId: DepartmentId;
  status: AgentStatus;
  animationState?: AgentAnimationState;
  badgeColor: 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'rose';
  progressPercent: number;
  islandCoords: IslandPoint;
  homeCoords?: IslandPoint;
  destinationCoords?: IslandPoint;
  destinationLabel?: string;
  waypoints?: IslandPoint[];
  speedPxPerSec?: number;
  currentTaskId: string;
  executionJobId: string;
  specialty: string;
  sampleBubbleText?: string;
  bubbleOffset?: {
    dx: number;
    dy: number;
  };
  bubbleExpiresAt?: number;
  isSampleData: boolean;
}

export type ActivityEventStatus = 'travelling' | 'delivered' | 'completed';

export interface ActivityEvent {
  id: string;
  fromAgentName: string;
  toAgentName?: string;
  fromAgentId: string;
  toAgentId?: string;
  departmentId: DepartmentId;
  destinationLabel?: string;
  message: string;
  timestampLabel: string;
  createdAt?: number;
  status?: ActivityEventStatus;
  eventType: 'handoff' | 'quality_gate' | 'milestone' | 'clip_spec';
  isSampleData: boolean;
}

export interface ActiveMessagePacket {
  id: string;
  eventId: string;
  fromAgentId: string;
  toAgentId: string;
  fromCoords: IslandPoint;
  toCoords: IslandPoint;
  progress: number; // 0 to 1
  label: string;
}

export interface SimulationScenarioTemplate {
  id: string;
  senderAgentId: string;
  senderAgentName: string;
  recipientAgentId?: string;
  recipientAgentName: string;
  departmentId: DepartmentId;
  destinationCoords: IslandPoint;
  destinationLabel: string;
  message: string;
  bubbleText: string;
  eventType: ActivityEvent['eventType'];
}

export interface HowItWorksChapter {
  number: string;
  id: string;
  title: string;
  headline: string;
  subtitle: string;
  description: string;
  sampleNote: string;
  cardVariant:
    | 'goal'
    | 'boss'
    | 'team'
    | 'quality'
    | 'harness'
    | 'base'
    | 'healing'
    | 'always_on'
    | 'your_turn';
}

export interface CanvasTransform {
  scale: number;
  x: number;
  y: number;
}

/**
 * Clean data provider contract so the explicit demo-data layer can be
 * replaced later by a real video-clipping backend without rebuilding UI components.
 */
export interface MissionDataRepository {
  mode: 'sample_demo' | 'live_backend';
  initialGoal: Goal;
  departments: Department[];
  agents: Agent[];
  tasks: Task[];
  executionJobs: ExecutionJob[];
  activityEvents: ActivityEvent[];
  simulationScenarios: SimulationScenarioTemplate[];
  chapters: HowItWorksChapter[];
}

export const PERSISTENCE_SCHEMA_VERSION = 1 as const;

export type PersistenceStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

export interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface WorkspaceGoalRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  title: string;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  currentDay: number;
  totalDays: number;
  deadlineLabel: string;
  countdownDisplay: string;
  isSampleData: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DepartmentRecord {
  id: DepartmentId;
  ownerUid: string;
  schemaVersion: number;
  name: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  islandX: number;
  islandY: number;
  futureEngineHook: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AgentRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  name: string;
  role: string;
  departmentId: DepartmentId;
  status: AgentStatus;
  badgeColor: Agent['badgeColor'];
  progressPercent: number;
  homeX: number;
  homeY: number;
  destinationLabel: string;
  speedPxPerSec: number;
  currentTaskId: string;
  executionJobId: string;
  specialty: string;
  isSampleData: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TaskRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  title: string;
  description: string;
  departmentId: DepartmentId;
  assignedAgentId: string;
  status: Task['status'];
  priority: TaskPriority;
  progressPercent: number;
  sampleOutputSummary: string;
  isSampleData: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityEventRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  fromAgentName: string;
  toAgentName: string;
  fromAgentId: string;
  toAgentId: string;
  departmentId: DepartmentId;
  destinationLabel: string;
  message: string;
  timestampLabel: string;
  eventTimestampMs: number;
  status: ActivityEventStatus;
  eventType: ActivityEvent['eventType'];
  isSampleData: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPreferencesRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  defaultDepartmentFilter: DepartmentId | 'all';
  selectedAgentId: string;
  simulationAutoplay: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClipProject {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  title: string;
  sourceFileName: string;
  permissionConfirmed: boolean;
  status: 'draft' | 'queued' | 'processing' | 'ready_for_review' | 'failed';
  targetAspectRatio: '9:16' | '1:1' | '16:9';
  isSampleData: boolean;
}

export interface ClipAsset {
  id: string;
  projectId: string;
  ownerUid: string;
  schemaVersion: number;
  title: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '1:1' | '16:9';
  reviewStatus: 'pending_review' | 'approved' | 'rejected';
  isSampleData: boolean;
}

// ============================================================================
// Phase 4: Zero-Cost-First Execution & Automatic Task Delegation Types
// ============================================================================

export type ModelProviderId =
  | 'ollama_local'
  | 'gemini_free_tier'
  | 'deterministic_local';

export type DelegatedTaskType =
  | 'clip_brief_generation'
  | 'transcript_indexing'
  | 'video_reframe_spec'
  | 'caption_styling_spec'
  | 'quality_gate_audit'
  | 'growth_retention_plan'
  | 'creator_outreach_draft';

export type AgentCapabilityId = DelegatedTaskType | 'goal_decomposition';

export interface ProviderStatusInfo {
  id: ModelProviderId;
  name: string;
  costPolicy:
    | 'zero_api_charge_local'
    | 'free_tier_hosted'
    | 'zero_cost_deterministic';
  available: boolean;
  endpointOrModel: string;
  sessionCallsUsed: number;
  sessionCallsLimit: number;
  statusDetail: string;
  requiresLocalWorker: boolean;
}

export type ProposedTaskExecutionSupport =
  | 'supported_real_worker'
  | 'unsupported_worker';

export type ProposedTaskStatus =
  | 'proposed'
  | 'approved'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'unsupported_skipped';

export interface ProposedPlanTask {
  id: string;
  planId: string;
  title: string;
  description: string;
  taskType: DelegatedTaskType;
  departmentId: DepartmentId;
  assignedAgentId: string;
  assignedAgentName: string;
  requiredCapability: AgentCapabilityId;
  dependsOnTaskIds: string[];
  executionSupport: ProposedTaskExecutionSupport;
  status: ProposedTaskStatus;
}

export type DelegationPlanStatus =
  | 'waiting_for_approval'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'rejected';

export interface DelegationPlanRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  goalId: string;
  goalTitle: string;
  providerId: ModelProviderId;
  status: DelegationPlanStatus;
  autoRunApprovedTypesOnly: boolean;
  tasksJson: string;
  taskCount: number;
  supportedTaskCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ExecutionJobStatus =
  | 'waiting_for_approval'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unsupported_worker';

export interface ExecutionJobRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  planId: string;
  taskId: string;
  taskTitle: string;
  taskType: DelegatedTaskType;
  assignedAgentId: string;
  assignedAgentName: string;
  providerId: ModelProviderId;
  status: ExecutionJobStatus;
  permissionConfirmed: boolean;
  retryCount: number;
  maxRetries: number;
  sourceTranscriptExcerpt: string;
  outputSummary: string;
  errorMessage: string;
  isSampleData: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ClipBriefRecord {
  id: string;
  ownerUid: string;
  schemaVersion: number;
  jobId: string;
  planId: string;
  taskId: string;
  agentId: string;
  clipTitle: string;
  hookLine: string;
  segmentTimestamp: string;
  segmentQuote: string;
  estimatedDurationSec: number;
  aspectRatio: '9:16' | '1:1' | '16:9';
  captionDraft: string;
  retentionRationale: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}


