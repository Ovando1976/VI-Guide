import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  FISHING_OFFICIAL_SOURCES,
  FISHING_RULE_AREAS,
  FISHING_SPECIES,
} from "../lib/fishing-handbook";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/fishing/page.tsx"), "utf8");
const explorer = fs.readFileSync(
  path.join(root, "components/fishing/fishing-explorer.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Fishing shared shell contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "Fishing uses shared USVI Explorer public chrome"],
  ['actionHref="/map"', "shared header keeps Living Map handoff"],
  ['actionLabel="Open Living Map"', "shared header labels the map action clearly"],
  ['secondaryHref="/concierge?prompt=', "shared header keeps Concierge handoff"],
  ['secondaryLabel="Ask VI Concierge"', "shared header owns the Concierge action label"],
  ["FishingExplorer", "existing Fishing explorer remains mounted"],
] as const) {
  expectSource(page, value, label);
}

for (const [value, label] of [
  ["FISHING_DISCLAIMER", "current-regulations warning remains visible"],
  ["FISHING_SPECIES", "species catalog remains intact"],
  ["FISHING_RULE_AREAS", "rule-sensitive water coverage remains visible"],
  ["FISHING_OFFICIAL_SOURCES", "official source cards remain visible"],
  ["U.S. Virgin Islands Fisher Guide", "Fishing hero keeps its domain identity"],
  ["Check current regulations before every trip", "regulatory caution remains explicit"],
  ["Protected", "protected-species status remains visible"],
  ["Rules apply", "restricted-species status remains visible"],
  ["Catch & release", "catch-and-release status remains visible"],
  ["Territory coverage", "territory scope remains visible"],
  ["Rule-sensitive waters", "protected-area warning section remains visible"],
  ["Official rule sources", "official-source section remains visible"],
] as const) {
  expectSource(explorer, value, label);
}

for (const [value, label] of [
  ['href="/map"', "Fishing explorer must not duplicate the shared Map action"],
  ['href="/map?concierge=open"', "Fishing explorer must not keep the stale map-query Concierge action"],
  ['from "next/link"', "Fishing explorer must not retain navigation-only Link chrome"],
] as const) {
  if (explorer.includes(value)) {
    throw new Error(`Fishing shared shell contract failed: ${label}`);
  }
}

assert.ok(
  FISHING_SPECIES.length >= 20,
  "Fishing catalog unexpectedly shrank below restored managed-species coverage",
);

for (const name of [
  "Yellowtail Snapper",
  "Mutton Snapper",
  "Lane Snapper",
  "Goliath Grouper",
  "Nassau Grouper",
  "Queen Conch",
  "Caribbean Spiny Lobster",
  "Tarpon",
  "Bonefish",
  "Dolphinfish (Mahi-mahi)",
  "Wahoo",
]) {
  assert.ok(
    FISHING_SPECIES.some((species) => species.commonName === name),
    `Core fishing species missing: ${name}`,
  );
}

assert.ok(
  FISHING_SPECIES.some((species) => species.status === "restricted"),
  "Fishing coverage needs restricted managed species",
);
assert.ok(
  FISHING_SPECIES.some((species) => species.status === "protected"),
  "Fishing coverage needs protected species",
);
assert.ok(
  FISHING_SPECIES.some((species) => species.status === "catch-and-release"),
  "Fishing coverage needs catch-and-release gamefish",
);

const sourceIds = new Set(FISHING_OFFICIAL_SOURCES.map((source) => source.id));
for (const source of FISHING_OFFICIAL_SOURCES) {
  assert.ok(source.label.trim(), `${source.id} needs a source label`);
  assert.ok(source.authority.trim(), `${source.id} needs a source authority`);
  assert.match(source.url, /^https:\/\//, `${source.id} needs an HTTPS official URL`);
  assert.match(
    source.verifiedAt,
    /^\d{4}-\d{2}-\d{2}$/,
    `${source.id} needs verifiedAt`,
  );
}

assert.ok(
  FISHING_OFFICIAL_SOURCES.some((source) => source.authority === "USVI DPNR"),
  "Fishing coverage needs a territorial authority source",
);
assert.ok(
  FISHING_OFFICIAL_SOURCES.some((source) => source.authority === "NOAA Fisheries"),
  "Fishing coverage needs a federal authority source",
);

for (const species of FISHING_SPECIES) {
  assert.ok(species.sourceIds.length > 0, `${species.id} needs official provenance`);
  assert.match(
    species.verifiedAt,
    /^\d{4}-\d{2}-\d{2}$/,
    `${species.id} needs verifiedAt`,
  );
  for (const sourceId of species.sourceIds) {
    assert.ok(sourceIds.has(sourceId), `${species.id} has unknown source: ${sourceId}`);
  }
}

const queenConch = FISHING_SPECIES.find((species) => species.id === "queen-conch");
assert.ok(queenConch, "Queen conch must remain in fishing catalog");
assert.equal(
  queenConch.waters,
  "both",
  "Queen conch must reflect territorial and federal USVI management",
);
assert.ok(
  queenConch.sourceIds.includes("noaa-queen-conch-2026"),
  "Queen conch needs the current 2026 NOAA closure source",
);

for (const protectedId of [
  "goliath-grouper",
  "nassau-grouper",
  "blue-parrotfish",
  "midnight-parrotfish",
  "rainbow-parrotfish",
]) {
  assert.equal(
    FISHING_SPECIES.find((species) => species.id === protectedId)?.status,
    "protected",
    `${protectedId} must remain protected in the governed fishing guide`,
  );
}

for (const catchReleaseId of ["tarpon", "bonefish"]) {
  assert.equal(
    FISHING_SPECIES.find((species) => species.id === catchReleaseId)?.status,
    "catch-and-release",
    `${catchReleaseId} must remain catch-and-release in the governed fishing guide`,
  );
}

assert.ok(
  FISHING_RULE_AREAS.length >= 7,
  "Fishing rule-area coverage unexpectedly shrank",
);
for (const area of FISHING_RULE_AREAS) {
  assert.ok(area.restriction.trim(), `${area.id} needs a restriction summary`);
  assert.ok(area.sourceIds.length > 0, `${area.id} needs official provenance`);
  assert.match(
    area.verifiedAt,
    /^\d{4}-\d{2}-\d{2}$/,
    `${area.id} needs verifiedAt`,
  );
  for (const sourceId of area.sourceIds) {
    assert.ok(sourceIds.has(sourceId), `${area.id} has unknown source: ${sourceId}`);
  }
}

assert.equal(
  new Set(FISHING_SPECIES.map((species) => species.id)).size,
  FISHING_SPECIES.length,
  "Fishing species IDs must be unique",
);
assert.equal(
  new Set(FISHING_OFFICIAL_SOURCES.map((source) => source.id)).size,
  FISHING_OFFICIAL_SOURCES.length,
  "Fishing source IDs must be unique",
);
assert.equal(
  new Set(FISHING_RULE_AREAS.map((area) => area.id)).size,
  FISHING_RULE_AREAS.length,
  "Fishing rule-area IDs must be unique",
);

console.log(
  `USVI Explorer Fishing coverage and shared-shell contracts passed for ${FISHING_SPECIES.length} species, ${FISHING_RULE_AREAS.length} rule areas, and ${FISHING_OFFICIAL_SOURCES.length} official sources.`,
);
