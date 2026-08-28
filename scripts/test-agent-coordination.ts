import assert from "node:assert/strict";

import { AgentBlackboard } from "../lib/intelligence/agent-blackboard";
import {
  CollectiveAgentRegistry,
  defaultCollectiveAgentRegistry,
} from "../lib/intelligence/agent-registry";
import {
  createCoordinationRootIntent,
  DEFAULT_COLLECTIVE_POLICY,
  evaluateAutonomousToolAccess,
} from "../lib/intelligence/agent-policy";
import {
  BoundedAgentCollective,
  planBoundedAgentCollective,
} from "../lib/intelligence/coordination-runtime";
import type { IntelligenceToolDescriptor } from "../lib/intelligence/tool-registry";
import type {
  IntelligenceCapability,
  IntelligenceRequest,
} from "../types/intelligence";

const now = "2026-08-28T15:00:00.000Z";
const fixedNow = () => new Date(now);

function request(): IntelligenceRequest {
  return {
    message:
      "Plan my STT arrival, taxi to Red Hook, ferry connection, and a St. John afternoon.",
    context: {
      sessionId: "session-agent-test-001",
      page: "concierge",
      island: "stt",
      now,
      timezone: "America/St_Thomas",
      party: { adults: 2, children: 0 },
      preferences: {
        interests: ["beaches", "local food"],
        pace: "balanced",
        budget: "moderate",
        food: [],
        avoid: [],
      },
      memory: {},
    },
    capabilities: ["recommend", "plan", "map", "mobility", "knowledge"],
  };
}

const safeTool: IntelligenceToolDescriptor = {
  id: "directory.search",
  name: "Directory search",
  description: "Read-only directory search.",
  category: "discovery",
  capability: "recommend",
  permissions: ["read"],
  risk: "low",
  requiresConfirmation: false,
  enabled: true,
  tags: [],
  version: "1.0.0",
};

const bookingTool: IntelligenceToolDescriptor = {
  id: "booking.review",
  name: "Booking review",
  description: "Booking review with an execution boundary.",
  category: "commerce",
  capability: "booking",
  permissions: ["read", "execute"],
  risk: "high",
  requiresConfirmation: true,
  enabled: true,
  tags: [],
  version: "1.0.0",
};

assert.equal(evaluateAutonomousToolAccess(safeTool).allowed, true);
assert.deepEqual(evaluateAutonomousToolAccess(bookingTool), {
  toolId: "booking.review",
  allowed: false,
  reason: "human_confirmation_required",
});

const registry = new CollectiveAgentRegistry();
registry.register({
  id: "planner-agent",
  name: "Planner",
  purpose: "Test planner.",
  capabilities: ["plan"],
  roles: ["specialist"],
  domains: ["test"],
  priority: 10,
  maxConcurrentTasks: 1,
  enabled: true,
  version: "1.0.0",
});
assert.throws(
  () =>
    registry.register({
      id: "planner-agent",
      name: "Planner duplicate",
      purpose: "Duplicate.",
      capabilities: ["plan"],
      roles: ["specialist"],
      domains: [],
      priority: 1,
      maxConcurrentTasks: 1,
      enabled: true,
      version: "1.0.0",
    }),
  /already registered/,
);

const rootIntent = createCoordinationRootIntent({
  id: "root-test",
  userMessage: "Plan a trip.",
  allowedCapabilities: ["plan", "map"],
  createdAt: fixedNow(),
});
assert.equal(Object.isFrozen(rootIntent), true);
assert.equal(Object.isFrozen(rootIntent.allowedCapabilities), true);

const plannerAgent = registry.get("planner-agent");
assert.ok(plannerAgent);
const concurrencyRoot = createCoordinationRootIntent({
  id: "concurrency-test",
  userMessage: "Test bounded concurrency.",
  allowedCapabilities: ["plan"],
  createdAt: fixedNow(),
});
const concurrencyBoard = new AgentBlackboard(
  concurrencyRoot,
  DEFAULT_COLLECTIVE_POLICY,
);
const firstPlanTask = concurrencyBoard.createTask({
  id: "plan-one",
  title: "Plan one",
  description: "First plan task.",
  requiredCapabilities: ["plan"],
  depth: 1,
  createdBy: "system",
  now: fixedNow(),
});
const secondPlanTask = concurrencyBoard.createTask({
  id: "plan-two",
  title: "Plan two",
  description: "Second plan task.",
  requiredCapabilities: ["plan"],
  depth: 1,
  createdBy: "system",
  now: fixedNow(),
});
concurrencyBoard.claimTask(firstPlanTask.id, plannerAgent, fixedNow());
assert.throws(
  () => concurrencyBoard.claimTask(secondPlanTask.id, plannerAgent, fixedNow()),
  /concurrency limit reached/,
);

const expiredPolicy = {
  ...DEFAULT_COLLECTIVE_POLICY,
  maxRuntimeMs: 1,
};
const expiredRoot = createCoordinationRootIntent({
  id: "runtime-test",
  userMessage: "Test bounded runtime.",
  allowedCapabilities: ["plan"],
  createdAt: fixedNow(),
  policy: expiredPolicy,
});
const expiredBoard = new AgentBlackboard(expiredRoot, expiredPolicy);
assert.throws(
  () =>
    expiredBoard.createTask({
      id: "too-late",
      title: "Too late",
      description: "Must fail after the runtime window.",
      requiredCapabilities: ["plan"],
      depth: 1,
      createdBy: "system",
      now: new Date(fixedNow().getTime() + 2),
    }),
  /runtime limit reached/,
);

const board = new AgentBlackboard(rootIntent, DEFAULT_COLLECTIVE_POLICY);
const mapTask = board.createTask({
  id: "map-task",
  title: "Resolve map",
  description: "Resolve map context.",
  requiredCapabilities: ["map"],
  depth: 1,
  createdBy: "system",
  now: fixedNow(),
});
const planTask = board.createTask({
  id: "plan-task",
  title: "Build plan",
  description: "Build after map.",
  requiredCapabilities: ["plan"],
  depth: 1,
  dependsOn: [mapTask.id],
  createdBy: "system",
  now: fixedNow(),
});
assert.equal(board.isReady(mapTask.id), true);
assert.equal(board.isReady(planTask.id), false);
assert.throws(
  () =>
    board.createTask({
      id: "escape-task",
      title: "Escape",
      description: "Must not be allowed.",
      requiredCapabilities: ["shell" as IntelligenceCapability],
      depth: 1,
      createdBy: "system",
      now: fixedNow(),
    }),
  /outside the immutable root intent/,
);

const mapAgent = defaultCollectiveAgentRegistry.get("mobility-coordinator");
const planAgent = defaultCollectiveAgentRegistry.get("travel-planner");
assert.ok(mapAgent);
assert.ok(planAgent);
board.claimTask(mapTask.id, mapAgent, fixedNow());
assert.throws(
  () => board.claimTask(mapTask.id, mapAgent, fixedNow()),
  /not claimable/,
);
assert.throws(
  () => board.claimTask(planTask.id, planAgent, fixedNow()),
  /dependencies are incomplete/,
);
board.completeTask(mapTask.id, mapAgent.id, "Map context resolved.", fixedNow());
assert.equal(board.isReady(planTask.id), true);
board.claimTask(planTask.id, planAgent, fixedNow());

const collective = new BoundedAgentCollective(
  request(),
  [safeTool],
  defaultCollectiveAgentRegistry,
  DEFAULT_COLLECTIVE_POLICY,
  ["map", "mobility", "plan"],
);
collective.addAgentById(
  "island-concierge",
  "Own the bounded traveler objective.",
);
const delegated = collective.delegate({
  fromAgentId: "island-concierge",
  title: "Resolve transfer",
  description: "Need mobility specialist.",
  requiredCapabilities: ["mobility"],
  depth: 1,
});
assert.equal(delegated.claimedBy, "mobility-coordinator");
assert.ok(
  collective
    .summary()
    .team.some((member) => member.agentId === "mobility-coordinator"),
);
assert.throws(
  () =>
    collective.delegate({
      fromAgentId: "island-concierge",
      title: "Unauthorized",
      description: "Try to expand authority.",
      requiredCapabilities: ["booking"],
      depth: 1,
    }),
  /outside the immutable root intent/,
);

const summary = planBoundedAgentCollective({
  request: request(),
  requiredCapabilities: ["recommend", "knowledge", "map", "plan", "mobility"],
  tools: [safeTool],
});
assert.equal(summary.status, "planned");
assert.ok(summary.team.some((member) => member.agentId === "travel-planner"));
assert.ok(
  summary.team.some((member) => member.agentId === "knowledge-specialist"),
);
assert.ok(
  summary.team.some((member) => member.agentId === "mobility-coordinator"),
);
assert.ok(
  summary.team.some((member) => member.agentId === "verification-critic"),
);
assert.ok(summary.tasks.length >= 5);
assert.ok(summary.messageCount >= 1);
assert.deepEqual(summary.safeAutonomousTools, ["directory.search"]);
assert.deepEqual(summary.missingCapabilities, []);
assert.ok(
  summary.tasks.some(
    (task) =>
      task.requiredCapabilities.includes("mobility") &&
      task.dependsOn.length === 1,
  ),
);

const bookingSummary = planBoundedAgentCollective({
  request: {
    ...request(),
    capabilities: ["booking"],
  },
  requiredCapabilities: ["booking"],
  tools: [bookingTool],
});
assert.deepEqual(bookingSummary.safeAutonomousTools, []);
assert.deepEqual(bookingSummary.blockedAutonomousTools, [
  {
    toolId: "booking.review",
    reason: "human_confirmation_required",
  },
]);
assert.ok(
  bookingSummary.team.some((member) => member.agentId === "booking-guardian"),
);

console.log(
  "Bounded agent coordination tests passed: immutable intent, recruitment, dependencies, runtime, concurrency, capability limits, and tool safety.",
);
