import assert from "node:assert/strict";

import { AgentBlackboard } from "../lib/intelligence/agent-blackboard";
import { defaultCollectiveAgentRegistry } from "../lib/intelligence/agent-registry";
import {
  createCoordinationRootIntent,
  DEFAULT_COLLECTIVE_POLICY,
} from "../lib/intelligence/agent-policy";
import {
  createConfiguredAdvisoryAgentWorker,
  GptOssAdvisoryAgentWorker,
} from "../lib/intelligence/agent-worker";
import type { IntelligenceToolDescriptor } from "../lib/intelligence/tool-registry";
import type { IntelligenceRequest } from "../types/intelligence";

const now = "2026-08-29T15:30:00.000Z";

function request(): IntelligenceRequest {
  return {
    message: "Plan a practical St. Thomas arrival afternoon.",
    context: {
      sessionId: "gpt-oss-provider-test",
      userId: "private-user-id-must-not-reach-worker-payload",
      page: "concierge",
      island: "stt",
      now,
      timezone: "America/St_Thomas",
      party: { adults: 2, children: 0 },
      preferences: {
        interests: ["beaches", "history"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {
        savedPlaceIds: ["private-saved-place-list"],
        stay: { name: "Test Stay", island: "stt" },
      },
    },
    capabilities: ["recommend", "plan"],
  };
}

const directoryTool: IntelligenceToolDescriptor = {
  id: "directory.search",
  name: "Directory search",
  description: "Read-only directory search.",
  category: "discovery",
  capability: "recommend",
  permissions: ["read"],
  risk: "low",
  requiresConfirmation: false,
  enabled: true,
  tags: ["places"],
  version: "1.0.0",
};

function buildInput() {
  const intelligenceRequest = request();
  const rootIntent = createCoordinationRootIntent({
    id: "gpt-oss-root-test",
    userMessage: intelligenceRequest.message,
    allowedCapabilities: ["recommend", "plan"],
    createdAt: new Date(now),
  });
  const board = new AgentBlackboard(rootIntent, DEFAULT_COLLECTIVE_POLICY);
  const task = board.createTask({
    id: "gpt-oss-task-1",
    title: "Find grounded options",
    description: "Find suitable reviewed options.",
    requiredCapabilities: ["recommend"],
    depth: 1,
    createdBy: "system",
    now: new Date(now),
  });
  const agent = defaultCollectiveAgentRegistry.get("travel-planner");
  assert.ok(agent);

  return {
    request: intelligenceRequest,
    rootIntent,
    agent,
    task,
    messages: board.listMessages(),
    tools: [directoryTool],
  };
}

async function runGptOssProviderTests() {
  const calls: Array<{ input: string; init?: RequestInit }> = [];
  const fakeFetch = (async (input: unknown, init?: RequestInit) => {
    calls.push({ input: String(input), init });
    return new Response(
      JSON.stringify({
        output_text: JSON.stringify({
          kind: "result",
          summary: "Use the reviewed arrival options and keep the first afternoon light.",
          confidence: "medium",
          requestedCapabilities: [],
          toolRequest: null,
        }),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const localEndpoint = "http://127.0.0.1:11434/v1/responses";
  const worker = new GptOssAdvisoryAgentWorker({
    endpoint: localEndpoint,
    model: "gpt-oss-20b",
    fetchImpl: fakeFetch,
  });

  const output = await worker.run(buildInput());
  assert.equal(output.kind, "result");
  assert.equal(worker.id, "gpt-oss-advisory-worker");
  assert.equal(worker.model, "gpt-oss-20b");
  assert.equal(calls[0]?.input, localEndpoint);

  const firstHeaders = calls[0]?.init?.headers as Record<string, string> | undefined;
  assert.equal(
    firstHeaders?.Authorization,
    undefined,
    "Local gpt-oss endpoints must not receive a synthetic Authorization header.",
  );

  const firstBody = JSON.parse(String(calls[0]?.init?.body ?? "{}")) as Record<
    string,
    unknown
  >;
  assert.equal(firstBody.model, "gpt-oss-20b");
  assert.equal(firstBody.store, false);
  assert.equal(
    JSON.stringify(firstBody).includes("private-user-id-must-not-reach-worker-payload"),
    false,
    "The provider boundary must preserve worker payload minimization.",
  );

  calls.length = 0;
  const hostedWorker = new GptOssAdvisoryAgentWorker({
    endpoint: "https://inference.example.test/v1/responses",
    apiKey: "hosted-test-key",
    model: "gpt-oss-120b",
    fetchImpl: fakeFetch,
  });
  await hostedWorker.run(buildInput());
  const hostedHeaders = calls[0]?.init?.headers as Record<string, string> | undefined;
  assert.equal(hostedHeaders?.Authorization, "Bearer hosted-test-key");

  const previous = {
    shadow: process.env.USVI_AGENT_WORKERS_SHADOW,
    provider: process.env.USVI_AGENT_MODEL_PROVIDER,
    endpoint: process.env.GPT_OSS_RESPONSES_URL,
    apiKey: process.env.GPT_OSS_API_KEY,
    model: process.env.GPT_OSS_MODEL,
  };

  try {
    process.env.USVI_AGENT_WORKERS_SHADOW = "1";
    process.env.USVI_AGENT_MODEL_PROVIDER = "gpt-oss";
    process.env.GPT_OSS_RESPONSES_URL = localEndpoint;
    delete process.env.GPT_OSS_API_KEY;
    process.env.GPT_OSS_MODEL = "gpt-oss-20b";

    const configured = createConfiguredAdvisoryAgentWorker();
    assert.ok(configured);
    assert.equal(configured.id, "gpt-oss-advisory-worker");
    assert.equal(configured.model, "gpt-oss-20b");

    process.env.USVI_AGENT_MODEL_PROVIDER = "unexpected-provider";
    assert.equal(
      createConfiguredAdvisoryAgentWorker(),
      null,
      "Unknown providers must fail closed rather than silently falling back.",
    );
  } finally {
    restoreEnv("USVI_AGENT_WORKERS_SHADOW", previous.shadow);
    restoreEnv("USVI_AGENT_MODEL_PROVIDER", previous.provider);
    restoreEnv("GPT_OSS_RESPONSES_URL", previous.endpoint);
    restoreEnv("GPT_OSS_API_KEY", previous.apiKey);
    restoreEnv("GPT_OSS_MODEL", previous.model);
  }

  console.log(
    "gpt-oss agent provider tests passed: Responses endpoint routing, optional auth, payload minimization, provider selection, and fail-closed fallback.",
  );
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

void runGptOssProviderTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
