import assert from "node:assert/strict";
import policy from "../data/taxi-tariff-repairs/stt-canonical-endpoint-policy.json";
import inventory from "../data/st-thomas-taxi-tariff-2022.inventory.json";

assert.equal(policy.schemaVersion, 1);
assert.equal(policy.island, "stt");
assert.equal(policy.tariffEffectiveDate, inventory.tariffEffectiveDate);
assert.equal(policy.reviewedTravelerAliases.Town, "Charlotte Amalie");
assert.equal(policy.reviewedTravelerAliases.Downtown, "Charlotte Amalie");
assert.equal(policy.reviewedTravelerAliases.Lindbergh, "Lindbergh Bay Estate");
assert.equal(policy.reviewedTravelerAliases.Dorothea, "Dorothea Estate");
assert.deepEqual(policy.geographicHierarchy["Dorothea Estate"].subareas, ["Dorothea Lower", "Dorothea Upper"]);
assert.equal(policy.geographicHierarchy["Lindbergh Bay Estate"].placeTypes["Lindberg Bay"], "beach");
assert.equal(policy.geographicHierarchy["Lindbergh Bay Estate"].placeTypes["Airport Terminal"], "airport_terminal");

type Five = [string, number, number, number | null, number | null];
type Explicit = [string, string, number, number];
const endpoints = new Set<string>(["Charlotte Amalie", "Airport Terminal"]);
for (const row of inventory.tables.hotelsToFromCharlotteAmalieAndAirport as Five[]) endpoints.add(row[0]);
for (const row of inventory.tables.miscToFromCharlotteAmalieAndAirport as Five[]) endpoints.add(row[0]);
for (const [origin, destination] of inventory.tables.explicitToFrom as Explicit[]) {
  endpoints.add(origin);
  if (destination) endpoints.add(destination);
}

for (const identity of ["Airport Terminal", "Dorothea", "Dorothea Estate", "Dorothea Lower", "Dorothea Upper", "Havensight (crossroad)", "Havensight (WICO)"]) {
  assert.ok(endpoints.has(identity), `published protected tariff identity missing: ${identity}`);
}

// Lindberg Bay is reviewed geography (the beach), but it is not a published fare endpoint in this inventory.
// Its absence must remain fail-closed rather than being promoted to Airport Terminal by geographic containment.
assert.ok(!endpoints.has("Lindberg Bay"));
assert.notEqual(policy.reviewedTravelerAliases.Lindbergh, "Airport Terminal");
assert.ok(!Object.prototype.hasOwnProperty.call(policy.reviewedTravelerAliases, "Lindberg Bay"));
assert.equal(policy.geographicHierarchy["Lindbergh Bay Estate"].placeTypes["Lindberg Bay"], "beach");
assert.equal(policy.geographicHierarchy["Lindbergh Bay Estate"].placeTypes["Airport Terminal"], "airport_terminal");

assert.ok(policy.explicitlyFailClosedTravelerLabels.includes("Havensight"));
assert.notEqual("Havensight (crossroad)", "Havensight (WICO)");
for (const label of ["Havensight", "Dorothea area", "Dorothea neighborhood"]) assert.ok(policy.explicitlyFailClosedTravelerLabels.includes(label));

console.log(`STT canonical endpoint policy passed for ${endpoints.size} exact published endpoint identities; non-tariff geography remains fail closed for fare selection.`);
