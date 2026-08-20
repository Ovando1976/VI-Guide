import "./test-stt-governed-fare-engine";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  resolveOfficialTaxiFareEndpoint,
  type OfficialTaxiFareEndpoint,
} from "../lib/official-taxi-fare-engine";
import type { OfficialTaxiRateRule } from "../types/taxi-operations";

type Inventory = {
  island: string;
  effectiveAt: string;
  hubs: Array<{ name: string; routes: Array<[string, number, number]> }>;
};

const inventoryPath = fileURLToPath(new URL("../data/st-john-taxi-tariff-2022.inventory.json", import.meta.url));
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as Inventory;
assert.equal(inventory.island, "stj");
assert.match(inventory.effectiveAt, /^2022-10-24/);
assert.deepEqual(inventory.hubs.map(({ name, routes }) => [name, routes.length]), [["Cruz Bay",47],["Coral Bay",21],["Gallows Point",15],["Caneel Bay",17],["Westin Resort",25],["Neptune Landing/Windmill",14]]);
assert.equal(inventory.hubs.reduce((total, hub) => total + hub.routes.length, 0), 139);
for (const hub of inventory.hubs) {
  const labels = hub.routes.map(([label]) => label);
  assert.equal(new Set(labels).size, labels.length, `${hub.name} contains duplicate route labels`);
  for (const [label, onePassenger, twoPlusEach] of hub.routes) {
    assert.ok(label.trim().length > 0);
    assert.ok(onePassenger > 0, `${hub.name} -> ${label} has invalid one-passenger fare`);
    assert.ok(twoPlusEach > 0, `${hub.name} -> ${label} has invalid 2+ fare`);
  }
}
const hub = (name: string) => { const found = inventory.hubs.find((entry) => entry.name === name); assert.ok(found, `missing STJ hub ${name}`); return found; };
const route = (hubName: string, destination: string) => { const found = hub(hubName).routes.find(([label]) => label === destination); assert.ok(found, `missing ${hubName} -> ${destination}`); return found; };
assert.deepEqual(route("Coral Bay", "Trunk Bay (via Centerline)"), ["Trunk Bay (via Centerline)",29,20]);
assert.deepEqual(route("Coral Bay", "Trunk Bay (via North Shore)"), ["Trunk Bay (via North Shore)",14,11]);
assert.deepEqual(route("Caneel Bay", "Coral Bay (Via Centerline)"), ["Coral Bay (Via Centerline)",27,15]);
assert.deepEqual(route("Caneel Bay", "Coral Bay (Via Northshore)"), ["Coral Bay (Via Northshore)",20,14]);
assert.deepEqual(route("Caneel Bay", "Westin"), ["Westin",12,9]);
assert.deepEqual(route("Westin Resort", "Caneel Bay"), ["Caneel Bay",12,10]);

const endpoint = (baseName: string): OfficialTaxiFareEndpoint => ({ geoid: `test:${baseName}`, baseName });
const exactRule = (id: string, origin: string, destination: string, onePassenger: number, twoPlusEach: number, luggageFarePerPiece?: number): OfficialTaxiRateRule => ({
  id, originNames:[origin], destinationNames:[destination], onePassengerFare:onePassenger,
  passengerFareTiers:[{minPassengers:1,maxPassengers:1,basis:"party",fare:onePassenger},{minPassengers:2,basis:"per_person",fare:twoPlusEach}],
  ...(luggageFarePerPiece === undefined ? {} : { luggageFarePerPiece }),
});
const spellingRules = [
  exactRule("stj-lameshur","Cruz Bay","Lameshur",38,25),
  exactRule("stj-hawksnest","Cruz Bay","Hawksnest",9,8),
  exactRule("stj-jumbie-beach","Cruz Bay","Jumbie Beach",12,9),
  exactRule("stj-neptune","Neptune Landing/Windmill","Cruz Bay",12,9,3),
];
assert.equal(resolveOfficialTaxiFareEndpoint(spellingRules, endpoint("Lamishur")).tariffEndpointName, undefined);
assert.equal(resolveOfficialTaxiFareEndpoint(spellingRules, endpoint("Hawknest")).tariffEndpointName, undefined);
assert.equal(resolveOfficialTaxiFareEndpoint(spellingRules, endpoint("Jumbie Bay")).tariffEndpointName, undefined);

const reviewedWindmillAlias = endpoint("Neptune Landing/Windmill");
const resolvedWindmill = resolveOfficialTaxiFareEndpoint(spellingRules, reviewedWindmillAlias);
assert.equal(resolvedWindmill.tariffEndpointName, "Neptune Landing/Windmill");
const cruzBay = resolveOfficialTaxiFareEndpoint(spellingRules, endpoint("Cruz Bay"));
assert.equal(findOfficialTaxiRateRule(spellingRules, resolvedWindmill, cruzBay)?.id, "stj-neptune");
assert.deepEqual(calculateOfficialTaxiRuleFare(spellingRules[3]!, 2, 2), { routeFare:0, passengerFare:18, luggageFare:6 });

const centerlineRule = exactRule("stj-coral-trunk-centerline","Coral Bay","Trunk Bay (via Centerline)",29,20);
const northShoreRule = exactRule("stj-coral-trunk-north-shore","Coral Bay","Trunk Bay (via North Shore)",14,11);
const routeRules = [centerlineRule,northShoreRule];
const coral = resolveOfficialTaxiFareEndpoint(routeRules, endpoint("Coral Bay"));
const centerline = resolveOfficialTaxiFareEndpoint(routeRules, endpoint("Trunk Bay (via Centerline)"));
const northShore = resolveOfficialTaxiFareEndpoint(routeRules, endpoint("Trunk Bay (via North Shore)"));
assert.equal(findOfficialTaxiRateRule(routeRules, coral, centerline)?.id, centerlineRule.id);
assert.equal(findOfficialTaxiRateRule(routeRules, coral, northShore)?.id, northShoreRule.id);
assert.notEqual(centerline.tariffEndpointName, northShore.tariffEndpointName);

const governedCaneelWestin = exactRule("stj-caneel-westin-governed","Caneel Bay","Westin Resort",12,10,3);
assert.deepEqual(calculateOfficialTaxiRuleFare(governedCaneelWestin,1,0), {routeFare:12,passengerFare:0,luggageFare:0});
assert.deepEqual(calculateOfficialTaxiRuleFare(governedCaneelWestin,2,0), {routeFare:0,passengerFare:20,luggageFare:0});
assert.deepEqual(calculateOfficialTaxiRuleFare(governedCaneelWestin,3,0), {routeFare:0,passengerFare:30,luggageFare:0});
assert.deepEqual(calculateOfficialTaxiRuleFare(governedCaneelWestin,2,3), {routeFare:0,passengerFare:20,luggageFare:9});
const governedRules = [governedCaneelWestin];
const caneel = resolveOfficialTaxiFareEndpoint(governedRules, endpoint("Caneel Bay"));
const westin = resolveOfficialTaxiFareEndpoint(governedRules, endpoint("Westin Resort"));
assert.equal(findOfficialTaxiRateRule(governedRules,caneel,westin)?.id, governedCaneelWestin.id);
assert.equal(findOfficialTaxiRateRule(governedRules,westin,caneel)?.id, governedCaneelWestin.id);

console.log("STJ governed fare identity, reconciliation, and deterministic luggage matrix passed.");
