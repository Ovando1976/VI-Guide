import assert from "node:assert/strict";

import {
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  resolveOfficialTaxiFareEndpoint,
  type OfficialTaxiFareEndpoint,
} from "../lib/official-taxi-fare-engine";
import type { OfficialTaxiRateRule } from "../types/taxi-operations";

const endpoint = (baseName: string): OfficialTaxiFareEndpoint => ({
  geoid: `test:${baseName}`,
  baseName,
});

const redHookDorothea: OfficialTaxiRateRule = {
  id: "stt-red-hook-dorothea-2022",
  originNames: ["Red Hook"],
  destinationNames: ["Dorothea"],
  onePassengerFare: 23,
  passengerFareTiers: [
    { minPassengers: 1, maxPassengers: 1, basis: "party", fare: 23 },
    { minPassengers: 2, basis: "per_person", fare: 16 },
  ],
  luggageFarePerPiece: 3,
};

assert.deepEqual(calculateOfficialTaxiRuleFare(redHookDorothea, 1, 0), {
  routeFare: 23,
  passengerFare: 0,
  luggageFare: 0,
});
assert.deepEqual(calculateOfficialTaxiRuleFare(redHookDorothea, 2, 0), {
  routeFare: 0,
  passengerFare: 32,
  luggageFare: 0,
});
assert.deepEqual(calculateOfficialTaxiRuleFare(redHookDorothea, 3, 2), {
  routeFare: 0,
  passengerFare: 48,
  luggageFare: 6,
});

const rules = [redHookDorothea];
const redHook = resolveOfficialTaxiFareEndpoint(rules, endpoint("Red Hook"));
const dorothea = resolveOfficialTaxiFareEndpoint(rules, endpoint("Dorothea"));
assert.equal(redHook.tariffEndpointName, "Red Hook");
assert.equal(dorothea.tariffEndpointName, "Dorothea");
assert.equal(findOfficialTaxiRateRule(rules, redHook, dorothea)?.id, redHookDorothea.id);
assert.equal(findOfficialTaxiRateRule(rules, dorothea, redHook)?.id, redHookDorothea.id);

// Do not broaden the published generic Dorothea relationship to distinct tariff identities.
for (const distinctName of ["Dorothea Estate", "Dorothea Lower", "Dorothea Upper"]) {
  const resolved = resolveOfficialTaxiFareEndpoint(rules, endpoint(distinctName));
  assert.equal(resolved.tariffEndpointName, undefined, `${distinctName} must remain distinct from generic Dorothea`);
  assert.equal(findOfficialTaxiRateRule(rules, redHook, resolved), null);
}

// Do not fuzzy-match nearby but unpublished labels into the governed route.
for (const unreviewed of ["Dorothea Estates", "Lower Dorothea", "Upper Dorothea"]) {
  assert.equal(resolveOfficialTaxiFareEndpoint(rules, endpoint(unreviewed)).tariffEndpointName, undefined);
}

console.log("STT governed Red Hook/Dorothea fare and fail-closed identity matrix passed.");
