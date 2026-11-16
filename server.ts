import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  ModelProviderId,
  ProviderStatusInfo,
} from './src/types/mission';
import {
  buildDeterministicClipBriefsPayload,
  buildDeterministicPlanPayload,
  isSupportedRealWorkerTaskType,
  RawClipBriefWorkerResponse,
  RawStructuredPlanPayload,
  validateAuthorizedTranscriptInput,
  validateGoalForDelegation,
} from './src/utils/orchestrationLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const OLLAMA_BASE_URL = (
  process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
).replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

// Explicit zero-cost / free-tier session call limits (never auto-upgrades or enables paid billing)
const GEMINI_FREE_TIER_MODEL = 'gemini-3.8-flash';
const GEMINI_SESSION_CALL_LIMIT = 25;
const OLLAMA_SESSION_CALL_LIMIT = 500;
const DETERMINISTIC_SESSION_CALL_LIMIT = 1000;

const sessionCallCounters: Record<ModelProviderId, number> = {
  ollama_local: 0,
  gemini_free_tier: 0,
  deterministic_local: 0,
};

/**
 * Common ModelProviderAdapter interface so MissionTown can switch cleanly
 * between a local Ollama worker, an optional free-tier hosted Gemini model,
 * or the built-in zero-cost deterministic local engine without silent paid fallbacks.
 */
export interface ServerModelProviderAdapter {
  id: ModelProviderId;
  checkStatus(): Promise<ProviderStatusInfo>;
  generateTaskPlan(goalTitle: string): Promise<RawStructuredPlanPayload>;
  generateClipBriefs(
    transcriptText: string,
    goalTitle: string
  ): Promise<RawClipBriefWorkerResponse>;
}

async function pingLocalOllama(): Promise<{
  reachable: boolean;
  detail: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return {
        reachable: false,
        detail: `Local Ollama responded with HTTP ${res.status} at ${OLLAMA_BASE_URL}.`,
      };
    }
    return {
      reachable: true,
      detail: `Connected to local Ollama worker (${OLLAMA_MODEL}) at ${OLLAMA_BASE_URL} — $0 per-request API cost.`,
    };
  } catch {
    clearTimeout(timeout);
    return {
      reachable: false,
      detail: `Local Ollama daemon not detected at ${OLLAMA_BASE_URL}. Local AI execution requires running 'ollama serve' + the MissionTown server on your local machine (it cannot run inside Google's hosted cloud container unless bridged).`,
    };
  }
}

const ollamaLocalProvider: ServerModelProviderAdapter = {
  id: 'ollama_local',
  async checkStatus() {
    const probe = await pingLocalOllama();
    return {
      id: 'ollama_local',
      name: 'Ollama Local Worker (Zero API Charge)',
      costPolicy: 'zero_api_charge_local',
      available: probe.reachable,
      endpointOrModel: `${OLLAMA_BASE_URL} · ${OLLAMA_MODEL}`,
      sessionCallsUsed: sessionCallCounters.ollama_local,
      sessionCallsLimit: OLLAMA_SESSION_CALL_LIMIT,
      statusDetail: probe.detail,
      requiresLocalWorker: true,
    };
  },
  async generateTaskPlan(goalTitle) {
    const probe = await pingLocalOllama();
    if (!probe.reachable) {
      throw new Error(
        `[Zero-Fallback Policy] Ollama Local Provider is unavailable: ${probe.detail} Select another provider explicitly if you wish to proceed.`
      );
    }
    if (sessionCallCounters.ollama_local >= OLLAMA_SESSION_CALL_LIMIT) {
      throw new Error(
        `Ollama local session safety cap reached (${OLLAMA_SESSION_CALL_LIMIT} calls).`
      );
    }
    sessionCallCounters.ollama_local += 1;

    const prompt = `You are "The Boss" in MissionTown. Decompose this company goal into 4 structured tasks for our AI agent team: "${goalTitle}".
Return ONLY valid JSON with a top-level "tasks" array. Each item must have:
- "id": string ("ptask-1", "ptask-2", etc.)
- "title": string
- "description": string
- "taskType": one of ["clip_brief_generation", "transcript_indexing", "video_reframe_spec", "caption_styling_spec", "quality_gate_audit", "growth_retention_plan", "creator_outreach_draft"]
- "dependsOnTaskIds": array of task id strings.
Ensure "ptask-1" has taskType "clip_brief_generation" and dependsOnTaskIds [].`;

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        format: 'json',
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama /api/generate failed with HTTP ${res.status}.`);
    }
    const data = (await res.json()) as { response?: string };
    return JSON.parse(data.response || '{}') as RawStructuredPlanPayload;
  },
  async generateClipBriefs(transcriptText, goalTitle) {
    const probe = await pingLocalOllama();
    if (!probe.reachable) {
      throw new Error(
        `[Zero-Fallback Policy] Ollama Local Provider is unavailable: ${probe.detail} Select another provider explicitly if you wish to proceed.`
      );
    }
    if (sessionCallCounters.ollama_local >= OLLAMA_SESSION_CALL_LIMIT) {
      throw new Error(
        `Ollama local session safety cap reached (${OLLAMA_SESSION_CALL_LIMIT} calls).`
      );
    }
    sessionCallCounters.ollama_local += 1;

    const prompt = `You are the MissionTown Clip Brief Generator worker.
Company Goal: "${goalTitle}"
Authorized Transcript:
"""
${transcriptText}
"""
Extract 3 short-form vertical (9:16) clip briefs from this transcript. Return ONLY valid JSON with a top-level "briefs" array where each item has:
- "clipTitle": string
- "hookLine": string
- "segmentTimestamp": string
- "segmentQuote": string
- "estimatedDurationSec": number (between 20 and 60)
- "aspectRatio": "9:16"
- "captionDraft": string
- "retentionRationale": string`;

    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        format: 'json',
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama /api/generate failed with HTTP ${res.status}.`);
    }
    const data = (await res.json()) as { response?: string };
    return JSON.parse(data.response || '{}') as RawClipBriefWorkerResponse;
  },
};

function isGeminiKeyConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() && key !== 'MY_GEMINI_API_KEY');
}

const geminiFreeTierProvider: ServerModelProviderAdapter = {
  id: 'gemini_free_tier',
  async checkStatus() {
    const hasKey = isGeminiKeyConfigured();
    const withinQuota =
      sessionCallCounters.gemini_free_tier < GEMINI_SESSION_CALL_LIMIT;
    return {
      id: 'gemini_free_tier',
      name: 'Gemini Free-Tier Hosted API (Bounded Quota)',
      costPolicy: 'free_tier_hosted',
      available: hasKey && withinQuota,
      endpointOrModel: `${GEMINI_FREE_TIER_MODEL} (Server-Side SDK)`,
      sessionCallsUsed: sessionCallCounters.gemini_free_tier,
      sessionCallsLimit: GEMINI_SESSION_CALL_LIMIT,
      statusDetail: !hasKey
        ? 'GEMINI_API_KEY is not configured in this environment. No paid API fallback will occur.'
        : !withinQuota
        ? `Free-tier session quota reached (${GEMINI_SESSION_CALL_LIMIT}/${GEMINI_SESSION_CALL_LIMIT} calls).`
        : `Ready via server-side @google/genai (${GEMINI_FREE_TIER_MODEL}) with strict ${GEMINI_SESSION_CALL_LIMIT}-call session cap.`,
      requiresLocalWorker: false,
    };
  },
  async generateTaskPlan(goalTitle) {
    if (!isGeminiKeyConfigured()) {
      throw new Error(
        '[Zero-Fallback Policy] GEMINI_API_KEY is not configured. Will not silently switch providers.'
      );
    }
    if (sessionCallCounters.gemini_free_tier >= GEMINI_SESSION_CALL_LIMIT) {
      throw new Error(
        `[Zero-Fallback Policy] Free-tier session quota reached (${GEMINI_SESSION_CALL_LIMIT} calls). Will not upgrade to paid billing.`
      );
    }
    sessionCallCounters.gemini_free_tier += 1;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: GEMINI_FREE_TIER_MODEL,
      contents: `You are "The Boss", Executive Orchestrator of MissionTown (an AI short-form video clipping company).
Create a 4-step task delegation plan for this company goal: "${goalTitle}".
Task #1 ("ptask-1") MUST have taskType "clip_brief_generation" and dependsOnTaskIds [].
Subsequent tasks ("ptask-2", "ptask-3", "ptask-4") should cover complementary stages from ["video_reframe_spec", "quality_gate_audit", "growth_retention_plan", "creator_outreach_draft"] and reference earlier task IDs in dependsOnTaskIds.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  taskType: { type: Type.STRING },
                  dependsOnTaskIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: [
                  'id',
                  'title',
                  'description',
                  'taskType',
                  'dependsOnTaskIds',
                ],
              },
            },
          },
          required: ['tasks'],
        },
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as RawStructuredPlanPayload;
  },
  async generateClipBriefs(transcriptText, goalTitle) {
    if (!isGeminiKeyConfigured()) {
      throw new Error(
        '[Zero-Fallback Policy] GEMINI_API_KEY is not configured. Will not silently switch providers.'
      );
    }
    if (sessionCallCounters.gemini_free_tier >= GEMINI_SESSION_CALL_LIMIT) {
      throw new Error(
        `[Zero-Fallback Policy] Free-tier session quota reached (${GEMINI_SESSION_CALL_LIMIT} calls). Will not upgrade to paid billing.`
      );
    }
    sessionCallCounters.gemini_free_tier += 1;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: GEMINI_FREE_TIER_MODEL,
      contents: `You are the MissionTown Clip Brief Generator worker.
Company Goal: "${goalTitle}"
Authorized Transcript:
"""
${transcriptText}
"""
Extract 3 high-retention 9:16 vertical short-form clip briefs directly from the transcript above.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            briefs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clipTitle: { type: Type.STRING },
                  hookLine: { type: Type.STRING },
                  segmentTimestamp: { type: Type.STRING },
                  segmentQuote: { type: Type.STRING },
                  estimatedDurationSec: { type: Type.INTEGER },
                  aspectRatio: { type: Type.STRING },
                  captionDraft: { type: Type.STRING },
                  retentionRationale: { type: Type.STRING },
                },
                required: [
                  'clipTitle',
                  'hookLine',
                  'segmentTimestamp',
                  'segmentQuote',
                  'estimatedDurationSec',
                  'aspectRatio',
                  'captionDraft',
                  'retentionRationale',
                ],
              },
            },
          },
          required: ['briefs'],
        },
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text) as RawClipBriefWorkerResponse;
  },
};

const deterministicLocalProvider: ServerModelProviderAdapter = {
  id: 'deterministic_local',
  async checkStatus() {
    return {
      id: 'deterministic_local',
      name: 'Deterministic Local Planner & Parser (Zero-Cost Built-In)',
      costPolicy: 'zero_cost_deterministic',
      available:
        sessionCallCounters.deterministic_local <
        DETERMINISTIC_SESSION_CALL_LIMIT,
      endpointOrModel: 'In-Process Structured Rule & Transcript Parser',
      sessionCallsUsed: sessionCallCounters.deterministic_local,
      sessionCallsLimit: DETERMINISTIC_SESSION_CALL_LIMIT,
      statusDetail:
        'Always available with $0 API cost and zero external network dependencies. Parses user goals and authorized transcript segments deterministically.',
      requiresLocalWorker: false,
    };
  },
  async generateTaskPlan(goalTitle) {
    sessionCallCounters.deterministic_local += 1;
    return buildDeterministicPlanPayload(goalTitle);
  },
  async generateClipBriefs(transcriptText, goalTitle) {
    sessionCallCounters.deterministic_local += 1;
    return buildDeterministicClipBriefsPayload(transcriptText, goalTitle);
  },
};

const PROVIDERS: Record<ModelProviderId, ServerModelProviderAdapter> = {
  ollama_local: ollamaLocalProvider,
  gemini_free_tier: geminiFreeTierProvider,
  deterministic_local: deterministicLocalProvider,
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // 1. Inspect available zero-cost / free-tier model providers & quotas
  app.get('/api/orchestrator/providers', async (_req, res) => {
    try {
      const statuses = await Promise.all([
        PROVIDERS.ollama_local.checkStatus(),
        PROVIDERS.gemini_free_tier.checkStatus(),
        PROVIDERS.deterministic_local.checkStatus(),
      ]);
      res.json({
        providers: statuses,
        policy: {
          zeroCostFirst: true,
          silentPaidFallbackAllowed: false,
          firebaseBillingPlan: 'Spark / Free-Tier Quota Guarded',
          supportedRealWorkers: ['clip_brief_generation'],
        },
      });
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Failed to inspect model providers.',
      });
    }
  });

  // 2. Propose a structured task delegation plan for a company-level goal
  app.post('/api/orchestrator/plan', async (req, res) => {
    try {
      const { goalTitle, providerId } = req.body as {
        goalTitle?: string;
        providerId?: ModelProviderId;
      };

      const goalValidation = validateGoalForDelegation(goalTitle ?? '');
      if (!goalValidation.valid) {
        res.status(400).json({ error: goalValidation.error });
        return;
      }

      if (!providerId || !(providerId in PROVIDERS)) {
        res.status(400).json({
          error:
            'Explicit valid providerId ("ollama_local", "gemini_free_tier", or "deterministic_local") is required.',
        });
        return;
      }

      const provider = PROVIDERS[providerId];
      const rawPlan = await provider.generateTaskPlan(
        goalValidation.sanitizedGoalTitle
      );
      const updatedStatus = await provider.checkStatus();

      res.json({
        providerId,
        rawPlan,
        providerStatus: updatedStatus,
      });
    } catch (err) {
      res.status(422).json({
        error:
          err instanceof Error
            ? err.message
            : 'Task planning failed on the selected provider.',
      });
    }
  });

  // 3. Execute the supported Clip Brief Generator worker (independent server-side permission & approval verification)
  app.post('/api/orchestrator/execute-clip-brief', async (req, res) => {
    try {
      const {
        goalTitle,
        transcriptText,
        permissionConfirmed,
        planApproved,
        taskType,
        providerId,
      } = req.body as {
        goalTitle?: string;
        transcriptText?: string;
        permissionConfirmed?: boolean;
        planApproved?: boolean;
        taskType?: string;
        providerId?: ModelProviderId;
      };

      // Independent server-side verification of approval, permission, and supported worker type
      if (planApproved !== true) {
        res.status(403).json({
          error:
            'Execution rejected by server: Task plan must be explicitly approved by the user before running any worker.',
        });
        return;
      }

      if (
        !taskType ||
        !isSupportedRealWorkerTaskType(taskType as 'clip_brief_generation')
      ) {
        res.status(422).json({
          error: `Execution rejected by server: Task type "${String(
            taskType
          )}" does not have a real worker implementation in Phase 4. Only "clip_brief_generation" can execute.`,
        });
        return;
      }

      const transcriptCheck = validateAuthorizedTranscriptInput({
        transcriptText: transcriptText ?? '',
        permissionConfirmed: Boolean(permissionConfirmed),
      });
      if (!transcriptCheck.valid) {
        res.status(400).json({ error: transcriptCheck.error });
        return;
      }

      if (!providerId || !(providerId in PROVIDERS)) {
        res.status(400).json({
          error:
            'Explicit valid providerId ("ollama_local", "gemini_free_tier", or "deterministic_local") is required.',
        });
        return;
      }

      const provider = PROVIDERS[providerId];
      const rawBriefs = await provider.generateClipBriefs(
        transcriptCheck.sanitizedTranscript,
        (goalTitle ?? 'Grow my clipping service').trim()
      );
      const updatedStatus = await provider.checkStatus();

      res.json({
        providerId,
        rawBriefs,
        transcriptExcerpt: transcriptCheck.excerpt,
        providerStatus: updatedStatus,
      });
    } catch (err) {
      res.status(422).json({
        error:
          err instanceof Error
            ? err.message
            : 'Clip Brief Generator worker failed on the selected provider.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `MissionTown server + zero-cost orchestrator listening on http://0.0.0.0:${PORT}`
    );
  });
}

void startServer();
