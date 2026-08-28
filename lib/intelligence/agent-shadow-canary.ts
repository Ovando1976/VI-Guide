import { createHash } from "node:crypto";

import type { IntelligenceRequest } from "@/types/intelligence";

export const AGENT_SHADOW_CANARY_MAX_WORKER_TASKS = 1;
const BASIS_POINTS = 10_000;

type EnvironmentLike = Readonly<Record<string, string | undefined>>;

export type AgentShadowCanaryEnvironment =
  | "preview"
  | "development"
  | "production"
  | "test"
  | "unknown";

export type AgentShadowCanaryReason =
  | "selected"
  | "environment_denied"
  | "canary_disabled"
  | "worker_disabled"
  | "broker_disabled"
  | "missing_openai_key"
  | "missing_session"
  | "not_in_cohort";

export type AgentShadowCanaryDecision = Readonly<{
  selected: boolean;
  reason: AgentShadowCanaryReason;
  environment: AgentShadowCanaryEnvironment;
  sampleRateBps: number;
  sampleBucket: number | null;
  explicitCohort: boolean;
}>;

function resolveEnvironment(env: EnvironmentLike): AgentShadowCanaryEnvironment {
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

function parseSampleRate(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(parsed, BASIS_POINTS));
}

function sessionHash(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("hex");
}

function explicitSessionHashes(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => /^[a-f0-9]{64}$/.test(entry)),
  );
}

function sampleBucketForHash(hash: string) {
  return Number.parseInt(hash.slice(0, 8), 16) % BASIS_POINTS;
}

export function evaluateAgentShadowCanary(
  request: IntelligenceRequest,
  env: EnvironmentLike = process.env,
): AgentShadowCanaryDecision {
  const environment = resolveEnvironment(env);
  const sampleRateBps = parseSampleRate(
    env.USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS,
  );
  const base = {
    environment,
    sampleRateBps,
    sampleBucket: null,
    explicitCohort: false,
  } as const;

  // This milestone is categorically preview/development only. A future
  // production-shadow promotion must deliberately change this code and pass a
  // separate review gate; environment flags alone cannot bypass it.
  if (environment !== "preview" && environment !== "development") {
    return Object.freeze({
      ...base,
      selected: false,
      reason: "environment_denied",
    });
  }
  if (env.USVI_AGENT_SHADOW_CANARY !== "1") {
    return Object.freeze({
      ...base,
      selected: false,
      reason: "canary_disabled",
    });
  }
  if (env.USVI_AGENT_WORKERS_SHADOW !== "1") {
    return Object.freeze({
      ...base,
      selected: false,
      reason: "worker_disabled",
    });
  }
  if (env.USVI_AGENT_TOOL_BROKER_SHADOW !== "1") {
    return Object.freeze({
      ...base,
      selected: false,
      reason: "broker_disabled",
    });
  }
  if (!env.OPENAI_API_KEY?.trim()) {
    return Object.freeze({
      ...base,
      selected: false,
      reason: "missing_openai_key",
    });
  }

  const sessionId = request.context.sessionId?.trim();
  if (!sessionId) {
    return Object.freeze({
      ...base,
      selected: false,
      reason: "missing_session",
    });
  }

  const hash = sessionHash(sessionId);
  const sampleBucket = sampleBucketForHash(hash);
  const explicitCohort = explicitSessionHashes(
    env.USVI_AGENT_SHADOW_CANARY_SESSION_HASHES,
  ).has(hash);
  const selected = explicitCohort || sampleBucket < sampleRateBps;

  return Object.freeze({
    selected,
    reason: selected ? "selected" : "not_in_cohort",
    environment,
    sampleRateBps,
    sampleBucket,
    explicitCohort,
  });
}

export function publicAgentShadowCanaryDecision(
  decision: AgentShadowCanaryDecision,
) {
  return Object.freeze({
    selected: decision.selected,
    reason: decision.reason,
    environment: decision.environment,
    sampleRateBps: decision.sampleRateBps,
    sampleBucket: decision.sampleBucket,
    explicitCohort: decision.explicitCohort,
    maxWorkerTasks: AGENT_SHADOW_CANARY_MAX_WORKER_TASKS,
  });
}
