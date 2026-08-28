import assert from "node:assert/strict";

import {
  sanitizeAgentControlTelemetry,
  summarizeAgentControlEvents,
} from "../lib/intelligence/agent-control-telemetry";

const sensitivePayload = {
  shadowCanary: {
    selected: true,
    reason: "selected",
    environment: "preview",
    sampleRateBps: 0,
    sampleBucket: 418,
    explicitCohort: true,
    maxWorkerTasks: 1,
    sessionId: "must-not-escape-session",
    sessionHash: "must-not-escape-hash",
  },
  collective: {
    status: "active",
    rootIntentHash: "internal-root-correlation",
    agents: ["island-concierge", "knowledge-specialist"],
    taskCount: 2,
    messageCount: 4,
    missingCapabilities: [],
    safeAutonomousTools: ["directory.search"],
    blockedAutonomousTools: ["booking.review"],
    workerShadow: {
      status: "completed",
      workerId: "openai-advisory-worker",
      model: "test-model",
      attemptedTasks: 1,
      completedTasks: 1,
      failedTasks: 0,
      modelCalls: 2,
      acceptedDelegations: 0,
      rejectedDelegations: 0,
      brokerCalls: 1,
      brokerCompleted: 1,
      brokerRejected: 0,
      brokerFailed: 0,
      brokerAudits: [
        {
          queryHash: "must-not-escape-query-hash",
          query: "must-not-escape-query",
          evidence: "must-not-escape-evidence",
        },
      ],
      prompt: "must-not-escape-prompt",
      response: "must-not-escape-response",
    },
  },
  travelerMessage: "must-not-escape-traveler-message",
  credential: "must-not-escape-secret",
};

const sanitized = sanitizeAgentControlTelemetry(sensitivePayload);
assert.equal(sanitized.shadowCanary?.selected, true);
assert.equal(sanitized.shadowCanary?.environment, "preview");
assert.equal(sanitized.collective?.agentCount, 2);
assert.equal(sanitized.collective?.workerShadow?.modelCalls, 2);
assert.equal(sanitized.collective?.workerShadow?.brokerCompleted, 1);

const serialized = JSON.stringify(sanitized);
for (const forbidden of [
  "must-not-escape-session",
  "must-not-escape-hash",
  "must-not-escape-query-hash",
  "must-not-escape-query",
  "must-not-escape-evidence",
  "must-not-escape-prompt",
  "must-not-escape-response",
  "must-not-escape-traveler-message",
  "must-not-escape-secret",
  "rootIntentHash",
  "brokerAudits",
]) {
  assert.equal(serialized.includes(forbidden), false, `${forbidden} must not reach the admin read model`);
}

const productionDenied = sanitizeAgentControlTelemetry({
  shadowCanary: {
    selected: false,
    reason: "environment_denied",
    environment: "production",
    sampleRateBps: 0,
    sampleBucket: null,
    explicitCohort: false,
    maxWorkerTasks: 1,
  },
  collective: {
    status: "complete",
    agents: ["island-concierge"],
    taskCount: 1,
    messageCount: 1,
    missingCapabilities: [],
    workerShadow: {
      status: "disabled",
      workerId: null,
      model: null,
      attemptedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      modelCalls: 0,
      acceptedDelegations: 0,
      rejectedDelegations: 0,
      brokerCalls: 0,
      brokerCompleted: 0,
      brokerRejected: 0,
      brokerFailed: 0,
    },
  },
});

const summary = summarizeAgentControlEvents([
  {
    runId: "preview-run",
    createdAt: "2026-08-28T15:50:00.000Z",
    control: sanitized,
  },
  {
    runId: "preview-run",
    createdAt: "2026-08-28T15:50:01.000Z",
    control: sanitized,
  },
  {
    runId: "production-run",
    createdAt: "2026-08-28T15:51:00.000Z",
    control: productionDenied,
  },
]);

assert.equal(summary.uniqueRuns, 2, "duplicate workflow events must collapse to one run");
assert.equal(summary.selectedRuns, 1);
assert.equal(summary.productionDeniedRuns, 1);
assert.equal(summary.modelCalls, 2);
assert.equal(summary.workerCompletedRuns, 1);
assert.equal(summary.workerFailedRuns, 0);
assert.equal(summary.brokerCalls, 1);
assert.equal(summary.brokerCompleted, 1);
assert.equal(summary.brokerRejected, 0);
assert.equal(summary.brokerFailed, 0);
assert.equal(summary.state, "clean_preview_evidence");
assert.equal(summary.latestEnvironment, "preview");

const reviewSummary = summarizeAgentControlEvents([
  {
    runId: "failed-preview",
    createdAt: "2026-08-28T15:52:00.000Z",
    control: sanitizeAgentControlTelemetry({
      shadowCanary: {
        selected: true,
        reason: "selected",
        environment: "preview",
        sampleRateBps: 100,
        sampleBucket: 5,
        explicitCohort: false,
        maxWorkerTasks: 1,
      },
      collective: {
        status: "partial",
        agents: ["island-concierge"],
        taskCount: 1,
        messageCount: 1,
        missingCapabilities: [],
        workerShadow: {
          status: "partial",
          workerId: "worker",
          model: "model",
          attemptedTasks: 1,
          completedTasks: 0,
          failedTasks: 1,
          modelCalls: 1,
          acceptedDelegations: 0,
          rejectedDelegations: 1,
          brokerCalls: 1,
          brokerCompleted: 0,
          brokerRejected: 1,
          brokerFailed: 0,
        },
      },
    }),
  },
]);
assert.equal(reviewSummary.state, "review_required");
assert.equal(reviewSummary.workerFailedRuns, 1);
assert.equal(reviewSummary.brokerRejected, 1);
assert.equal(reviewSummary.rejectedDelegations, 1);

const awaiting = summarizeAgentControlEvents([]);
assert.equal(awaiting.state, "awaiting_preview_samples");

console.log(
  "Agent control telemetry tests passed: privacy-safe read model, run deduplication, production-deny accounting, canary counters, and promotion hold state.",
);
