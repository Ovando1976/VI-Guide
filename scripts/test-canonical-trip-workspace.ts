import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { scopeRiderBookingsToJourneyPlans } from "../lib/traveler-ride-scope";

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
const riderTripScopeBridge = source(
  "components/mobility/rider-trip-subscription-scope.tsx",
);
const riderSubscriptionScope = source("lib/rider-booking-subscription-scope.ts");
const firestoreTrips = source("lib/firestore-trips.ts");
const bookingReadRoute = source("app/api/bookings/[bookingId]/route.ts");

assert.match(legacyWorkspace, /redirect\("\/trips"\)/);
assert.doesNotMatch(legacyWorkspace, /ReservationEnabledWorkspace/);
assert.doesNotMatch(legacyWorkspace, /Traveler Workspace/);

assert.match(tripsPage, /title: "My Trip \| USVI Explorer"/);
assert.match(tripsPage, /TravelerTripCommandCenter/);
assert.match(tripsPage, /TravelerTripReadinessPanel/);
assert.match(tripsPage, /RiderLiveDriverMap/);
assert.match(tripsPage, /RiderTripSubscriptionScope/);
assert.match(
  tripsPage,
  /<RiderTripSubscriptionScope \/>[\s\S]*<RiderTripTiming riderId=/,
);
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
assert.match(riderTripScopeBridge, /resolveTravelerTripScope/);
assert.match(riderTripScopeBridge, /scope\?\.planIds/);
assert.match(riderTripScopeBridge, /TRAVELER_TRIP_SELECTION_UPDATED_EVENT/);
assert.match(riderTripScopeBridge, /function handlePopState\(\)/);
assert.match(
  riderTripScopeBridge,
  /plans\.some\(\(plan\) => plan\.id === queryPlanId\)/,
);
assert.match(
  riderTripScopeBridge,
  /writeSelectedTravelerTripPlanId\(queryPlanId\)/,
  "browser history must persist a valid URL trip before ride scope refreshes",
);
assert.match(
  riderTripScopeBridge,
  /window\.addEventListener\("popstate", handlePopState\)/,
);
assert.doesNotMatch(
  riderTripScopeBridge,
  /window\.addEventListener\("popstate", refreshScope\)/,
  "popstate must synchronize the visible trip selection, not only the ride scope",
);
assert.match(riderSubscriptionScope, /scopeRiderBookingsToJourneyPlans/);
assert.match(firestoreTrips, /scopeRiderBookingSubscription\(latestBookings\)/);
assert.match(firestoreTrips, /subscribeToRiderBookingScopeUpdates/);
assert.match(bookingReadRoute, /rideIdentity/);
assert.match(bookingReadRoute, /booking\.riderId === session\.uid/);

const riderBookings = [
  { id: "ride-day-one", journeyPlanId: "plan_day_1" },
  { id: "ride-other-trip", journeyPlanId: "plan_other" },
  { id: "ride-day-two", journeyPlanId: "plan_day_2" },
  { id: "ride-legacy", journeyPlanId: null },
];

assert.deepEqual(
  scopeRiderBookingsToJourneyPlans(riderBookings, ["plan_day_1", "plan_day_2"]).map(
    (booking) => booking.id,
  ),
  ["ride-day-one", "ride-day-two"],
  "My Trip must keep every ride from the active multi-day JourneyPlan scope",
);
assert.deepEqual(
  scopeRiderBookingsToJourneyPlans(riderBookings, ["plan_other"]).map(
    (booking) => booking.id,
  ),
  ["ride-other-trip"],
  "switching My Trip must immediately isolate the other trip's rides",
);
assert.deepEqual(
  scopeRiderBookingsToJourneyPlans(riderBookings, null).map(
    (booking) => booking.id,
  ),
  riderBookings.map((booking) => booking.id),
  "rider surfaces outside My Trip must retain the account-wide subscription",
);
assert.equal(
  scopeRiderBookingsToJourneyPlans(riderBookings, ["plan_day_1"]).some(
    (booking) => booking.id === "ride-legacy",
  ),
  false,
  "an unscoped legacy ride must never populate a selected trip's live controls",
);

console.log("USVI Explorer canonical My Trip workspace contracts passed.");
