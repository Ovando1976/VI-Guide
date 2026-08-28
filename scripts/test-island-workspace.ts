import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import {
  attachIslandUIEnvelope,
  resolveTrustedDirectoryImage,
} from "../lib/intelligence/island-ui-bindings";
import { normalizeIslandPresentationPlan } from "../lib/intelligence/island-ui-plan";
import { projectIntelligenceToIslandWorkspace } from "../lib/intelligence/island-workspace-projector";
import { runIntelligenceEngine } from "../lib/intelligence/engine";
import { ALL_PUBLIC_TRAVEL_KNOWLEDGE, getTravelKnowledge } from "../lib/travel-knowledge";
import type { IntelligenceContext, IntelligenceResponse } from "../types/intelligence";

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
      placeId: "beach-magens",
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
  warnings: ["Return window needs review."],
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

const maliciousPresentation = {
  mode: "journey",
  focus: "mission",
  blocks: [
    {
      component: "ActionDock",
      source: "actions",
      bindingIds: ["invented-payment-action"],
      variant: "persistent",
      priority: 100,
    },
    {
      component: "RecommendationDeck",
      source: "recommendations",
      bindingIds: ["fake-place-id"],
      variant: "expanded",
      priority: 99,
    },
    {
      component: "RawHtml",
      source: "workspace",
      bindingIds: [],
      variant: "primary",
      priority: 100,
    },
  ],
};

const normalized = normalizeIslandPresentationPlan(maliciousPresentation, response);
const components = normalized.blocks.map((block) => block.component);
assert.ok(components.includes("WorldCanvas"), "WorldCanvas must be mandatory.");
assert.ok(components.includes("MissionTimeline"), "MissionTimeline must be mandatory for a plan.");
assert.ok(components.includes("WarningPanel"), "Warnings cannot be hidden by generated UI.");
assert.ok(components.includes("ConfirmationCard"), "Confirmations cannot be hidden by generated UI.");
assert.ok(components.includes("ActionDock"), "Server actions cannot be hidden by generated UI.");
assert.equal(components.includes("RawHtml" as never), false, "Unknown UI components must be rejected.");
const actionDock = normalized.blocks.find((block) => block.component === "ActionDock");
assert.deepEqual(actionDock?.bindingIds, ["booking-review"], "Generated UI must not mint action IDs.");
const recommendationDeck = normalized.blocks.find((block) => block.component === "RecommendationDeck");
assert.deepEqual(recommendationDeck?.bindingIds, ["beach-magens"], "Unknown recommendation bindings must fall back to grounded records.");

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
assert.ok(projection.recommendations[0]?.image.src.startsWith("/images/"));
assert.ok(projection.mission[0]?.image.src.startsWith("/images/"));

const serialized = JSON.stringify(projection);
assert.equal(serialized.includes(privateRootIntentId), false);
assert.equal(serialized.includes(privateSessionId), false);
assert.equal(serialized.includes("rootIntentExpiresAt"), false);
assert.equal(serialized.includes("safeAutonomousTools"), false);
assert.equal(serialized.includes("blockedAutonomousTools"), false);
assert.equal(serialized.includes("invented-payment-action"), false);
assert.equal(serialized.includes("RawHtml"), false);
assert.deepEqual(
  projection.actions.map((action) => action.id),
  response.actions.map((action) => action.id),
  "The presentation projector must not mint executable actions.",
);

const context: IntelligenceContext = {
  sessionId: "island_binding_test_session",
  page: "concierge",
  island: "stt",
  now: "2026-08-28T16:50:00.000Z",
  timezone: "America/St_Thomas",
  party: { adults: 2, children: 0, accessibilityNeeds: [] },
  preferences: { interests: ["beaches"], pace: "balanced", budget: "moderate", food: [], avoid: [] },
  memory: {},
};
const grounded = runIntelligenceEngine({
  message: "Find Magens Bay and other good St. Thomas beaches.",
  context,
});
const withEnvelope = attachIslandUIEnvelope(grounded, maliciousPresentation);
const boundProjection = projectIntelligenceToIslandWorkspace(withEnvelope);
assert.ok(boundProjection.recommendations.length > 0);

for (const recommendation of boundProjection.recommendations) {
  assert.ok(recommendation.image.src.startsWith("/images/"), `${recommendation.title} must resolve to a local image or context fallback.`);
  assert.ok(recommendation.image.alt.trim().length > 0, `${recommendation.title} must have truthful alt text.`);
  assert.ok(recommendation.provenance.sourceId.length > 0, `${recommendation.title} must have source identity.`);
  const imagePath = resolve(process.cwd(), "public", recommendation.image.src.replace(/^\//, ""));
  assert.ok(existsSync(imagePath), `Resolved Island image is missing: ${recommendation.image.src}`);
  assert.ok(statSync(imagePath).size > 512, `Resolved Island image is suspiciously small: ${recommendation.image.src}`);
}

const canonicalByRecommendation = new Map<string, ReturnType<typeof getTravelKnowledge>[number]>();
for (const kind of ["places", "beaches", "historic", "stays"] as const) {
  for (const item of getTravelKnowledge(kind)) canonicalByRecommendation.set(`${kind}:${item.id}`, item);
}
for (const recommendation of boundProjection.recommendations) {
  const canonical = canonicalByRecommendation.get(recommendation.id);
  if (!canonical) continue;
  assert.equal(recommendation.title, canonical.name, "Rendered title must come from canonical travel knowledge.");
  assert.equal(recommendation.summary, canonical.description, "Rendered summary must come from canonical travel knowledge.");
  assert.equal(recommendation.island, canonical.island, "Rendered island must come from canonical travel knowledge.");
}

for (const item of ALL_PUBLIC_TRAVEL_KNOWLEDGE) {
  const image = resolveTrustedDirectoryImage(item);
  assert.ok(image.src.startsWith("/images/"), `${item.name} must resolve to local trusted imagery.`);
  assert.ok(image.alt.trim().length > 0, `${item.name} must have image alt text.`);
  const imagePath = resolve(process.cwd(), "public", image.src.replace(/^\//, ""));
  assert.ok(existsSync(imagePath), `Catalog image/fallback missing for ${item.name}: ${image.src}`);
  assert.ok(statSync(imagePath).size > 512, `Catalog image/fallback too small for ${item.name}: ${image.src}`);
  if (image.status === "context") {
    assert.match(image.alt, /context image/i, `Fallback image for ${item.name} must clearly identify itself as context.`);
  }
}

const generativeWorkspaceSource = readFileSync(
  resolve(process.cwd(), "components/island-workspace/island-generative-workspace.tsx"),
  "utf8",
);
const livingWorldSource = readFileSync(
  resolve(process.cwd(), "components/island-workspace/island-living-world-canvas.tsx"),
  "utf8",
);
assert.match(generativeWorkspaceSource, /IslandLivingWorldCanvas/);
assert.match(generativeWorkspaceSource, /selectedPlace:\s*\{/);
assert.match(generativeWorkspaceSource, /kind:\s*selectedPlace\.type/);
assert.match(livingWorldSource, /queryTerritoryMapPlaces/);
assert.match(livingWorldSource, /fetch\("\/api\/estates"/);
assert.match(livingWorldSource, /workspace\.selectPlace\(selection\)/);
assert.match(livingWorldSource, /focusedPlaceId=/);
assert.match(livingWorldSource, /PUBLIC_LENSES/);
assert.doesNotMatch(livingWorldSource, /TRIP_STORAGE_KEY|savePlaceToTrip/);
assert.doesNotMatch(livingWorldSource, /booking\.review|payment|checkout/i);

console.log(
  `Island workspace + generative UI tests passed: privacy, mandatory safety blocks, binding integrity, governed actions, canonical data, synchronized Living Map context, and trusted image coverage for ${ALL_PUBLIC_TRAVEL_KNOWLEDGE.length} public records.`,
);
