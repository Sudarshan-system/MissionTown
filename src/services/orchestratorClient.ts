import {
  Agent,
  ClipBriefRecord,
  DelegationPlanRecord,
  Goal,
  ModelProviderId,
  ProposedPlanTask,
  ProviderStatusInfo,
} from '../types/mission';
import {
  buildDeterministicClipBriefsPayload,
  buildDeterministicPlanPayload,
  isSupportedRealWorkerTaskType,
  validateAndNormalizeStructuredPlan,
  validateAuthorizedTranscriptInput,
  validateClipBriefWorkerOutput,
  validateGoalForDelegation,
} from '../utils/orchestrationLogic';

export interface OrchestratorProviderCatalog {
  providers: ProviderStatusInfo[];
  policy: {
    zeroCostFirst: boolean;
    silentPaidFallbackAllowed: boolean;
    firebaseBillingPlan: string;
    supportedRealWorkers: string[];
  };
}

const clientSessionCounters: Record<ModelProviderId, number> = {
  ollama_local: 0,
  gemini_free_tier: 0,
  deterministic_local: 0,
};

async function probeLocalOllamaFromClient(): Promise<{
  reachable: boolean;
  detail: string;
}> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 900);
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags', {
      method: 'GET',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (res.ok) {
      return {
        reachable: true,
        detail:
          'Connected to local Ollama worker at http://127.0.0.1:11434 — $0 per-request API cost.',
      };
    }
    return {
      reachable: false,
      detail: `Local Ollama responded with HTTP ${res.status} at http://127.0.0.1:11434.`,
    };
  } catch {
    window.clearTimeout(timer);
    return {
      reachable: false,
      detail:
        "Local Ollama daemon not detected at http://127.0.0.1:11434. Local AI execution requires running 'ollama serve' + a local backend worker on your machine (cannot run inside Google's hosted cloud runtime unless bridged).",
    };
  }
}

async function buildClientFallbackProviderCatalog(): Promise<OrchestratorProviderCatalog> {
  const ollamaProbe = await probeLocalOllamaFromClient();
  return {
    providers: [
      {
        id: 'ollama_local',
        name: 'Ollama Local Worker (Zero API Charge)',
        costPolicy: 'zero_api_charge_local',
        available: ollamaProbe.reachable,
        endpointOrModel: 'http://127.0.0.1:11434 · llama3.2:3b',
        sessionCallsUsed: clientSessionCounters.ollama_local,
        sessionCallsLimit: 500,
        statusDetail: ollamaProbe.detail,
        requiresLocalWorker: true,
      },
      {
        id: 'gemini_free_tier',
        name: 'Gemini Free-Tier Hosted API (Bounded Quota)',
        costPolicy: 'free_tier_hosted',
        available: false,
        endpointOrModel: 'gemini-3.8-flash (Server-Side SDK)',
        sessionCallsUsed: clientSessionCounters.gemini_free_tier,
        sessionCallsLimit: 25,
        statusDetail:
          'Requires server-side /api/orchestrator endpoint with GEMINI_API_KEY configured. Will not silently fall back to a paid API.',
        requiresLocalWorker: false,
      },
      {
        id: 'deterministic_local',
        name: 'Deterministic Local Planner & Parser (Zero-Cost Built-In)',
        costPolicy: 'zero_cost_deterministic',
        available: true,
        endpointOrModel: 'In-Process Structured Rule & Transcript Parser',
        sessionCallsUsed: clientSessionCounters.deterministic_local,
        sessionCallsLimit: 1000,
        statusDetail:
          'Always available with $0 API cost and zero external network dependencies. Parses user goals and authorized transcript segments deterministically.',
        requiresLocalWorker: false,
      },
    ],
    policy: {
      zeroCostFirst: true,
      silentPaidFallbackAllowed: false,
      firebaseBillingPlan: 'Spark / Free-Tier Quota Guarded',
      supportedRealWorkers: ['clip_brief_generation'],
    },
  };
}

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

export async function fetchOrchestratorProviders(): Promise<OrchestratorProviderCatalog> {
  try {
    const res = await fetch('/api/orchestrator/providers');
    if (res.ok && isJsonResponse(res)) {
      return (await res.json()) as OrchestratorProviderCatalog;
    }
  } catch {
    // Fall through to client-side provider inspection
  }
  return buildClientFallbackProviderCatalog();
}

export async function requestBossTaskPlan(params: {
  goal: Goal;
  agents: Agent[];
  providerId: ModelProviderId;
  ownerUid: string;
}): Promise<{
  planRecord: Omit<DelegationPlanRecord, 'createdAt' | 'updatedAt'>;
  tasks: ProposedPlanTask[];
  executionOrder: string[];
  providerStatus: ProviderStatusInfo;
}> {
  const goalCheck = validateGoalForDelegation(params.goal.title);
  if (!goalCheck.valid) {
    throw new Error(goalCheck.error);
  }

  try {
    const res = await fetch('/api/orchestrator/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalTitle: goalCheck.sanitizedGoalTitle,
        providerId: params.providerId,
      }),
    });

    if (isJsonResponse(res)) {
      const payload = (await res.json()) as {
        error?: string;
        rawPlan?: unknown;
        providerStatus?: ProviderStatusInfo;
      };
      if (!res.ok || payload.error) {
        throw new Error(
          payload.error || `Task planning failed with HTTP ${res.status}`
        );
      }

      const normalized = validateAndNormalizeStructuredPlan(
        payload.rawPlan,
        params.goal,
        params.agents,
        params.providerId,
        params.ownerUid
      );
      return {
        ...normalized,
        providerStatus: payload.providerStatus!,
      };
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes('[Zero-Fallback Policy]')
    ) {
      throw err;
    }
  }

  // Direct execution when running without Express API proxy
  const catalog = await buildClientFallbackProviderCatalog();
  const providerStatus = catalog.providers.find(
    (p) => p.id === params.providerId
  )!;

  if (params.providerId === 'ollama_local') {
    if (!providerStatus.available) {
      throw new Error(
        `[Zero-Fallback Policy] Ollama Local Provider is unavailable: ${providerStatus.statusDetail} Select another provider explicitly if you wish to proceed.`
      );
    }
  }

  if (params.providerId === 'gemini_free_tier') {
    throw new Error(
      `[Zero-Fallback Policy] Gemini Free-Tier Hosted Provider is unavailable: ${providerStatus.statusDetail} Select another provider explicitly if you wish to proceed.`
    );
  }

  clientSessionCounters.deterministic_local += 1;
  const rawPlan = buildDeterministicPlanPayload(goalCheck.sanitizedGoalTitle);
  const normalized = validateAndNormalizeStructuredPlan(
    rawPlan,
    params.goal,
    params.agents,
    params.providerId,
    params.ownerUid
  );

  return {
    ...normalized,
    providerStatus: {
      ...providerStatus,
      sessionCallsUsed: clientSessionCounters.deterministic_local,
    },
  };
}

export async function executeClipBriefGeneratorWorker(params: {
  goalTitle: string;
  transcriptText: string;
  permissionConfirmed: boolean;
  planApproved: boolean;
  planId: string;
  taskId: string;
  agentId: string;
  jobId: string;
  providerId: ModelProviderId;
  ownerUid: string;
}): Promise<{
  briefs: Array<Omit<ClipBriefRecord, 'createdAt' | 'updatedAt'>>;
  transcriptExcerpt: string;
  providerStatus: ProviderStatusInfo;
}> {
  if (!params.planApproved) {
    throw new Error(
      'Execution rejected: Task plan must be approved before running the Clip Brief Generator worker.'
    );
  }

  if (!isSupportedRealWorkerTaskType('clip_brief_generation')) {
    throw new Error('Clip Brief Generator worker is not enabled.');
  }

  const transcriptCheck = validateAuthorizedTranscriptInput({
    transcriptText: params.transcriptText,
    permissionConfirmed: params.permissionConfirmed,
  });
  if (!transcriptCheck.valid) {
    throw new Error(transcriptCheck.error);
  }

  try {
    const res = await fetch('/api/orchestrator/execute-clip-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goalTitle: params.goalTitle,
        transcriptText: transcriptCheck.sanitizedTranscript,
        permissionConfirmed: params.permissionConfirmed,
        planApproved: params.planApproved,
        taskType: 'clip_brief_generation',
        providerId: params.providerId,
      }),
    });

    if (isJsonResponse(res)) {
      const payload = (await res.json()) as {
        error?: string;
        rawBriefs?: unknown;
        transcriptExcerpt?: string;
        providerStatus?: ProviderStatusInfo;
      };
      if (!res.ok || payload.error) {
        throw new Error(
          payload.error ||
            `Clip Brief Generator failed with HTTP ${res.status}`
        );
      }

      const briefs = validateClipBriefWorkerOutput(payload.rawBriefs, {
        jobId: params.jobId,
        planId: params.planId,
        taskId: params.taskId,
        agentId: params.agentId,
        ownerUid: params.ownerUid,
      });

      return {
        briefs,
        transcriptExcerpt:
          payload.transcriptExcerpt || transcriptCheck.excerpt,
        providerStatus: payload.providerStatus!,
      };
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes('[Zero-Fallback Policy]')
    ) {
      throw err;
    }
  }

  const catalog = await buildClientFallbackProviderCatalog();
  const providerStatus = catalog.providers.find(
    (p) => p.id === params.providerId
  )!;

  if (params.providerId === 'ollama_local') {
    if (!providerStatus.available) {
      throw new Error(
        `[Zero-Fallback Policy] Ollama Local Provider is unavailable: ${providerStatus.statusDetail} Select another provider explicitly if you wish to proceed.`
      );
    }
  }

  if (params.providerId === 'gemini_free_tier') {
    throw new Error(
      `[Zero-Fallback Policy] Gemini Free-Tier Hosted Provider is unavailable: ${providerStatus.statusDetail} Select another provider explicitly if you wish to proceed.`
    );
  }

  clientSessionCounters.deterministic_local += 1;
  const rawBriefs = buildDeterministicClipBriefsPayload(
    transcriptCheck.sanitizedTranscript,
    params.goalTitle
  );
  const briefs = validateClipBriefWorkerOutput(rawBriefs, {
    jobId: params.jobId,
    planId: params.planId,
    taskId: params.taskId,
    agentId: params.agentId,
    ownerUid: params.ownerUid,
  });

  return {
    briefs,
    transcriptExcerpt: transcriptCheck.excerpt,
    providerStatus: {
      ...providerStatus,
      sessionCallsUsed: clientSessionCounters.deterministic_local,
    },
  };
}
