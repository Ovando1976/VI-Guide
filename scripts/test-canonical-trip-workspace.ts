import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const legacyWorkspace = source("app/workspace/page.tsx");
const tripsPage = source("app/trips/page.tsx");
const tripMapLink = source("components/trips/trip-aware-living-map-link.tsx");
const tripConciergeLink = source(
  "components/trips/trip-aware-concierge-link.tsx",
);
const riderTripHistory = source("components/rider-trip-history.tsx");
const bookingReadRoute = source("app/api/bookings/[bookingId]/route.ts");

assert.match(legacyWorkspace, /redirect\("\/trips"\)/);
assert.doesNotMatch(legacyWorkspace, /ReservationEnabledWorkspace/);
assert.doesNotMatch(legacyWorkspace, /Traveler Workspace/);

assert.match(tripsPage, /title: "My Trip \| USVI Explorer"/);
assert.match(tripsPage, /TravelerTripCommandCenter/);
assert.match(tripsPage, /TravelerTripReadinessPanel/);
assert.match(tripsPage, /RiderLiveDriverMap/);
assert.match(tripsPage, /Open Planner/);
assert.match(tripsPage, /TripAwareLivingMapLink/);
assert.match(tripsPage, /TripAwareConciergeLink/);
assert.match(tripConciergeLink, /Ask Concierge/);
assert.match(tripConciergeLink, /readSelectedTravelerTripPlanId/);
assert.match(tripConciergeLink, /params\.set\("island", plan\.island\)/);
assert.match(tripConciergeLink, /params\.set\("trip", plan\.id\)/);
assert.match(tripConciergeLink, /Current stops:/);
assert.match(tripMapLink, /Open Living Map/);
assert.match(tripMapLink, /Open journey map/);
assert.match(tripMapLink, /mapHrefForJourneyPlan/);
assert.match(riderTripHistory, /Live ride card/);
assert.match(riderTripHistory, /Verified pickup identity/);
assert.match(riderTripHistory, /Pickup PIN/);
assert.match(riderTripHistory, /Call dispatch/);
assert.match(riderTripHistory, /Official fare/);
assert.match(riderTripHistory, /Pickup map/);
assert.match(bookingReadRoute, /rideIdentity/);
assert.match(bookingReadRoute, /booking\.riderId === session\.uid/);

console.log("USVI Explorer canonical My Trip workspace contracts passed.");
