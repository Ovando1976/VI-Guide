import assert from "node:assert/strict";
import inventory from "../data/st-thomas-taxi-tariff-2022.inventory.json";

assert.equal(inventory.schemaVersion, 1);
assert.equal(inventory.island, "stt");
assert.equal(inventory.tariffEffectiveDate, "2022-10-24");
assert.equal(inventory.sourceRowCount, 141);
assert.equal(inventory.relationshipCount, 231);

const hotels = inventory.tables.hotelsToFromCharlotteAmalieAndAirport;
const misc = inventory.tables.miscToFromCharlotteAmalieAndAirport;
const explicit = inventory.tables.explicitToFrom;
assert.equal(hotels.length, 28);
assert.equal(misc.length, 63);
assert.equal(explicit.length, 50);
assert.equal(hotels.length + misc.length + explicit.length, inventory.sourceRowCount);

for (const row of hotels) {
  assert.equal(row.length, 5);
  assert.equal(typeof row[0], "string");
  for (const fare of row.slice(1)) assert.ok(fare === null || (typeof fare === "number" && fare > 0));
}
for (const row of misc) {
  assert.equal(row.length, 5);
  assert.equal(typeof row[0], "string");
  for (const fare of row.slice(1)) assert.ok(fare === null || (typeof fare === "number" && fare > 0));
}
for (const row of explicit) {
  assert.equal(row.length, 4);
  assert.equal(typeof row[0], "string");
  assert.equal(typeof row[1], "string");
  assert.ok(typeof row[2] === "number" && row[2] > 0);
  assert.ok(typeof row[3] === "number" && row[3] > 0);
}

const names = (rows: unknown[][]) => rows.map((row) => String(row[0]));
assert.equal(new Set(names(hotels)).size, hotels.length, "hotel source labels must be unique");
assert.equal(new Set(names(misc)).size, misc.length, "misc source labels must be unique");

const explicitKeys = explicit.map((row) => `${row[0]}\u0000${row[1]}`);
assert.equal(new Set(explicitKeys).size, explicit.length, "explicit source relationships must be unique");

for (const protectedName of [
  "Dorothea",
  "Dorothea Estate",
  "Dorothea Lower",
  "Dorothea Upper",
  "Havensight (crossroad)",
  "Havensight (WICO)",
]) assert.ok(inventory.protectedDistinctIdentities.includes(protectedName));

assert.deepEqual(inventory.additionalCharges, {
  luggageStandardPerBag: 3,
  oversizedLuggageMaximumPerItem: 6,
  waitingPerMinute: 2,
  waitingFreeMinutes: 5,
  afterHoursMidnightTo6amPerPerson: 3,
  largeKennel: 45,
  smallKennel: 30,
  roundTrip: "double one-way fare plus waiting charges",
  radioPhoneOnePassenger: "fare plus one third of basic fare",
  radioPhoneMultiplePassengers: "add 2 per passenger",
});

assert.equal(inventory.requiredChecks.allPublishedRowsTranscribed, true);
assert.equal(inventory.requiredChecks.publishedRowCountLocked, true);
assert.equal(inventory.requiredChecks.canonicalEndpointAuditComplete, false);

console.log("STT full tariff inventory structure and source counts passed.");
