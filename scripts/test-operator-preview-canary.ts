import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import type {
  OperatorCanaryRunStatus,
  OperatorCanarySafeRecord,
  OperatorCanaryRunStore,
} from "../lib/intelligence/agent-control-store";
import { ReadOnlyAgentToolBroker } from "../lib/intelligence/agent-tool-broker";
import type { AgentWorker } from "../lib/intelligence/agent-worker";
import {
  evaluateOperatorPreviewCanary,
  getOperatorPreviewCanaryToolIds,
  OPERATOR_CANARY_FIXED_MESSAGE,
  runOperatorPreviewCanary,
} from "../lib/intelligence/operator-preview-canary";

const previewEnv = {
  VERCEL_ENV: "preview",
  NODE_ENV: "production",
  VERCEL_GIT_COMMIT_SHA: "abc123previewcommit",
  USVI_AGENT_SHADOW_CANARY: "1",
  USVI_AGENT_WORKERS_SHADOW: "1",
  USVI_AGENT_TOOL_BROKER_SHADOW: "1",
  USVI_AGENT_SHADOW_CANARY_SAMPLE_BPS: "0",
  OPENAI_API_KEY: "test-key",
} as const;

export async function runOperatorPreviewCanaryTests() {
  const routeSource = fs.readFileSync(
    path.join(process.cwd(), "app/api/admin/agents/canary/run/route.ts"),
    "utf8",
  );
  assert.equal(routeSource.includes('await requireSession(["admin"])'), true);
  assert.equal(routeSource.includes('request.headers.get("origin")'), true);
  assert.equal(routeSource.includes("sameOrigin(request)"), true);

  const production = evaluateOperatorPreviewCanary({
    ...previewEnv,
    VERCEL_ENV: "production",
  });
  assert.equal(production.selected, false);
  assert.equal(production.reason, "environment_denied");

  const preview = evaluateOperatorPreviewCanary(previewEnv);
  assert.equal(preview.selected, true);
  assert.equal(preview.reason, "selected");
  assert.deepEqual(getOperatorPreviewCanaryToolIds(), ["directory.search"]);

  const missingBroker = evaluateOperatorPreviewCanary({
    ...previewEnv,
    USVI_AGENT_TOOL_BROKER_SHADOW: "0",
  });
  assert.equal(missingBroker.selected, false);
  assert.equal(missingBroker.reason, "broker_disabled");

  const missingCommit = evaluateOperatorPreviewCanary({
    ...previewEnv,
    VERCEL_GIT_COMMIT_SHA: "",
  });
  assert.equal(missingCommit.reason, "missing_deployment_sha");

  let status: OperatorCanaryRunStatus | null = null;
  const storedRecords: OperatorCanarySafeRecord[] = [];
  let claimCalls = 0;
  const store: OperatorCanaryRunStore = {
    async claim() {
      claimCalls += 1;
      if (status) return { claimed: false, status };
      status = "running";
      return { claimed: true, status };
    },
    async complete(_runKey, record) {
      storedRecords.push(record);
      status = "completed";
    },
    async fail(_runKey, record) {
      if (record) storedRecords.push(record);
      status = "failed";
    },
  };

  let workerCalls = 0;
  const worker: AgentWorker = {
    id: "operator-canary-test-worker",
    model: "test-model",
    async run(input) {
      workerCalls += 1;
      assert.equal(input.request.message, OPERATOR_CANARY_FIXED_MESSAGE);
      assert.deepEqual(input.rootIntent.allowedCapabilities, ["recommend"]);
      if (workerCalls === 1) {
        assert.deepEqual(input.requestableToolIds, ["directory.search"]);
        return {
          kind: "tool_request",
          summary: "Need one grounded directory lookup.",
          confidence: "medium",
          requestedCapabilities: [],
          toolRequest: {
            toolId: "directory.search",
            query: "Magens Bay beach",
          },
        };
      }
      assert.deepEqual(input.requestableToolIds, []);
      return {
        kind: "result",
        summary: "Grounded read-only evidence reviewed.",
        confidence: "high",
        requestedCapabilities: [],
        toolRequest: null,
      };
    },
  };

  const completed = await runOperatorPreviewCanary({
    env: previewEnv,
    store,
    worker,
    broker: new ReadOnlyAgentToolBroker({ timeoutMs: 500 }),
    now: () => new Date("2026-08-28T16:00:00.000Z"),
  });
  assert.equal(completed.status, "completed");
  assert.equal(completed.reason, "selected");
  assert.equal(completed.worker?.status, "completed");
  assert.equal(completed.worker?.attemptedTasks, 1);
  assert.equal(completed.worker?.modelCalls, 2);
  assert.equal(completed.worker?.brokerCalls, 1);
  assert.equal(completed.worker?.brokerCompleted, 1);
  assert.equal(completed.worker?.brokerRejected, 0);
  assert.equal(completed.worker?.brokerFailed, 0);

  const persistedRecord = storedRecords[0];
  assert.ok(persistedRecord);
  assert.equal(persistedRecord.taskCount, 1);
  assert.equal(persistedRecord.worker.brokerCompleted, 1);

  const serializedSafeRecord = JSON.stringify(persistedRecord);
  assert.equal(
    serializedSafeRecord.includes(OPERATOR_CANARY_FIXED_MESSAGE),
    false,
  );
  assert.equal(serializedSafeRecord.includes("Magens Bay beach"), false);
  assert.equal(
    serializedSafeRecord.includes("operator-canary-dad6c7e91798e0ba"),
    false,
  );

  const repeated = await runOperatorPreviewCanary({
    env: previewEnv,
    store,
    worker,
    broker: new ReadOnlyAgentToolBroker({ timeoutMs: 500 }),
  });
  assert.equal(repeated.status, "already_completed");
  assert.equal(workerCalls, 2);
  assert.equal(claimCalls, 2);

  let failedStatus: OperatorCanaryRunStatus | null = null;
  let failedWorkerCalls = 0;
  const failedRecords: OperatorCanarySafeRecord[] = [];
  const failedStore: OperatorCanaryRunStore = {
    async claim() {
      if (failedStatus) return { claimed: false, status: failedStatus };
      failedStatus = "running";
      return { claimed: true, status: failedStatus };
    },
    async complete() {
      throw new Error("A failed worker must never be persisted as completed.");
    },
    async fail(_runKey, record) {
      if (record) failedRecords.push(record);
      failedStatus = "failed";
    },
  };
  const failedWorker: AgentWorker = {
    id: "operator-canary-failing-worker",
    model: "test-model",
    async run() {
      failedWorkerCalls += 1;
      throw new Error("Synthetic provider failure");
    },
  };

  const failed = await runOperatorPreviewCanary({
    env: { ...previewEnv, VERCEL_GIT_COMMIT_SHA: "failed-preview-commit" },
    store: failedStore,
    worker: failedWorker,
    broker: new ReadOnlyAgentToolBroker({ timeoutMs: 500 }),
  });
  assert.equal(failed.status, "failed");
  assert.equal(failed.reason, "execution_failed");
  assert.equal(failed.worker?.status, "failed");
  assert.equal(failed.worker?.attemptedTasks, 1);
  assert.equal(failed.worker?.failedTasks, 1);
  assert.equal(failed.worker?.modelCalls, 1);
  assert.equal(failedRecords.length, 1);
  assert.equal(failedRecords[0]?.worker.status, "failed");

  const failedReplay = await runOperatorPreviewCanary({
    env: { ...previewEnv, VERCEL_GIT_COMMIT_SHA: "failed-preview-commit" },
    store: failedStore,
    worker: failedWorker,
    broker: new ReadOnlyAgentToolBroker({ timeoutMs: 500 }),
  });
  assert.equal(failedReplay.status, "already_failed");
  assert.equal(failedWorkerCalls, 1);

  let productionClaims = 0;
  const productionStore: OperatorCanaryRunStore = {
    async claim() {
      productionClaims += 1;
      return { claimed: true, status: "running" };
    },
    async complete() {},
    async fail() {},
  };
  const productionRun = await runOperatorPreviewCanary({
    env: { ...previewEnv, VERCEL_ENV: "production" },
    store: productionStore,
    worker,
  });
  assert.equal(productionRun.status, "denied");
  assert.equal(productionRun.reason, "environment_denied");
  assert.equal(productionClaims, 0);
  assert.equal(workerCalls, 2);

  const noStore = await runOperatorPreviewCanary({
    env: previewEnv,
    store: null,
    worker,
  });
  assert.equal(noStore.status, "denied");
  assert.equal(noStore.reason, "idempotency_unavailable");
  assert.equal(workerCalls, 2);

  console.log(
    "Operator preview canary tests passed: admin/same-origin gate, production hard deny, preview-only manual gate, zero broad sampling, one-shot success and failure idempotency, one read-only broker tool, bounded worker execution, conservative failed-call accounting, and privacy-safe persistence.",
  );
}

runOperatorPreviewCanaryTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
