export type AgentControlCanaryTelemetry = Readonly<{
  selected: boolean;
  reason: string;
  environment: string;
  sampleRateBps: number;
  sampleBucket: number | null;
  explicitCohort: boolean;
  maxWorkerTasks: number;
}>;

export type AgentControlWorkerTelemetry = Readonly<{
  status: string;
  workerId: string | null;
  model: string | null;
  attemptedTasks: number;
  completedTasks: number;
  failedTasks: number;
  modelCalls: number;
  acceptedDelegations: number;
  rejectedDelegations: number;
  brokerCalls: number;
  brokerCompleted: number;
  brokerRejected: number;
  brokerFailed: number;
}>;

export type AgentControlCollectiveTelemetry = Readonly<{
  status: string;
  agentCount: number;
  taskCount: number;
  messageCount: number;
  missingCapabilities: readonly string[];
  workerShadow: AgentControlWorkerTelemetry | null;
}>;

export type AgentControlTelemetry = Readonly<{
  shadowCanary: AgentControlCanaryTelemetry | null;
  collective: AgentControlCollectiveTelemetry | null;
}>;

export type AgentControlEventLike = Readonly<{
  runId: string;
  createdAt: string;
  control: AgentControlTelemetry;
}>;

export type AgentControlSummary = Readonly<{
  uniqueRuns: number;
  selectedRuns: number;
  productionDeniedRuns: number;
  modelCalls: number;
  workerCompletedRuns: number;
  workerFailedRuns: number;
  brokerCalls: number;
  brokerCompleted: number;
  brokerRejected: number;
  brokerFailed: number;
  acceptedDelegations: number;
  rejectedDelegations: number;
  latestSelectedAt: string | null;
  latestEnvironment: string | null;
  state: "awaiting_preview_samples" | "clean_preview_evidence" | "review_required";
}>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback = "unknown", max = 120) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : fallback;
}

function count(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function boolean(value: unknown) {
  return value === true;
}

function stringArray(value: unknown, maxItems = 12) {
  if (!Array.isArray(value)) return Object.freeze([]) as readonly string[];
  return Object.freeze(
    Array.from(
      new Set(
        value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().slice(0, 120))
          .filter(Boolean),
      ),
    ).slice(0, maxItems),
  );
}

function canaryTelemetry(value: unknown): AgentControlCanaryTelemetry | null {
  const source = record(value);
  if (!source) return null;
  const bucketValue = Number(source.sampleBucket);
  return Object.freeze({
    selected: boolean(source.selected),
    reason: text(source.reason),
    environment: text(source.environment),
    sampleRateBps: Math.min(10_000, count(source.sampleRateBps)),
    sampleBucket:
      source.sampleBucket === null || source.sampleBucket === undefined || !Number.isFinite(bucketValue)
        ? null
        : Math.max(0, Math.min(9_999, Math.trunc(bucketValue))),
    explicitCohort: boolean(source.explicitCohort),
    maxWorkerTasks: Math.min(4, count(source.maxWorkerTasks)),
  });
}

function workerTelemetry(value: unknown): AgentControlWorkerTelemetry | null {
  const source = record(value);
  if (!source) return null;
  return Object.freeze({
    status: text(source.status),
    workerId: typeof source.workerId === "string" ? source.workerId.slice(0, 120) : null,
    model: typeof source.model === "string" ? source.model.slice(0, 120) : null,
    attemptedTasks: count(source.attemptedTasks),
    completedTasks: count(source.completedTasks),
    failedTasks: count(source.failedTasks),
    modelCalls: count(source.modelCalls),
    acceptedDelegations: count(source.acceptedDelegations),
    rejectedDelegations: count(source.rejectedDelegations),
    brokerCalls: count(source.brokerCalls),
    brokerCompleted: count(source.brokerCompleted),
    brokerRejected: count(source.brokerRejected),
    brokerFailed: count(source.brokerFailed),
  });
}

function collectiveTelemetry(value: unknown): AgentControlCollectiveTelemetry | null {
  const source = record(value);
  if (!source) return null;
  const agents = stringArray(source.agents, 8);
  return Object.freeze({
    status: text(source.status),
    agentCount: agents.length,
    taskCount: count(source.taskCount),
    messageCount: count(source.messageCount),
    missingCapabilities: stringArray(source.missingCapabilities, 8),
    workerShadow: workerTelemetry(source.workerShadow),
  });
}

export function sanitizeAgentControlTelemetry(payload: unknown): AgentControlTelemetry {
  const source = record(payload);
  return Object.freeze({
    shadowCanary: canaryTelemetry(source?.shadowCanary),
    collective: collectiveTelemetry(source?.collective),
  });
}

export function summarizeAgentControlEvents(
  events: readonly AgentControlEventLike[],
): AgentControlSummary {
  const unique = new Map<string, AgentControlEventLike>();
  for (const event of events) {
    const existing = unique.get(event.runId);
    if (
      !existing ||
      new Date(event.createdAt).getTime() > new Date(existing.createdAt).getTime()
    ) {
      unique.set(event.runId, event);
    }
  }

  const runs = Array.from(unique.values());
  let selectedRuns = 0;
  let productionDeniedRuns = 0;
  let modelCalls = 0;
  let workerCompletedRuns = 0;
  let workerFailedRuns = 0;
  let brokerCalls = 0;
  let brokerCompleted = 0;
  let brokerRejected = 0;
  let brokerFailed = 0;
  let acceptedDelegations = 0;
  let rejectedDelegations = 0;
  let latestSelectedAt: string | null = null;
  let latestEnvironment: string | null = null;

  for (const event of runs) {
    const canary = event.control.shadowCanary;
    const worker = event.control.collective?.workerShadow;
    if (canary?.selected) {
      selectedRuns += 1;
      if (
        !latestSelectedAt ||
        new Date(event.createdAt).getTime() > new Date(latestSelectedAt).getTime()
      ) {
        latestSelectedAt = event.createdAt;
        latestEnvironment = canary.environment;
      }
    }
    if (canary?.environment === "production" && canary.reason === "environment_denied") {
      productionDeniedRuns += 1;
    }
    if (!worker || worker.status === "disabled") continue;

    modelCalls += worker.modelCalls;
    brokerCalls += worker.brokerCalls;
    brokerCompleted += worker.brokerCompleted;
    brokerRejected += worker.brokerRejected;
    brokerFailed += worker.brokerFailed;
    acceptedDelegations += worker.acceptedDelegations;
    rejectedDelegations += worker.rejectedDelegations;
    if (worker.status === "completed") workerCompletedRuns += 1;
    if (worker.status === "failed" || worker.status === "partial" || worker.failedTasks > 0) {
      workerFailedRuns += 1;
    }
  }

  const reviewRequired =
    workerFailedRuns > 0 ||
    brokerFailed > 0 ||
    brokerRejected > 0 ||
    rejectedDelegations > 0;

  return Object.freeze({
    uniqueRuns: runs.length,
    selectedRuns,
    productionDeniedRuns,
    modelCalls,
    workerCompletedRuns,
    workerFailedRuns,
    brokerCalls,
    brokerCompleted,
    brokerRejected,
    brokerFailed,
    acceptedDelegations,
    rejectedDelegations,
    latestSelectedAt,
    latestEnvironment,
    state:
      selectedRuns === 0
        ? "awaiting_preview_samples"
        : reviewRequired
          ? "review_required"
          : "clean_preview_evidence",
  });
}
