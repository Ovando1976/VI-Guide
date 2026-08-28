import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(
  "app/api/admin/agents/canary/run/route.ts",
  "utf8",
);
const runner = readFileSync(
  "lib/intelligence/agent-manual-canary.ts",
  "utf8",
);
const store = readFileSync(
  "lib/intelligence/agent-manual-canary-store.ts",
  "utf8",
);
const button = readFileSync(
  "app/admin/agents/canary/RunCanaryButton.tsx",
  "utf8",
);
const layout = readFileSync(
  "app/admin/agents/canary/layout.tsx",
  "utf8",
);

assert.match(route, /requireSession\(\["admin"\]\)/);
assert.match(route, /Idempotency-Key/);
assert.match(route, /evaluateManualAgentCanary/);
assert.match(route, /recordManualAgentCanaryEvent/);
assert.doesNotMatch(route, /publishIntelligenceEvent/);
assert.doesNotMatch(route, /runRegisteredIntelligenceOrchestrator/);

assert.match(
  runner,
  /const MANUAL_CANARY_CAPABILITIES = \["recommend", "knowledge"\] as const;/,
);
assert.match(runner, /decision\.environment !== "preview"/);
assert.match(runner, /USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "10000"/);
assert.match(runner, /permission\) => permission !== "read"/);
assert.match(
  runner,
  /maxWorkerTasks: AGENT_SHADOW_CANARY_MAX_WORKER_TASKS/,
);
assert.doesNotMatch(runner, /runRegisteredIntelligenceOrchestrator/);
assert.doesNotMatch(runner, /persistMemoryResult/);

assert.match(store, /createHash\("sha256"\)/);
assert.match(store, /agent_canary_run_claims/);
assert.match(store, /agent\.canary\.manual/);
assert.doesNotMatch(store, /publishIntelligenceEvent/);
assert.doesNotMatch(store, /idempotencyKey\s*:/);

assert.match(button, /crypto\.randomUUID\(\)/);
assert.match(button, /Run synthetic preview canary/);
assert.match(layout, /<RunCanaryButton \/>/);

console.log(
  "Manual agent canary contract passed: admin-only route, preview-only gate, one-task read-only synthetic scope, idempotent isolated telemetry, and no event-bus or traveler-memory execution path.",
);
