import { createHash } from "node:crypto";

import {
  createFirestoreOperatorCanaryRunStore,
  type OperatorCanaryRunStore,
  type OperatorCanarySafeRecord,
} from "@/lib/intelligence/agent-control-store";
import { ReadOnlyAgentToolBroker } from "@/lib/intelligence/agent-tool-broker";
import {
  OpenAIAdvisoryAgentWorker,
  type AgentWorker,
} from "@/lib/intelligence/agent-worker";
import { runAgentWorkerShadow } from "@/lib/intelligence/agent-worker-runtime";
import {
  getIntelligenceTool,
  publicToolDescriptor,
} from "@/lib/intelligence/tool-registry";
import type { IntelligenceRequest } from "@/types/intelligence";

const OPERATOR_CANARY_VERSION = "operator-preview-canary-v1";
export const OPERATOR_CANARY_FIXED_MESSAGE =
  "Find a reviewed St. Thomas beach and explain why it fits a first-time visitor.";

export type OperatorPreviewCanaryReason =
  | "selected"
  | "environment_denied"
  | "preview_environment_required"
  | "canary_disabled"
  | "worker_disabled"
  | "broker_disabled"
  | "missing_openai_key"
  | "missing_deployment_sha"
  | "idempotency_unavailable"
  | "already_running"
  | "already_completed"
  | "already_failed"
  | "execution_failed";

export type OperatorPreviewCanaryDecision = Readonly<{
  selected: boolean;
  reason: OperatorPreviewCanaryReason;
  environment: "preview" | "production" | "development" | "test" | "unknown";
}>;

export type OperatorPreviewCanaryResult = Readonly<{
  status:
    | "completed"
    | "denied"
    | "already_running"
    | "already_completed"
    | "already_failed"
    | "failed";
  reason: OperatorPreviewCanaryReason;
  environment: OperatorPreviewCanaryDecision["environment"];
  worker: OperatorCanarySafeRecord["worker"] | null;
}>;

type EnvironmentLike = Readonly<Record<string, string | undefined>>;

type RunOptions = Readonly<{
  env?: EnvironmentLike;
  store?: OperatorCanaryRunStore | null;
  worker?: AgentWorker;
  broker?: ReadOnlyAgentToolBroker;
  now?: () => Date;
}>;

function resolveEnvironment(
  env: EnvironmentLike,
): OperatorPreviewCanaryDecision["environment"] {
  const vercel = env.VERCEL_ENV?.trim().toLowerCase();
  if (vercel === "preview") return "preview";
  if (vercel === "production") return "production";
  if (vercel === "development") return "development";
  const node = env.NODE_ENV?.trim().toLowerCase();
  if (node === "production") return "production";
  if (node === "development") return "development";
  if (node === "test") return "test";
  return "unknown";
}

export function evaluateOperatorPreviewCanary(
  env: EnvironmentLike = process.env,
): OperatorPreviewCanaryDecision {
  const environment = resolveEnvironment(env);

  // Production is categorically denied in code. No environment flag can
  // promote this operator canary into production authority.
  if (environment === "production") {
    return Object.freeze({
      selected: false,
      reason: "environment_denied",
      environment,
    });
  }
  if (environment !== "preview") {
    return Object.freeze({
      selected: false,
      reason: "preview_environment_required",
      environment,
    });
  }
  if (env.USVI_AGENT_SHADOW_CANARY !== "1") {
    return Object.freeze({
      selected: false,
      reason: "canary_disabled",
      environment,
    });
  }
  if (env.USVI_AGENT_WORKERS_SHADOW !== "1") {
    return Object.freeze({
      selected: false,
      reason: "worker_disabled",
      environment,
    });
  }
  if (env.USVI_AGENT_TOOL_BROKER_SHADOW !== "1") {
    return Object.freeze({
      selected: false,
      reason: "broker_disabled",
      environment,
    });
  }
  if (!env.OPENAI_API_KEY?.trim()) {
    return Object.freeze({
      selected: false,
      reason: "missing_openai_key",
      environment,
    });
  }
  if (!env.VERCEL_GIT_COMMIT_SHA?.trim()) {
    return Object.freeze({
      selected: false,
      reason: "missing_deployment_sha",
      environment,
    });
  }
  return Object.freeze({ selected: true, reason: "selected", environment });
}

function runKeyForDeployment(commitSha: string) {
  return createHash("sha256")
    .update(`${OPERATOR_CANARY_VERSION}:${commitSha.trim().toLowerCase()}`)
    .digest("hex");
}

function fixedRequest(runKey: string, now: Date): IntelligenceRequest {
  return {
    message: OPERATOR_CANARY_FIXED_MESSAGE,
    context: {
      sessionId: `operator-canary-${runKey.slice(0, 16)}`,
      page: "concierge",
      island: "stt",
      now: now.toISOString(),
      timezone: "America/St_Thomas",
      party: { adults: 1, children: 0 },
      preferences: {
        interests: ["beaches"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {},
    },
    capabilities: ["recommend"],
  };
}

export function getOperatorPreviewCanaryToolIds() {
  return Object.freeze(["directory.search"] as const);
}

function conservativeModelCallAttempts(
  worker: Awaited<ReturnType<typeof runAgentWorkerShadow>>["workerShadow"],
) {
  // runAgentWorkerShadow currently counts resolved model calls. A provider
  // failure can therefore leave modelCalls at zero even though an attempt was
  // made. For this one-task canary, record a conservative lower bound so a
  // failed provider call never disappears from cost/control telemetry.
  if (worker.failedTasks === 0) return worker.modelCalls;
  const minimumAttempts = worker.brokerCompleted > 0 ? 2 : 1;
  return Math.max(worker.modelCalls, minimumAttempts);
}

function safeRecord(
  result: Awaited<ReturnType<typeof runAgentWorkerShadow>>,
): OperatorCanarySafeRecord {
  const worker = result.workerShadow;
  return Object.freeze({
    version: 1 as const,
    environment: "preview" as const,
    worker: Object.freeze({
      status: worker.status,
      workerId: worker.workerId,
      model: worker.model,
      attemptedTasks: worker.attemptedTasks,
      completedTasks: worker.completedTasks,
      failedTasks: worker.failedTasks,
      modelCalls: conservativeModelCallAttempts(worker),
      acceptedDelegations: worker.acceptedDelegations,
      rejectedDelegations: worker.rejectedDelegations,
      brokerCalls: worker.brokerCalls,
      brokerCompleted: worker.brokerCompleted,
      brokerRejected: worker.brokerRejected,
      brokerFailed: worker.brokerFailed,
    }),
    agentIds: Object.freeze(
      result.coordination.team.map((member) => member.agentId).slice(0, 8),
    ),
    taskCount: result.coordination.tasks.length,
    messageCount: result.coordination.messageCount,
    missingCapabilities: Object.freeze(
      [...result.coordination.missingCapabilities].slice(0, 8),
    ),
  });
}

function priorStatusResult(
  status: "running" | "completed" | "failed" | null,
  environment: OperatorPreviewCanaryDecision["environment"],
): OperatorPreviewCanaryResult {
  if (status === "completed") {
    return Object.freeze({
      status: "already_completed",
      reason: "already_completed",
      environment,
      worker: null,
    });
  }
  if (status === "failed") {
    return Object.freeze({
      status: "already_failed",
      reason: "already_failed",
      environment,
      worker: null,
    });
  }
  return Object.freeze({
    status: "already_running",
    reason: "already_running",
    environment,
    worker: null,
  });
}

export async function runOperatorPreviewCanary(
  options: RunOptions = {},
): Promise<OperatorPreviewCanaryResult> {
  const env = options.env ?? process.env;
  const decision = evaluateOperatorPreviewCanary(env);
  if (!decision.selected) {
    return Object.freeze({
      status: "denied",
      reason: decision.reason,
      environment: decision.environment,
      worker: null,
    });
  }

  const store =
    options.store === undefined
      ? createFirestoreOperatorCanaryRunStore()
      : options.store;
  if (!store) {
    return Object.freeze({
      status: "denied",
      reason: "idempotency_unavailable",
      environment: decision.environment,
      worker: null,
    });
  }

  const commitSha = env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (!commitSha) {
    return Object.freeze({
      status: "denied",
      reason: "missing_deployment_sha",
      environment: decision.environment,
      worker: null,
    });
  }
  const runKey = runKeyForDeployment(commitSha);
  const claim = await store.claim(runKey);
  if (!claim.claimed) {
    return priorStatusResult(claim.status, decision.environment);
  }

  try {
    const directoryTool = getIntelligenceTool("directory.search");
    if (!directoryTool) {
      throw new Error("Operator canary read-only tool is unavailable.");
    }

    const worker =
      options.worker ??
      new OpenAIAdvisoryAgentWorker({
        apiKey: env.OPENAI_API_KEY ?? "",
        timeoutMs: 3_000,
        maxOutputTokens: 300,
      });
    const broker =
      options.broker ?? new ReadOnlyAgentToolBroker({ timeoutMs: 1_000 });
    const result = await runAgentWorkerShadow({
      request: fixedRequest(runKey, (options.now ?? (() => new Date()))()),
      requiredCapabilities: ["recommend"],
      tools: [publicToolDescriptor(directoryTool)],
      worker,
      broker,
      maxWorkerTasks: 1,
    });
    const record = safeRecord(result);

    if (record.worker.status !== "completed") {
      await store.fail(runKey, record);
      return Object.freeze({
        status: "failed",
        reason: "execution_failed",
        environment: decision.environment,
        worker: record.worker,
      });
    }

    await store.complete(runKey, record);
    return Object.freeze({
      status: "completed",
      reason: "selected",
      environment: decision.environment,
      worker: record.worker,
    });
  } catch {
    try {
      await store.fail(runKey);
    } catch {
      // The original canary failure remains authoritative; never retry here.
    }
    return Object.freeze({
      status: "failed",
      reason: "execution_failed",
      environment: decision.environment,
      worker: null,
    });
  }
}
