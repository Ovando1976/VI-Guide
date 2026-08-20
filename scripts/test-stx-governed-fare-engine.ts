import assert from "node:assert/strict";

import {
  OfficialTaxiRateUnavailableError,
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  resolveOfficialTaxiFareEndpoint,
  type OfficialTaxiFareEndpoint,
} from "../lib/official-taxi-fare-engine";
import type { OfficialTaxiRateRule } from "../types/taxi-operations";

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

console.log("STX governed fare engine fail-closed cases passed.");
