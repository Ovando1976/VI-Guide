import assert from "node:assert/strict";

import { AgentBlackboard } from "../lib/intelligence/agent-blackboard";
import { defaultCollectiveAgentRegistry } from "../lib/intelligence/agent-registry";
import {
  createCoordinationRootIntent,
  DEFAULT_COLLECTIVE_POLICY,
} from "../lib/intelligence/agent-policy";
import {
  createConfiguredAdvisoryAgentWorker,
  type AgentWorker,
  type AgentWorkerInput,
  type AgentWorkerOutput,
} from "../lib/intelligence/agent-worker";
import {
  IslandIntelligenceRouterWorker,
  classifyIntelligenceRouteSignals,
} from "../lib/intelligence/model-router";
import type { IntelligenceCapability, IntelligenceRequest } from "../types/intelligence";

const now = "2026-08-29T16:15:00.000Z";

function request(options?: {
  message?: string;
  sensitive?: boolean;
  capabilities?: IntelligenceCapability[];
}): IntelligenceRequest {
  return {
    message: options?.message ?? "Give me three practical options for this afternoon.",
    context: {
      sessionId: "router-test-session",
      userId: "private-user-id",
      page: options?.sensitive ? "planner" : "concierge",
      island: "stt",
      now,
      timezone: "America/St_Thomas",
      currentLocation: options?.sensitive
        ? {
            name: "Current traveler location",
            island: "stt",
            lat: 18.34,
            lng: -64.93,
          }
        : undefined,
      party: { adults: 2, children: 0 },
      preferences: {
        interests: ["beaches", "history"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {},
    },
    capabilities: options?.capabilities ?? ["recommend"],
  };
}

function input(options?: {
  required?: IntelligenceCapability[];
  allowed?: IntelligenceCapability[];
  message?: string;
  sensitive?: boolean;
  depth?: number;
  blackboardMessages?: number;
}): AgentWorkerInput {
  const intelligenceRequest = request({
    message: options?.message,
    sensitive: options?.sensitive,
    capabilities: options?.allowed,
  });
  const allowed = options?.allowed ?? ["recommend", "plan", "mobility", "booking"];
  const rootIntent = createCoordinationRootIntent({
    id: `router-root-${Math.random()}`,
    userMessage: intelligenceRequest.message,
    allowedCapabilities: allowed,
    createdAt: new Date(now),
  });
  const board = new AgentBlackboard(rootIntent, DEFAULT_COLLECTIVE_POLICY);
  const required = options?.required ?? ["recommend"];
  const task = board.createTask({
    id: `router-task-${Math.random()}`,
    title: "Route advisory work",
    description: "Choose the best bounded model worker for this advisory task.",
    requiredCapabilities: required,
    depth: options?.depth ?? 1,
    createdBy: "system",
    now: new Date(now),
  });
  const agent = defaultCollectiveAgentRegistry.get("travel-planner");
  assert.ok(agent);

  for (let index = 0; index < (options?.blackboardMessages ?? 0); index += 1) {
    board.postMessage({
      id: `router-message-${index}`,
      type: "observation",
      fromAgentId: "island-concierge",
      taskId: task.id,
      content: `Evidence item ${index}`,
      now: new Date(now),
    });
  }

  return {
    request: intelligenceRequest,
    rootIntent,
    agent,
    task,
    messages: board.listMessages(),
    tools: [],
  };
}

function fakeWorker(id: string, model: string, calls: string[]): AgentWorker {
  return {
    id,
    model,
    async run(): Promise<AgentWorkerOutput> {
      calls.push(id);
      return {
        kind: "result",
        summary: `completed by ${id}`,
        confidence: "medium",
        requestedCapabilities: [],
        toolRequest: null,
      };
    },
  };
}

async function runModelRouterTests() {
  const calls: string[] = [];
  const openai = fakeWorker("openai-test-worker", "frontier-test-model", calls);
  const gptOss = fakeWorker("gpt-oss-test-worker", "gpt-oss-20b", calls);
  const router = new IslandIntelligenceRouterWorker({ openai, gptOss });

  const routine = input({
    required: ["recommend"],
    allowed: ["recommend"],
  });
  const routineDecision = router.decide(routine);
  assert.equal(routineDecision.provider, "gpt-oss");
  assert.equal(routineDecision.signals.complexity, "low");
  assert.equal(routineDecision.signals.cost, "economy");
  assert.equal(routineDecision.signals.modality, "text");

  const sensitive = input({
    required: ["recommend"],
    allowed: ["recommend"],
    sensitive: true,
  });
  const sensitiveDecision = router.decide(sensitive);
  assert.equal(sensitiveDecision.provider, "gpt-oss");
  assert.equal(sensitiveDecision.signals.privacy, "sensitive");

  const highComplexity = input({
    required: ["plan"],
    allowed: ["recommend", "plan", "mobility", "booking"],
    depth: 2,
    message: "x".repeat(900),
  });
  const highDecision = router.decide(highComplexity);
  assert.equal(highDecision.provider, "openai");
  assert.equal(highDecision.signals.complexity, "high");
  assert.equal(highDecision.signals.cost, "quality");

  const booking = input({
    required: ["booking"],
    allowed: ["booking"],
    sensitive: true,
  });
  const bookingDecision = router.decide(booking);
  assert.equal(
    bookingDecision.provider,
    "openai",
    "Booking-adjacent reasoning should prefer frontier quality even when trip context is sensitive.",
  );
  assert.equal(
    bookingDecision.reasons.some((reason) =>
      reason.includes("Execution authority remains outside the model router"),
    ),
    true,
  );

  calls.length = 0;
  const routedOutput = await router.run(routine);
  assert.equal(routedOutput.summary, "completed by gpt-oss-test-worker");
  assert.deepEqual(calls, ["gpt-oss-test-worker"]);

  calls.length = 0;
  await router.run(highComplexity);
  assert.deepEqual(calls, ["openai-test-worker"]);

  const openaiOnly = new IslandIntelligenceRouterWorker({ openai });
  assert.equal(openaiOnly.decide(routine).provider, "openai");
  const ossOnly = new IslandIntelligenceRouterWorker({ gptOss });
  assert.equal(ossOnly.decide(highComplexity).provider, "gpt-oss");

  const signals = classifyIntelligenceRouteSignals(
    input({
      required: ["recommend"],
      allowed: ["recommend"],
      blackboardMessages: 6,
    }),
  );
  assert.equal(signals.latency, "deliberate");

  const previous = {
    shadow: process.env.USVI_AGENT_WORKERS_SHADOW,
    provider: process.env.USVI_AGENT_MODEL_PROVIDER,
    openaiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL,
    ossUrl: process.env.GPT_OSS_RESPONSES_URL,
    ossModel: process.env.GPT_OSS_MODEL,
    ossKey: process.env.GPT_OSS_API_KEY,
  };

  try {
    process.env.USVI_AGENT_WORKERS_SHADOW = "1";
    process.env.USVI_AGENT_MODEL_PROVIDER = "auto";
    process.env.OPENAI_API_KEY = "router-test-openai-key";
    process.env.OPENAI_MODEL = "frontier-test-model";
    process.env.GPT_OSS_RESPONSES_URL = "http://127.0.0.1:11434/v1/responses";
    process.env.GPT_OSS_MODEL = "gpt-oss-20b";
    delete process.env.GPT_OSS_API_KEY;

    const configured = createConfiguredAdvisoryAgentWorker();
    assert.ok(configured instanceof IslandIntelligenceRouterWorker);
    assert.equal(configured.id, "island-intelligence-router");
    assert.equal(configured.model, "dynamic");
  } finally {
    restoreEnv("USVI_AGENT_WORKERS_SHADOW", previous.shadow);
    restoreEnv("USVI_AGENT_MODEL_PROVIDER", previous.provider);
    restoreEnv("OPENAI_API_KEY", previous.openaiKey);
    restoreEnv("OPENAI_MODEL", previous.openaiModel);
    restoreEnv("GPT_OSS_RESPONSES_URL", previous.ossUrl);
    restoreEnv("GPT_OSS_MODEL", previous.ossModel);
    restoreEnv("GPT_OSS_API_KEY", previous.ossKey);
  }

  console.log(
    "Island intelligence router tests passed: privacy-first routine routing, frontier escalation, provider fallback, dispatch, and auto configuration.",
  );
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

void runModelRouterTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
