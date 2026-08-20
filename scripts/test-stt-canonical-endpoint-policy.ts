import assert from "node:assert/strict";
import policy from "../data/taxi-tariff-repairs/stt-canonical-endpoint-policy.json";
import inventory from "../data/st-thomas-taxi-tariff-2022.inventory.json";

assert.equal(policy.schemaVersion, 1);
assert.equal(policy.island, "stt");
assert.equal(policy.tariffEffectiveDate, inventory.tariffEffectiveDate);

// Reviewed local geography: aliases aid geographic normalization but cannot erase tariff identities.
assert.equal(policy.reviewedTravelerAliases.Town, "Charlotte Amalie");
assert.equal(policy.reviewedTravelerAliases.Downtown, "Charlotte Amalie");
assert.equal(policy.reviewedTravelerAliases.Lindbergh, "Lindbergh Bay Estate");
assert.equal(policy.reviewedTravelerAliases.Dorothea, "Dorothea Estate");

assert.deepEqual(policy.geographicHierarchy["Dorothea Estate"].subareas, ["Dorothea Lower", "Dorothea Upper"]);
assert.equal(policy.geographicHierarchy["Lindbergh Bay Estate"].placeTypes["Lindberg Bay"], "beach");
assert.equal(policy.geographicHierarchy["Lindbergh Bay Estate"].placeTypes["Airport Terminal"], "airport_terminal");
assert.notEqual("Lindberg Bay", "Airport Terminal");

// Every source endpoint in the published inventory must remain addressable as an exact tariff identity.
type Five = [string, number, number, number | null, number | null];
type Explicit = [string, string, number, number];
const endpoints = new Set<string>(["Charlotte Amalie", "Airport Terminal"]);
for (const row of inventory.tables.hotelsToFromCharlotteAmalieAndAirport as Five[]) endpoints.add(row[0]);
for (const row of inventory.tables.miscToFromCharlotteAmalieAndAirport as Five[]) endpoints.add(row[0]);
for (const [origin, destination] of inventory.tables.explicitToFrom as Explicit[]) {
  endpoints.add(origin);
  if (destination) endpoints.add(destination);
}
for (const protectedIdentity of policy.protectedTariffIdentities) {
  assert.ok(endpoints.has(protectedIdentity), `protected tariff identity must exist in source inventory: ${protectedIdentity}`);
}

// Geographic aliases may not collapse financially distinct published tariff identities.
for (const identity of ["Dorothea", "Dorothea Estate", "Dorothea Lower", "Dorothea Upper"]) {
  assert.ok(endpoints.has(identity));
}
assert.ok(endpoints.has("Havensight (crossroad)"));
assert.ok(endpoints.has("Havensight (WICO)"));
assert.ok(policy.explicitlyFailClosedTravelerLabels.includes("Havensight"));

// Containment is not fare equivalence: estate/beach input must never be silently promoted to the airport endpoint.
assert.notEqual(policy.reviewedTravelerAliases.Lindbergh, "Airport Terminal");
assert.ok(!Object.prototype.hasOwnProperty.call(policy.reviewedTravelerAliases, "Lindberg Bay"));

// Ambiguous broad labels remain fail closed.
for (const label of ["Havensight", "Dorothea area", "Dorothea neighborhood"]) {
  assert.ok(policy.explicitlyFailClosedTravelerLabels.includes(label));
}

console.log(`STT canonical endpoint policy passed for ${endpoints.size} exact published endpoint identities.`);
