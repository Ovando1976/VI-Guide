import assert from "node:assert/strict";

import {
  buildShoreExcursionHref,
  canonicalCruiseTripId,
  createCanonicalCruiseTrip,
  cruiseJourneyContextFromPlan,
  cruiseMemoryFromJourneyPlan,
  materializeCruiseJourneyPlans,
} from "../lib/cruise-trip";
import type { CruiseSailing } from "../lib/cruise-inventory/types";

const sailing: CruiseSailing = {
  id: "mock-sailing-1",
  provider: "mock",
  supplierSailingId: "supplier-abc",
  cruiseLine: { id: "rccl", name: "Royal Caribbean" },
  ship: { id: "icon", name: "Icon of the Seas" },
  departurePort: { id: "MIA", name: "Miami" },
  arrivalPort: { id: "MIA", name: "Miami" },
  departureDate: "2026-11-01",
  returnDate: "2026-11-08",
  nights: 7,
  destinationNames: ["Eastern Caribbean", "U.S. Virgin Islands"],
  itinerary: [
    {
      sequence: 0,
      port: { id: "MIA", name: "Miami" },
      arrivesAt: null,
      departsAt: "2026-11-01T16:00:00-04:00",
      dayLabel: "Day 1",
    },
    {
      sequence: 3,
      port: { id: "HAV", name: "Havensight", city: "St. Thomas" },
      arrivesAt: "2026-11-04T08:00:00-04:00",
      departsAt: "2026-11-04T17:00:00-04:00",
      dayLabel: "Day 4",
    },
    {
      sequence: 4,
      port: { id: "FRED", name: "Frederiksted", city: "St. Croix" },
      arrivesAt: "2026-11-05T09:00:00-04:00",
      departsAt: "2026-11-05T18:00:00-04:00",
      dayLabel: "Day 5",
    },
  ],
  leadFare: null,
  cabinCategories: [],
  lastVerifiedAt: "2026-08-06T22:00:00-04:00",
  liveVerified: false,
};

const trip = createCanonicalCruiseTrip(sailing, new Date("2026-08-07T02:00:00.000Z"));
assert.equal(trip.id, canonicalCruiseTripId(sailing));
assert.equal(trip.portCalls[1].island, "stt");
assert.equal(trip.portCalls[1].shorePortId, "havensight");
assert.equal(trip.portCalls[1].arrivalTime, "08:00");
assert.equal(trip.portCalls[1].planningAllAboardTime, "16:30");
assert.equal(trip.portCalls[1].planningAllAboardSource, "derived_from_scheduled_departure");
assert.equal(trip.portCalls[2].island, "stx");
assert.equal(trip.portCalls[2].shorePortId, "frederiksted");

const plans = materializeCruiseJourneyPlans(
  trip,
  new Date("2026-08-07T02:00:00.000Z"),
);
assert.equal(plans.length, 2);
assert.equal(plans[0].date, "2026-11-04");
assert.equal(plans[0].island, "stt");
assert.equal(plans[0].plan[0].startTime, "08:00");
assert.equal(plans[0].plan[0].bookingHref?.includes("allAboard=16%3A30"), true);

const context = cruiseJourneyContextFromPlan(plans[0]);
assert.equal(context?.ship, "Icon of the Seas");
assert.equal(context?.allAboardTime, "16:30");
assert.equal(context?.allAboardSource, "derived_from_scheduled_departure");

const memory = cruiseMemoryFromJourneyPlan(plans[0]);
assert.equal(memory?.tripId, trip.id);
assert.equal(memory?.port?.island, "stt");
assert.equal(memory?.arrivalTime, "08:00");
assert.equal(memory?.allAboardTime, "16:30");

const href = buildShoreExcursionHref(trip, trip.portCalls[1]);
assert.equal(href.startsWith("/shore-excursions?"), true);
assert.equal(href.includes("ship=Icon+of+the+Seas"), true);
assert.equal(href.includes("portId=havensight"), true);
assert.equal(href.includes("allAboardEstimated=1"), true);

console.log("canonical cruise trip continuity tests passed");
