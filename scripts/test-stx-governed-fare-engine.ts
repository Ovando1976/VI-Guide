import "./test-stj-governed-fare-engine";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  OfficialTaxiRateUnavailableError,
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  resolveOfficialTaxiFareEndpoint,
  type OfficialTaxiFareEndpoint,
} from "../lib/official-taxi-fare-engine";
import type { OfficialTaxiRateRule } from "../types/taxi-operations";

type StxRow = [destination: string, oneOrTwo: number, threePlusEach: number];
type StxInventory = {
  island: string;
  effectiveDate: string;
  pricingModel: { oneOrTwo: string; threePlusEach: string };
  tables: Record<string, StxRow[]>;
  sourceHeadingNormalization: Record<string, string>;
};
type StxDirectionReconciliation = {
  method: string;
  verifiedDuplicateCounterparts: Array<{ pair: string; result: string }>;
  hubPairConflicts: unknown[];
};

const root = process.cwd();
const inventory = JSON.parse(
  fs.readFileSync(path.join(root, "data/st-croix-taxi-tariff-2022.rows.json"), "utf8"),
) as StxInventory;
const directionReconciliation = JSON.parse(
  fs.readFileSync(
    path.join(root, "data/taxi-tariff-repairs/stx-direct-reverse-reconciliation.json"),
    "utf8",
  ),
) as StxDirectionReconciliation;

function normalizedFinancialIdentity(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

assert.equal(inventory.island, "stx");
assert.equal(inventory.effectiveDate, "2022-10-24");
assert.deepEqual(inventory.pricingModel, {
  oneOrTwo: "group_total",
  threePlusEach: "per_person",
});
assert.deepEqual(inventory.sourceHeadingNormalization, { CAROMBOLA: "Carambola" });

const expectedTableCounts: Record<string, number> = {
  Airport: 52,
  Christiansted: 57,
  Frederiksted: 25,
  Carambola: 9,
};
assert.deepEqual(
  Object.fromEntries(Object.entries(inventory.tables).map(([hub, rows]) => [hub, rows.length])),
  expectedTableCounts,
);
assert.equal(
  Object.values(inventory.tables).reduce((sum, rows) => sum + rows.length, 0),
  143,
  "STX certification inventory must contain exactly 143 published rows",
);

for (const [hub, rows] of Object.entries(inventory.tables)) {
  const exactLabels = rows.map(([destination]) => destination);
  assert.equal(
    new Set(exactLabels).size,
    exactLabels.length,
    `${hub} contains duplicate published destination labels`,
  );
  for (const [destination, oneOrTwo, threePlusEach] of rows) {
    assert.ok(destination.trim().length > 0, `${hub} contains an empty financial identity`);
    assert.ok(oneOrTwo > 0, `${hub} -> ${destination} has invalid 1-2 passenger fare`);
    assert.ok(threePlusEach > 0, `${hub} -> ${destination} has invalid 3+ fare`);
  }
}

const canonicalLabels = new Map<string, Set<string>>();
for (const rows of Object.values(inventory.tables)) {
  for (const [destination] of rows) {
    const canonical = normalizedFinancialIdentity(destination);
    const labels = canonicalLabels.get(canonical) ?? new Set<string>();
    labels.add(destination);
    canonicalLabels.set(canonical, labels);
  }
}
for (const [canonical, labels] of canonicalLabels) {
  assert.equal(
    labels.size,
    1,
    `Distinct STX financial identities collapse under deterministic normalization: ${canonical} => ${[
      ...labels,
    ].join(" | ")}`,
  );
}

const protectedDistinctions: Array<[string, string]> = [
  ["Canaan", "Canaan Ridge"],
  ["La Grange", "La Grange Hill"],
  ["La Grange", "Little La Grange"],
  ["Mt. Washington (East End)", "Mt. Washington (West)"],
  ["Sandy Point", "Sandy Point (Nature Conserve)"],
  ["Grove Place Village", "Grove Place Hills"],
  ["Sunny Isle", "Sunny Isle/Island Center"],
  ["Cane Bay", "Cane Bay Plantation"],
  ["Carambola", "Carambolla"],
];
for (const [a, b] of protectedDistinctions) {
  assert.notEqual(
    normalizedFinancialIdentity(a),
    normalizedFinancialIdentity(b),
    `${a} and ${b} must remain distinct financial identities`,
  );
}

assert.match(
  directionReconciliation.method,
  /published TO\/FROM table as bidirectional/i,
  "STX direction certification must remain anchored to published TO/FROM semantics",
);
assert.equal(directionReconciliation.hubPairConflicts.length, 0);

const hubNames = new Set(Object.keys(inventory.tables));
let independentlyRepublishedCounterparts = 0;
for (const [originHub, rows] of Object.entries(inventory.tables)) {
  for (const [destination, oneOrTwo, threePlusEach] of rows) {
    if (!hubNames.has(destination) || originHub >= destination) continue;
    const reverse = inventory.tables[destination]?.find(([name]) => name === originHub);
    if (!reverse) continue;
    independentlyRepublishedCounterparts += 1;
    assert.deepEqual(
      [oneOrTwo, threePlusEach],
      [reverse[1], reverse[2]],
      `Published STX counterpart conflict: ${originHub} <-> ${destination}`,
    );
  }
}
assert.equal(
  independentlyRepublishedCounterparts,
  2,
  "Expected exactly two independently republished STX hub counterparts",
);
assert.equal(
  directionReconciliation.verifiedDuplicateCounterparts.filter(({ result }) => result === "exact_match")
    .length,
  2,
);

const airportToChristiansted: OfficialTaxiRateRule = {
  id: "stx-airport-christiansted",
  originNames: ["Airport"],
  destinationNames: ["Christiansted"],
  onePassengerFare: 24,
  passengerFareTiers: [
    { minPassengers: 1, maxPassengers: 2, basis: "party", fare: 24 },
    { minPassengers: 3, basis: "per_person", fare: 14 },
  ],
  luggageFarePerPiece: 3,
};

const frederikstedToCarambola: OfficialTaxiRateRule = {
  id: "stx-frederiksted-carambola",
  originNames: ["Frederiksted"],
  destinationNames: ["Carambola"],
  onePassengerFare: 41,
  passengerFareTiers: [
    { minPassengers: 1, maxPassengers: 2, basis: "party", fare: 41 },
    { minPassengers: 3, basis: "per_person", fare: 17 },
  ],
  luggageFarePerPiece: 3,
};

const rules = [airportToChristiansted, frederikstedToCarambola];
const endpoint = (baseName: string): OfficialTaxiFareEndpoint => ({
  geoid: `test:${baseName}`,
  baseName,
});

assert.deepEqual(calculateOfficialTaxiRuleFare(airportToChristiansted, 2, 0), {
  routeFare: 24,
  passengerFare: 0,
  luggageFare: 0,
});
assert.deepEqual(calculateOfficialTaxiRuleFare(airportToChristiansted, 3, 0), {
  routeFare: 0,
  passengerFare: 42,
  luggageFare: 0,
});
assert.equal(calculateOfficialTaxiRuleFare(airportToChristiansted, 2, 2).luggageFare, 6);

const airport = resolveOfficialTaxiFareEndpoint(rules, endpoint("Airport"));
const christiansted = resolveOfficialTaxiFareEndpoint(rules, endpoint("Christiansted"));
assert.equal(airport.tariffEndpointName, "Airport");
assert.equal(christiansted.tariffEndpointName, "Christiansted");
assert.equal(findOfficialTaxiRateRule(rules, airport, christiansted)?.id, airportToChristiansted.id);
assert.equal(findOfficialTaxiRateRule(rules, christiansted, airport)?.id, airportToChristiansted.id);

const carambola = resolveOfficialTaxiFareEndpoint(rules, endpoint("Carambola"));
const fuzzyCarambolla = resolveOfficialTaxiFareEndpoint(rules, endpoint("Carambolla"));
assert.equal(carambola.tariffEndpointName, "Carambola");
assert.equal(fuzzyCarambolla.tariffEndpointName, undefined);
assert.equal(findOfficialTaxiRateRule(rules, endpoint("Frederiksted"), fuzzyCarambolla), null);

const unknown = resolveOfficialTaxiFareEndpoint(rules, endpoint("UNKNOWN_STX_ORIGIN"));
assert.equal(unknown.tariffEndpointName, undefined);
assert.equal(findOfficialTaxiRateRule(rules, unknown, christiansted), null);

const disputed: OfficialTaxiRateRule = {
  ...airportToChristiansted,
  id: "stx-disputed-test",
  fareConfirmationRequired: "two_or_more",
  fareConfirmationReason: "test dispute",
};
assert.throws(
  () => calculateOfficialTaxiRuleFare(disputed, 2, 0),
  (error: unknown) =>
    error instanceof OfficialTaxiRateUnavailableError &&
    error.code === "OFFICIAL_TAXI_RATE_UNAVAILABLE",
);

console.log(
  "STX governed fare engine, 143-row identity audit, and direction matrix passed.",
);
