import { AGENT_SHADOW_CANARY_MAX_WORKER_TASKS, evaluateAgentShadowCanary } from "@/lib/intelligence/agent-shadow-canary";
import { runAgentWorkerShadow } from "@/lib/intelligence/agent-worker-runtime";
import { createConfiguredAdvisoryAgentWorker } from "@/lib/intelligence/agent-worker";
import { createConfiguredReadOnlyAgentToolBroker } from "@/lib/intelligence/agent-tool-broker";
import {
  findToolsForRequest,
  publicToolDescriptor,
} from "@/lib/intelligence/tool-registry";
import {
  sanitizeAgentControlTelemetry,
  type AgentControlTelemetry,
} from "@/lib/intelligence/agent-control-telemetry";
import type { IntelligenceRequest } from "@/types/intelligence";

type EnvironmentLike = Readonly<Record<string, string | undefined>>;

const MANUAL_CANARY_CAPABILITIES = ["recommend", "knowledge"] as const;
const SYNTHETIC_SESSION_ID = "admin-preview-manual-shadow-canary";

export type ManualAgentCanaryGate = ReturnType<
  typeof evaluateManualAgentCanary
>;

export type ManualAgentCanaryResult = Readonly<{
  runId: string;
  environment: string;
  control: AgentControlTelemetry;
  worker: Readonly<{
    status: string;
    attemptedTasks: number;
    completedTasks: number;
    failedTasks: number;
    modelCalls: number;
    brokerCalls: number;
    brokerCompleted: number;
    brokerRejected: number;
    brokerFailed: number;
    acceptedDelegations: number;
    rejectedDelegations: number;
  }>;
}>;

export function buildManualAgentCanaryRequest(
  now = new Date(),
): IntelligenceRequest {
  return {
    message:
      "Synthetic preview canary: identify one reviewed St. Thomas beach and one reviewed USVI heritage record using only read-only evidence. Do not plan transportation, create or modify bookings, make payments, write data, send messages, deploy code, or request write/execute authority.",
    context: {
      sessionId: SYNTHETIC_SESSION_ID,
      page: "concierge",
      island: "stt",
      now: now.toISOString(),
      timezone: "America/St_Thomas",
      party: { adults: 1, children: 0 },
      preferences: {
        interests: ["beaches", "heritage"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {},
    },
    capabilities: [...MANUAL_CANARY_CAPABILITIES],
  };
}

export function evaluateManualAgentCanary(
  env: EnvironmentLike = process.env,
) {
  const decision = evaluateAgentShadowCanary(
    buildManualAgentCanaryRequest(new Date(0)),
    {
      ...env,
      // A deliberate admin click is the cohort. This only overrides sampling;
      // the existing canary/worker/broker/key gates and environment hard deny
      // remain authoritative.
      USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "10000",
    },
  );

  // Manual execution is narrower than automatic shadow sampling: Vercel
  // preview only. Development, test, unknown, and production all fail closed.
  if (decision.environment !== "preview") {
    return Object.freeze({
      ...decision,
      selected: false,
      reason: "environment_denied" as const,
    });
  }

  return decision;
}

export async function runManualAgentCanary(
  runId: string,
  gate: ManualAgentCanaryGate = evaluateManualAgentCanary(),
): Promise<ManualAgentCanaryResult> {
  if (!gate.selected || gate.environment !== "preview") {
    throw new Error("Manual agent canary is not authorized in this environment.");
  }

  const request = buildManualAgentCanaryRequest();
  const tools = findToolsForRequest(request, [...MANUAL_CANARY_CAPABILITIES]).map(
    publicToolDescriptor,
  );

  const unsafeTool = tools.find(
    (tool) =>
      tool.requiresConfirmation ||
      tool.risk === "high" ||
      tool.permissions.length === 0 ||
      tool.permissions.some((permission) => permission !== "read"),
  );
  if (unsafeTool) {
    throw new Error("Manual canary tool set failed the read-only safety check.");
  }

  const worker = createConfiguredAdvisoryAgentWorker();
  const broker = createConfiguredReadOnlyAgentToolBroker();
  if (!worker || !broker) {
    throw new Error("Manual canary worker or read-only broker is unavailable.");
  }

  const result = await runAgentWorkerShadow({
    request,
    requiredCapabilities: [...MANUAL_CANARY_CAPABILITIES],
    tools,
    worker,
    broker,
    maxWorkerTasks: AGENT_SHADOW_CANARY_MAX_WORKER_TASKS,
  });

  const workerShadow = result.workerShadow;
  const control = sanitizeAgentControlTelemetry({
    shadowCanary: {
      selected: true,
      reason: "manual_admin_run",
      environment: gate.environment,
      sampleRateBps: 0,
      sampleBucket: null,
      explicitCohort: true,
      maxWorkerTasks: AGENT_SHADOW_CANARY_MAX_WORKER_TASKS,
    },
    collective: {
      status: result.coordination.status,
      agents: result.coordination.team.map((member) => member.agentId),
      taskCount: result.coordination.tasks.length,
      messageCount: result.coordination.messageCount,
      missingCapabilities: result.coordination.missingCapabilities,
      workerShadow: {
        status: workerShadow.status,
        workerId: workerShadow.workerId,
        model: workerShadow.model,
        attemptedTasks: workerShadow.attemptedTasks,
        completedTasks: workerShadow.completedTasks,
        failedTasks: workerShadow.failedTasks,
        modelCalls: workerShadow.modelCalls,
        acceptedDelegations: workerShadow.acceptedDelegations,
        rejectedDelegations: workerShadow.rejectedDelegations,
        brokerCalls: workerShadow.brokerCalls,
        brokerCompleted: workerShadow.brokerCompleted,
        brokerRejected: workerShadow.brokerRejected,
        brokerFailed: workerShadow.brokerFailed,
      },
    },
  });

  return Object.freeze({
    runId,
    environment: gate.environment,
    control,
    worker: Object.freeze({
      status: workerShadow.status,
      attemptedTasks: workerShadow.attemptedTasks,
      completedTasks: workerShadow.completedTasks,
      failedTasks: workerShadow.failedTasks,
      modelCalls: workerShadow.modelCalls,
      brokerCalls: workerShadow.brokerCalls,
      brokerCompleted: workerShadow.brokerCompleted,
      brokerRejected: workerShadow.brokerRejected,
      brokerFailed: workerShadow.brokerFailed,
      acceptedDelegations: workerShadow.acceptedDelegations,
      rejectedDelegations: workerShadow.rejectedDelegations,
    }),
  });
}
