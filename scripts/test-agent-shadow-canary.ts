import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  AGENT_SHADOW_CANARY_MAX_WORKER_TASKS,
  evaluateAgentShadowCanary,
  publicAgentShadowCanaryDecision,
} from "../lib/intelligence/agent-shadow-canary";
import type { IntelligenceRequest } from "../types/intelligence";

const SESSION_ID = "preview-canary-session-must-not-reach-telemetry";

function request(sessionId = SESSION_ID): IntelligenceRequest {
  return {
    message: "Find a reviewed St. Thomas beach and explain why it fits.",
    context: {
      sessionId,
      page: "concierge",
      island: "stt",
      now: "2026-08-28T16:00:00.000Z",
      timezone: "America/St_Thomas",
      party: { adults: 2, children: 0 },
      preferences: {
        interests: ["beaches"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {},
    },
    capabilities: ["recommend", "knowledge"],
  };
}

const fullyEnabledPreview = {
  VERCEL_ENV: "preview",
  NODE_ENV: "production",
  USVI_AGENT_SHADOW_CANARY: "1",
  USVI_AGENT_WORKERS_SHADOW: "1",
  USVI_AGENT_TOOL_BROKER_SHADOW: "1",
  USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "10000",
  OPENAI_API_KEY: "test-key",
} as const;

const production = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  VERCEL_ENV: "production",
});
assert.equal(production.selected, false);
assert.equal(production.reason, "environment_denied");
assert.equal(production.environment, "production");

const disabled = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  USVI_AGENT_SHADOW_CANARY: "0",
});
assert.equal(disabled.selected, false);
assert.equal(disabled.reason, "canary_disabled");

const workerDisabled = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  USVI_AGENT_WORKERS_SHADOW: "0",
});
assert.equal(workerDisabled.reason, "worker_disabled");

const brokerDisabled = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  USVI_AGENT_TOOL_BROKER_SHADOW: "0",
});
assert.equal(brokerDisabled.reason, "broker_disabled");

const missingKey = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  OPENAI_API_KEY: "",
});
assert.equal(missingKey.reason, "missing_openai_key");

const zeroRate = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "0",
});
assert.equal(zeroRate.selected, false);
assert.equal(zeroRate.reason, "not_in_cohort");
assert.equal(zeroRate.sampleRateBps, 0);
assert.equal(typeof zeroRate.sampleBucket, "number");

const selected = evaluateAgentShadowCanary(request(), fullyEnabledPreview);
assert.equal(selected.selected, true);
assert.equal(selected.reason, "selected");
assert.equal(selected.environment, "preview");
assert.equal(selected.sampleRateBps, 10_000);
assert.equal(typeof selected.sampleBucket, "number");

const repeated = evaluateAgentShadowCanary(request(), fullyEnabledPreview);
assert.equal(repeated.sampleBucket, selected.sampleBucket);

const explicitHash = createHash("sha256").update(SESSION_ID).digest("hex");
const explicit = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "0",
  USVI_AGENT_SHADOW_CANARY_SESSION_HASHES: explicitHash,
});
assert.equal(explicit.selected, true);
assert.equal(explicit.explicitCohort, true);

const malformedAllowlist = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "0",
  USVI_AGENT_SHADOW_CANARY_SESSION_HASHES: `${explicitHash.slice(0, 16)},not-a-hash`,
});
assert.equal(malformedAllowlist.selected, false);
assert.equal(malformedAllowlist.explicitCohort, false);

const development = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  VERCEL_ENV: undefined,
  NODE_ENV: "development",
});
assert.equal(development.selected, true);
assert.equal(development.environment, "development");

const testEnvironment = evaluateAgentShadowCanary(request(), {
  ...fullyEnabledPreview,
  VERCEL_ENV: undefined,
  NODE_ENV: "test",
});
assert.equal(testEnvironment.selected, false);
assert.equal(testEnvironment.reason, "environment_denied");

const publicDecision = publicAgentShadowCanaryDecision(explicit);
const serialized = JSON.stringify(publicDecision);
assert.equal(serialized.includes(SESSION_ID), false);
assert.equal(serialized.includes(explicitHash), false);
assert.equal(publicDecision.maxWorkerTasks, 1);
assert.equal(AGENT_SHADOW_CANARY_MAX_WORKER_TASKS, 1);

console.log(
  "Agent shadow canary tests passed: production hard deny, explicit preview gate, deterministic cohorts, zero-rate default, privacy-safe telemetry, and one-task cost ceiling.",
);

await import("./test-operator-preview-canary");
