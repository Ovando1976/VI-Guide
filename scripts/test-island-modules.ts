import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import {
  attachIslandUIEnvelope,
} from "../lib/intelligence/island-ui-bindings";
import {
  buildAllIslandModuleBindings,
  buildIslandModuleBindings,
} from "../lib/intelligence/island-module-bindings";
import { normalizeIslandPresentationPlan } from "../lib/intelligence/island-ui-plan";
import { projectIntelligenceToIslandWorkspace } from "../lib/intelligence/island-workspace-projector";
import { runIntelligenceEngine } from "../lib/intelligence/engine";
import type {
  IntelligenceContext,
  IntelligenceRequest,
} from "../types/intelligence";

const context: IntelligenceContext = {
  sessionId: "island_module_test_session",
  page: "concierge",
  island: "stt",
  now: "2026-08-28T18:00:00.000Z",
  timezone: "America/St_Thomas",
  party: { adults: 2, children: 0, accessibilityNeeds: [] },
  preferences: {
    interests: ["snorkeling", "events", "dining"],
    pace: "balanced",
    budget: "moderate",
    food: [],
    avoid: [],
  },
  memory: {},
};

const request: IntelligenceRequest = {
  message:
    "Show me snorkeling activities, upcoming events, dinner, a car rental or Jeep, and ferry options on St. Thomas.",
  context,
  capabilities: ["recommend", "plan", "map", "mobility", "booking", "knowledge"],
};

const response = runIntelligenceEngine(request);
const selectedBindings = buildIslandModuleBindings(request, response);
const selectedIds = Object.keys(selectedBindings);
assert.ok(selectedIds.length > 0, "Relevant traveler-module bindings must be selected.");

const selectedKinds = new Set(
  Object.values(selectedBindings).map((binding) => binding.kind),
);
for (const kind of ["experience", "event", "dining", "car_rental", "ferry"]) {
  assert.ok(selectedKinds.has(kind), `Relevant catalog selection must include ${kind}.`);
}

const maliciousPresentation = {
  mode: "discovery",
  focus: "recommendations",
  blocks: [
    {
      component: "CatalogDeck",
      source: "catalog",
      bindingIds: ["catalog:event:invented-event"],
      variant: "expanded",
      priority: 99,
    },
  ],
};

const normalized = normalizeIslandPresentationPlan(
  maliciousPresentation,
  response,
  selectedIds,
);
const catalogDeck = normalized.blocks.find(
  (block) => block.component === "CatalogDeck",
);
assert.ok(catalogDeck, "CatalogDeck must be restored when trusted catalog bindings exist.");
assert.deepEqual(
  catalogDeck?.bindingIds,
  selectedIds.slice(0, 8),
  "Generated UI must not mint traveler-module binding IDs.",
);

const envelope = attachIslandUIEnvelope(
  response,
  maliciousPresentation,
  request,
);
const projection = projectIntelligenceToIslandWorkspace(envelope);
assert.ok(projection.catalog.length > 0, "Selected traveler modules must project.");
assert.equal(
  JSON.stringify(projection).includes("catalog:event:invented-event"),
  false,
  "Invented module binding IDs must never project.",
);

const allBindings = buildAllIslandModuleBindings();
assert.ok(allBindings.length > 0, "Public traveler-module catalog must not be empty.");
const allKinds = new Set(allBindings.map((binding) => binding.kind));
for (const kind of ["experience", "event", "dining", "car_rental", "ferry"]) {
  assert.ok(allKinds.has(kind), `Public module coverage must include ${kind}.`);
}

for (const binding of allBindings) {
  assert.ok(binding.title.trim(), `${binding.id} must have a canonical title.`);
  assert.ok(binding.summary.trim(), `${binding.id} must have canonical summary data.`);
  assert.ok(
    binding.provenance.sourceId.trim(),
    `${binding.id} must retain canonical source identity.`,
  );
  assert.ok(
    binding.href?.startsWith("/"),
    `${binding.id} must hand off to a safe specialist route.`,
  );

  if (binding.kind === "dining" && !binding.provenance.sourceUrls.length) {
    assert.equal(
      binding.provenance.sourceSystem,
      "dining-directory",
      `${binding.id} may omit an external URL only when the canonical dining directory is the source of record.`,
    );
  } else {
    assert.ok(
      binding.provenance.sourceUrls.length > 0,
      `${binding.id} must retain at least one external authority URL.`,
    );
  }

  assert.ok(
    binding.image.src.startsWith("/images/"),
    `${binding.id} must resolve to local trusted imagery.`,
  );
  assert.ok(binding.image.alt.trim(), `${binding.id} must have truthful image alt text.`);
  const imagePath = resolve(
    process.cwd(),
    "public",
    binding.image.src.replace(/^\//, ""),
  );
  assert.ok(
    existsSync(imagePath),
    `Module image/fallback missing for ${binding.id}: ${binding.image.src}`,
  );
  assert.ok(
    statSync(imagePath).size > 512,
    `Module image/fallback too small for ${binding.id}: ${binding.image.src}`,
  );

  if (binding.image.status === "context") {
    assert.match(
      binding.image.alt,
      /context image/i,
      `Context fallback for ${binding.id} must identify itself as context.`,
    );
    assert.match(
      binding.image.alt,
      /not a .*specific photograph/i,
      `Context fallback for ${binding.id} must not imply an item-specific photograph.`,
    );
  }

  if (binding.kind === "experience") {
    assert.ok(
      ["operator-listed", "seasonal", "request-only"].includes(binding.status ?? ""),
      `${binding.id} must preserve catalog status instead of claiming live inventory.`,
    );
  }

  if (binding.kind === "ferry") {
    assert.ok(
      [
        "verified-current",
        "temporary-override",
        "operator-dependent",
        "verify-current",
      ].includes(binding.status ?? ""),
      `${binding.id} must preserve governed ferry schedule status.`,
    );
  }
}

const workspaceSource = readFileSync(
  resolve(
    process.cwd(),
    "components/island-workspace/island-generative-workspace.tsx",
  ),
  "utf8",
);
assert.match(workspaceSource, /CatalogDeck/);
assert.match(workspaceSource, /Operator-listed does not mean live inventory/);
assert.doesNotMatch(workspaceSource, /catalog:event:invented-event/);

console.log(
  `Island traveler-module tests passed: exact CatalogDeck binding IDs, truthful image fallbacks, governed ferry/experience status, safe specialist handoffs, and source identity across ${allBindings.length} connected entries.`,
);
