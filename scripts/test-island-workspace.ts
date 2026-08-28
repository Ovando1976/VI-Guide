import assert from "node:assert/strict";

import { projectIntelligenceToIslandWorkspace } from "../lib/intelligence/island-workspace-projector";
import type { IntelligenceResponse } from "../types/intelligence";

const privateRootIntentId = "private-root-intent-must-not-project";
const privateSessionId = "workspace-private-session";

const response: IntelligenceResponse = {
  runId: "workspace-test-run",
  answer: "Your St. Thomas mission is grounded and ready for review.",
  intent: "day_plan",
  confidence: "high",
  context: {
    sessionId: privateSessionId,
    page: "concierge",
    island: "stt",
    now: "2026-08-28T16:45:00.000Z",
    timezone: "America/St_Thomas",
    party: { adults: 2, children: 0, accessibilityNeeds: [] },
    preferences: {
      interests: ["beaches"],
      pace: "balanced",
      budget: "moderate",
      food: [],
      avoid: [],
    },
    memory: {},
  },
  plan: [
    {
      id: "stop-magens",
      title: "Magens Bay",
      island: "stt",
      kind: "beach",
      summary: "Grounded beach stop.",
      startTime: "09:00",
      durationMinutes: 90,
      mapHref: "/map?island=stt",
    },
  ],
  recommendations: [
    {
      id: "beach-magens",
      title: "Magens Bay",
      kind: "beach",
      island: "stt",
      summary: "Reviewed St. Thomas beach.",
      score: 0.96,
      href: "/beaches",
      mapHref: "/map?island=stt",
      reasons: ["Reviewed directory match"],
    },
  ],
  actions: [
    {
      id: "booking-review",
      type: "start_booking",
      label: "Review booking",
      href: "/booking/review",
      requiresConfirmation: true,
    },
  ],
  memoryPatch: {},
  warnings: [],
  orchestration: {
    status: "ready",
    intent: "day_plan",
    requiredCapabilities: ["recommend", "plan", "booking"],
    missingInformation: [],
    trace: [
      {
        node: "ground",
        status: "completed",
        detail: "Grounded the response in reviewed USVI Explorer records.",
        completedAt: "2026-08-28T16:45:01.000Z",
      },
    ],
    coordination: {
      version: 1,
      status: "planned",
      rootIntentId: privateRootIntentId,
      rootIntentExpiresAt: "2026-08-28T16:45:15.000Z",
      team: [
        {
          agentId: "travel-planner",
          name: "Travel Planner",
          roles: ["specialist"],
          capabilities: ["recommend", "plan"],
          reason: "Mission planning requested.",
        },
      ],
      tasks: [
        {
          id: "task-plan",
          title: "Build grounded trip plan",
          requiredCapabilities: ["plan"],
          status: "claimed",
          depth: 0,
          dependsOn: [],
          claimedBy: "travel-planner",
        },
      ],
      messageCount: 1,
      safeAutonomousTools: ["directory.search"],
      blockedAutonomousTools: [
        {
          toolId: "booking.review",
          reason: "human_confirmation_required",
        },
      ],
      missingCapabilities: [],
      limits: {
        maxAgents: 6,
        maxTasks: 12,
        maxMessages: 48,
        maxDepth: 2,
        maxRuntimeMs: 15_000,
      },
    },
  },
  generatedAt: "2026-08-28T16:45:02.000Z",
};

const projection = projectIntelligenceToIslandWorkspace(response);
assert.equal(projection.version, 1);
assert.equal(projection.island, "stt");
assert.equal(projection.mission.length, 1);
assert.equal(projection.recommendations.length, 1);
assert.equal(projection.actions.length, 1);
assert.equal(projection.actions[0]?.id, response.actions[0]?.id);
assert.equal(projection.actions[0]?.href, response.actions[0]?.href);
assert.equal(projection.actions[0]?.requiresConfirmation, true);
assert.equal(projection.agentActivity[0]?.name, "Travel Planner");
assert.equal(projection.agentActivity[0]?.status, "working");

const serialized = JSON.stringify(projection);
assert.equal(serialized.includes(privateRootIntentId), false);
assert.equal(serialized.includes(privateSessionId), false);
assert.equal(serialized.includes("rootIntentExpiresAt"), false);
assert.equal(serialized.includes("safeAutonomousTools"), false);
assert.equal(serialized.includes("blockedAutonomousTools"), false);

assert.deepEqual(
  projection.actions.map((action) => action.id),
  response.actions.map((action) => action.id),
  "The presentation projector must not mint executable actions.",
);

console.log(
  "Island workspace projection tests passed: mission projection, privacy minimization, and governed-action preservation.",
);
