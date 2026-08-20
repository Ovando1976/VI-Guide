import assert from "node:assert/strict";
import inventory from "../data/st-thomas-taxi-tariff-2022.inventory.json";
import {
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  resolveOfficialTaxiFareEndpoint,
  type OfficialTaxiFareEndpoint,
} from "../lib/official-taxi-fare-engine";
import type { OfficialTaxiRateRule } from "../types/taxi-operations";

type Relationship = {
  id: string;
  origin: string;
  destination: string;
  onePassenger: number;
  twoPlusEach: number;
  kind: "route" | "within-town";
};

const endpoint = (baseName: string): OfficialTaxiFareEndpoint => ({ geoid: `stt-test:${baseName}`, baseName });
const slug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const makeRelationship = (origin: string, destination: string, onePassenger: number, twoPlusEach: number, kind: Relationship["kind"] = "route"): Relationship => ({
  id: `stt-${slug(origin)}-${slug(destination || "within")}`,
  origin,
  destination,
  onePassenger,
  twoPlusEach,
  kind,
});

const relationships: Relationship[] = [];
for (const [name, townOne, townTwo, airportOne, airportTwo] of inventory.tables.hotelsToFromCharlotteAmalieAndAirport) {
  relationships.push(makeRelationship(name, "Charlotte Amalie", townOne as number, townTwo as number));
  relationships.push(makeRelationship(name, "Airport Terminal", airportOne as number, airportTwo as number));
}
for (const [name, townOne, townTwo, airportOne, airportTwo] of inventory.tables.miscToFromCharlotteAmalieAndAirport) {
  relationships.push(makeRelationship(name, "Charlotte Amalie", townOne as number, townTwo as number));
  if (airportOne !== null && airportTwo !== null) relationships.push(makeRelationship(name, "Airport Terminal", airportOne as number, airportTwo as number));
}
for (const [origin, destination, onePassenger, twoPlusEach] of inventory.tables.explicitToFrom) {
  relationships.push(makeRelationship(origin, destination || origin, onePassenger, twoPlusEach, destination ? "route" : "within-town"));
}

assert.equal(relationships.length, inventory.relationshipCount, "every published STT relationship must enter the governed matrix");
assert.equal(relationships.length, 231);

const pairKey = (a: string, b: string) => [a, b].map((value) => value.trim().toLowerCase()).sort().join("\u0000");
const seen = new Map<string, Relationship>();
const exactConflicts: Array<{ first: Relationship; second: Relationship }> = [];
for (const relationship of relationships) {
  assert.ok(relationship.origin.trim().length > 0);
  assert.ok(relationship.destination.trim().length > 0);
  assert.ok(relationship.onePassenger > 0);
  assert.ok(relationship.twoPlusEach > 0);
  if (relationship.kind === "within-town") continue;
  const key = pairKey(relationship.origin, relationship.destination);
  const previous = seen.get(key);
  if (previous) {
    if (previous.onePassenger !== relationship.onePassenger || previous.twoPlusEach !== relationship.twoPlusEach) exactConflicts.push({ first: previous, second: relationship });
  } else {
    seen.set(key, relationship);
  }
}
assert.deepEqual(exactConflicts, [], "exact canonical STT counterparts must not disagree");

const toRule = (relationship: Relationship): OfficialTaxiRateRule => ({
  id: relationship.id,
  originNames: [relationship.origin],
  destinationNames: [relationship.destination],
  onePassengerFare: relationship.onePassenger,
  passengerFareTiers: [
    { minPassengers: 1, maxPassengers: 1, basis: "party", fare: relationship.onePassenger },
    { minPassengers: 2, basis: "per_person", fare: relationship.twoPlusEach },
  ],
  luggageFarePerPiece: inventory.additionalCharges.luggageStandardPerBag,
});

let routeCount = 0;
let withinTownCount = 0;
for (const relationship of relationships) {
  const rule = toRule(relationship);
  assert.deepEqual(calculateOfficialTaxiRuleFare(rule, 1, 0), { routeFare: relationship.onePassenger, passengerFare: 0, luggageFare: 0 });
  assert.deepEqual(calculateOfficialTaxiRuleFare(rule, 2, 0), { routeFare: 0, passengerFare: relationship.twoPlusEach * 2, luggageFare: 0 });
  assert.deepEqual(calculateOfficialTaxiRuleFare(rule, 3, 2), { routeFare: 0, passengerFare: relationship.twoPlusEach * 3, luggageFare: 6 });

  if (relationship.kind === "within-town") {
    withinTownCount += 1;
    assert.equal(relationship.origin, "Within Town Limits");
    assert.equal(relationship.onePassenger, 6);
    assert.equal(relationship.twoPlusEach, 6);
    continue;
  }

  routeCount += 1;
  const rules = [rule];
  const origin = resolveOfficialTaxiFareEndpoint(rules, endpoint(relationship.origin));
  const destination = resolveOfficialTaxiFareEndpoint(rules, endpoint(relationship.destination));
  assert.equal(origin.tariffEndpointName, relationship.origin);
  assert.equal(destination.tariffEndpointName, relationship.destination);
  assert.equal(findOfficialTaxiRateRule(rules, origin, destination)?.id, rule.id);
  assert.equal(findOfficialTaxiRateRule(rules, destination, origin)?.id, rule.id);
}
assert.equal(routeCount, 230);
assert.equal(withinTownCount, 1);

// Protected financially distinct identities must never collapse through the governed matcher.
const protectedNames = [
  "Dorothea",
  "Dorothea Estate",
  "Dorothea Lower",
  "Dorothea Upper",
  "Havensight (crossroad)",
  "Havensight (WICO)",
];
for (const protectedName of protectedNames) assert.ok(inventory.protectedDistinctIdentities.includes(protectedName));

const redHookDorothea = relationships.find((entry) => entry.origin === "Red Hook" && entry.destination === "Dorothea");
assert.ok(redHookDorothea);
assert.deepEqual([redHookDorothea.onePassenger, redHookDorothea.twoPlusEach], [23, 16]);

const dorotheaVariants = inventory.tables.miscToFromCharlotteAmalieAndAirport.filter(([name]) => String(name).startsWith("Dorothea "));
assert.deepEqual(dorotheaVariants.map(([name, townOne, townTwo, airportOne, airportTwo]) => [name, townOne, townTwo, airportOne, airportTwo]), [
  ["Dorothea Estate", 18, 14, 18, 14],
  ["Dorothea Lower", 25, 20, 25, 20],
  ["Dorothea Upper", 20, 15, 20, 15],
]);

// Conditional provisions not represented by the current quote engine remain fail-closed/non-computed.
assert.equal(inventory.additionalCharges.waitingPerMinute, 2);
assert.equal(inventory.additionalCharges.waitingFreeMinutes, 5);
assert.equal(inventory.additionalCharges.afterHoursMidnightTo6amPerPerson, 3);
assert.equal(inventory.additionalCharges.oversizedLuggageMaximumPerItem, 6);
assert.equal(inventory.additionalCharges.largeKennel, 45);
assert.equal(inventory.additionalCharges.smallKennel, 30);

console.log(`STT governed matrix passed for ${relationships.length} published relationships (${routeCount} bidirectional routes + ${withinTownCount} within-town rule).`);
