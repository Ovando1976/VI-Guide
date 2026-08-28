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
const appNavigation = source("components/app-navigation.tsx");
const accountMenu = source("components/account-menu.tsx");
const pickupPositionControl = source("components/pickup-position-control.tsx");
const riderTripHistory = source("components/rider-trip-history.tsx");
const riderTripScopeBridge = source(
  "components/mobility/rider-trip-subscription-scope.tsx",
);
const riderSubscriptionScope = source("lib/rider-booking-subscription-scope.ts");
const firestoreTrips = source("lib/firestore-trips.ts");
const bookingReadRoute = source("app/api/bookings/[bookingId]/route.ts");
const adminPage = source("app/admin/page.tsx");
const authenticatedTravelerQaPage = source("app/admin/traveler-qa/page.tsx");
const authenticatedTravelerQa = source(
  "components/admin/authenticated-traveler-qa.tsx",
);

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

assert.match(appNavigation, /readSelectedTravelerTripPlanId/);
assert.match(appNavigation, /TRAVELER_TRIP_SELECTION_UPDATED_EVENT/);
assert.match(appNavigation, /TRAVELER_TRIP_SELECTION_STORAGE_KEY/);
assert.match(appNavigation, /selectedPlan && selectedIsland/);
assert.match(
  appNavigation,
  /\/trips\?trip=\$\{encodeURIComponent\(tripContext\.planId\)\}/,
  "the persistent My Trip nav target must retain the active JourneyPlan",
);
assert.match(
  appNavigation,
  /\/map\?island=\$\{tripContext\.island\}&trip=\$\{encodeURIComponent\(tripContext\.planId\)\}/,
  "the mobile Live Map nav target must preserve active trip identity and island",
);
assert.match(
  appNavigation,
  /\/concierge\?island=\$\{tripContext\.island\}&trip=\$\{encodeURIComponent\(tripContext\.planId\)\}/,
  "the mobile Concierge nav target must preserve active trip identity and island",
);
assert.match(appNavigation, /contextualHref\(base, activeIsland, tripContext\)/);

assert.doesNotMatch(
  accountMenu,
  /useSearchParams/,
  "the globally rendered account menu must not force a search-param prerender bailout",
);
assert.match(accountMenu, /readSelectedTravelerTripPlanId/);
assert.match(accountMenu, /TRAVELER_TRIP_SELECTION_UPDATED_EVENT/);
assert.match(accountMenu, /TRAVELER_TRIP_SELECTION_STORAGE_KEY/);
assert.match(accountMenu, /selectedPlan && selectedIsland/);
assert.match(
  accountMenu,
  /\/trips\?trip=\$\{encodeURIComponent\(tripContext\.planId\)\}/,
  "the account-menu My Trip target must retain the selected JourneyPlan",
);
assert.match(
  accountMenu,
  /\/map\?island=\$\{tripContext\.island\}&trip=\$\{encodeURIComponent\(tripContext\.planId\)\}/,
  "the account-menu Living Map target must retain selected trip identity and island",
);
assert.match(
  accountMenu,
  /destination = `\$\{window\.location\.pathname\}\$\{window\.location\.search\}`/,
  "sign-in return context must read the live pathname and query only when the traveler activates Sign in",
);
assert.match(
  accountMenu,
  /router\.push\(`\/login\?next=\$\{encodeURIComponent\(destination\)\}`\)/,
  "sign-in must return to the exact traveler route context without a global search-param hook",
);

assert.match(
  pickupPositionControl,
  /const stored = readPickupCookie\(\);[\s\S]*?\}, \[selectedGeoid\]\);/,
  "persisted exact-pickup context must be rechecked when the selected fare area hydrates or changes",
);
assert.match(
  pickupPositionControl,
  /context\.estateGeoid === selectedGeoid[\s\S]*?\}, \[context, selectedGeoid\]\);/,
  "changing fare areas must still clear stale precise-pickup context fail-closed",
);

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

assert.match(adminPage, /href: "\/admin\/traveler-qa"/);
assert.match(authenticatedTravelerQaPage, /session\.role !== "admin"/);
assert.match(authenticatedTravelerQaPage, /AuthenticatedTravelerQa/);
assert.match(authenticatedTravelerQa, /useAuth\(\)/);
assert.match(authenticatedTravelerQa, /readJourneyPlans\(\)/);
assert.match(authenticatedTravelerQa, /readSelectedTravelerTripPlanId\(\)/);
assert.match(authenticatedTravelerQa, /buildJourneyMobilityHref\(plan\)/);
assert.match(authenticatedTravelerQa, /\/trips\?trip=\$\{trip\}/);
assert.match(authenticatedTravelerQa, /\/map\?island=\$\{plan\.island\}&trip=\$\{trip\}/);
assert.match(authenticatedTravelerQa, /\/concierge\?island=\$\{plan\.island\}&trip=\$\{trip\}/);
assert.match(authenticatedTravelerQa, /viewport-fit=cover/);
assert.match(authenticatedTravelerQa, /Stripe test\/sandbox flow/);
assert.match(authenticatedTravelerQa, /4242 4242 4242 4242/);
assert.match(authenticatedTravelerQa, /Side-effect safety/);
assert.doesNotMatch(
  authenticatedTravelerQa,
  /createSessionCookie|createUserWithEmailAndPassword|signInWithEmailAndPassword/,
  "QA must use the operator's real authenticated browser session and never add a login bypass",
);

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
