import type {
  AgentWorker,
  AgentWorkerInput,
  AgentWorkerOutput,
} from "@/lib/intelligence/agent-worker";
import type { IntelligenceCapability } from "@/types/intelligence";

export type IntelligenceModelProvider = "openai" | "gpt-oss";
export type IntelligenceRouteComplexity = "low" | "medium" | "high";
export type IntelligenceRoutePrivacy = "standard" | "sensitive";
export type IntelligenceRouteLatency = "interactive" | "deliberate";
export type IntelligenceRouteCost = "economy" | "quality";

export type IntelligenceRouteSignals = Readonly<{
  complexity: IntelligenceRouteComplexity;
  privacy: IntelligenceRoutePrivacy;
  latency: IntelligenceRouteLatency;
  cost: IntelligenceRouteCost;
  modality: "text";
}>;

export type IntelligenceRouteDecision = Readonly<{
  provider: IntelligenceModelProvider;
  workerId: string;
  model: string | null;
  signals: IntelligenceRouteSignals;
  reasons: readonly string[];
}>;

export type IntelligenceModelRouterPolicy = Readonly<{
  preferPrivateForSensitive: boolean;
  preferPrivateForRoutine: boolean;
  frontierForHighComplexity: boolean;
  frontierForBooking: boolean;
}>;

export const DEFAULT_INTELLIGENCE_MODEL_ROUTER_POLICY: IntelligenceModelRouterPolicy =
  Object.freeze({
    preferPrivateForSensitive: true,
    preferPrivateForRoutine: true,
    frontierForHighComplexity: true,
    frontierForBooking: true,
  });

type RouterWorkers = Readonly<{
  openai?: AgentWorker | null;
  gptOss?: AgentWorker | null;
}>;

function includesCapability(
  capabilities: readonly IntelligenceCapability[],
  capability: IntelligenceCapability,
) {
  return capabilities.includes(capability);
}

function computeComplexity(input: AgentWorkerInput): IntelligenceRouteComplexity {
  let score = 0;
  const required = input.task.requiredCapabilities;

  if (
    required.some((capability) =>
      ["plan", "mobility", "booking"].includes(capability),
    )
  ) {
    score += 2;
  }
  if (input.task.depth >= 2) score += 1;
  if (input.request.message.length > 800) score += 1;
  if (input.messages.length >= 6) score += 1;
  if (input.rootIntent.allowedCapabilities.length >= 4) score += 1;

  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function computePrivacy(input: AgentWorkerInput): IntelligenceRoutePrivacy {
  const context = input.request.context;
  const memory = context.memory;
  const carriesPreciseTripContext = Boolean(
    context.currentLocation ||
      context.pickup ||
      context.destination ||
      memory.stay ||
      memory.activeTrip ||
      memory.cruise,
  );

  return carriesPreciseTripContext || context.page === "profile"
    ? "sensitive"
    : "standard";
}

function computeLatency(input: AgentWorkerInput): IntelligenceRouteLatency {
  return input.request.message.length <= 600 &&
    input.task.depth <= 1 &&
    input.messages.length <= 4
    ? "interactive"
    : "deliberate";
}

export function classifyIntelligenceRouteSignals(
  input: AgentWorkerInput,
): IntelligenceRouteSignals {
  const complexity = computeComplexity(input);
  const required = input.task.requiredCapabilities;
  const cost: IntelligenceRouteCost =
    complexity === "high" || includesCapability(required, "booking")
      ? "quality"
      : "economy";

  return Object.freeze({
    complexity,
    privacy: computePrivacy(input),
    latency: computeLatency(input),
    cost,
    modality: "text" as const,
  });
}

function providerForWorker(
  worker: AgentWorker,
  workers: RouterWorkers,
): IntelligenceModelProvider {
  if (workers.openai === worker) return "openai";
  return "gpt-oss";
}

function decisionFor(
  worker: AgentWorker,
  workers: RouterWorkers,
  signals: IntelligenceRouteSignals,
  reasons: readonly string[],
): IntelligenceRouteDecision {
  return Object.freeze({
    provider: providerForWorker(worker, workers),
    workerId: worker.id,
    model: worker.model ?? null,
    signals,
    reasons: Object.freeze([...reasons]),
  });
}

export function routeIntelligenceWorker(
  input: AgentWorkerInput,
  workers: RouterWorkers,
  policy: IntelligenceModelRouterPolicy = DEFAULT_INTELLIGENCE_MODEL_ROUTER_POLICY,
): IntelligenceRouteDecision {
  const openai = workers.openai ?? null;
  const gptOss = workers.gptOss ?? null;
  const signals = classifyIntelligenceRouteSignals(input);

  if (!openai && !gptOss) {
    throw new Error("Island intelligence router has no configured model workers.");
  }
  if (openai && !gptOss) {
    return decisionFor(openai, workers, signals, [
      "Only the OpenAI worker is configured.",
    ]);
  }
  if (gptOss && !openai) {
    return decisionFor(gptOss, workers, signals, [
      "Only the gpt-oss worker is configured.",
    ]);
  }

  const required = input.task.requiredCapabilities;
  if (
    policy.frontierForBooking &&
    includesCapability(required, "booking") &&
    openai
  ) {
    return decisionFor(openai, workers, signals, [
      "Booking-adjacent advisory work uses the frontier worker for higher reasoning quality.",
      "Execution authority remains outside the model router.",
    ]);
  }

  if (
    policy.frontierForHighComplexity &&
    signals.complexity === "high" &&
    openai
  ) {
    return decisionFor(openai, workers, signals, [
      "High-complexity advisory work uses the frontier worker.",
    ]);
  }

  if (
    policy.preferPrivateForSensitive &&
    signals.privacy === "sensitive" &&
    gptOss
  ) {
    return decisionFor(gptOss, workers, signals, [
      "Trip-specific context is privacy-sensitive.",
      "A configured private/open-weight worker is preferred when frontier escalation is unnecessary.",
    ]);
  }

  if (
    policy.preferPrivateForRoutine &&
    signals.cost === "economy" &&
    gptOss
  ) {
    return decisionFor(gptOss, workers, signals, [
      "Routine text advisory work prefers the lower-cost open-weight worker.",
    ]);
  }

  if (openai) {
    return decisionFor(openai, workers, signals, [
      "Frontier worker selected by fallback policy.",
    ]);
  }

  return decisionFor(gptOss!, workers, signals, [
    "Open-weight worker selected by available-provider fallback.",
  ]);
}

export class IslandIntelligenceRouterWorker implements AgentWorker {
  readonly id = "island-intelligence-router";
  readonly model = "dynamic";
  private readonly workers: RouterWorkers;
  private readonly policy: IntelligenceModelRouterPolicy;

  constructor(
    workers: RouterWorkers,
    policy: IntelligenceModelRouterPolicy = DEFAULT_INTELLIGENCE_MODEL_ROUTER_POLICY,
  ) {
    if (!workers.openai && !workers.gptOss) {
      throw new Error("Island intelligence router requires at least one worker.");
    }
    this.workers = Object.freeze({
      openai: workers.openai ?? null,
      gptOss: workers.gptOss ?? null,
    });
    this.policy = Object.freeze({ ...policy });
  }

  decide(input: AgentWorkerInput): IntelligenceRouteDecision {
    return routeIntelligenceWorker(input, this.workers, this.policy);
  }

  async run(input: AgentWorkerInput): Promise<AgentWorkerOutput> {
    const decision = this.decide(input);
    const worker =
      decision.provider === "openai"
        ? this.workers.openai
        : this.workers.gptOss;

    if (!worker) {
      throw new Error("Selected model worker is unavailable.");
    }
    return worker.run(input);
  }
}
