import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const home = source("app/page.tsx");
const rootLayout = source("app/layout.tsx");
const tripPlanning = source("app/trip-planning/page.tsx");
const cruiseHub = source("app/cruises/page.tsx");
const planner = source("app/planner/page.tsx");
const directory = source("components/directory/discovery-directory-page.tsx");
const directoryCard = source("components/directory/directory-card.tsx");
const directoryDetail = source("components/directory/directory-detail-screen.tsx");
const liveBeachDetail = source("components/beaches/live-beach-detail-screen.tsx");
const premiumDetailShell = source("components/place/premium-detail-shell.tsx");
const placeActionBar = source("components/place/place-action-bar.tsx");
const mobility = source("components/mobility-booking-screen.tsx");
const mapPage = source("app/map/page.tsx");
const mapEntityContextBar = source("components/map/map-entity-context-bar.tsx");
const appNavigation = source("components/app-navigation.tsx");
const journeyMapStateBridge = source("components/journey/journey-map-state-bridge.tsx");
const savedPage = source("app/saved/page.tsx");
const savedPlacesBoard = source("components/place/saved-places-board.tsx");
const merchantLayout = source("app/merchant/layout.tsx");
const merchantNav = source("components/merchant/merchant-console-nav.tsx");
const partnersLayout = source("app/partners/layout.tsx");
const bookingPage = source("app/book/page.tsx");
const bookingsPage = source("app/bookings/page.tsx");
const travelDeskPage = source("app/admin/travel-requests/page.tsx");
const travelDesk = source("components/admin/travel-request-board.tsx");
const travelRevenueOverview = source("components/admin/travel-advisor-revenue-overview.tsx");
const travelRevenuePanel = source("components/admin/travel-advisor-commerce-panel.tsx");
const travelProposalDesk = source("components/admin/travel-proposal-board.tsx");
const travelAdvisorRoute = source("app/api/travel-advisor/requests/route.ts");
const travelProposalRoute = source("app/api/travel-advisor/requests/[requestId]/proposal/route.ts");
const travelProposalQueueRoute = source("app/api/travel-advisor/proposals/route.ts");
const sharedTrip = source("app/shared-trip/[shareId]/page.tsx");
const cruiseDesk = source("components/admin/cruise-request-board.tsx");
const adminNav = source("components/admin-nav.tsx");
const mapLinks = source("lib/discovery/map-links.ts");
const globals = source("app/globals.css");

for (const [name, contents] of [
  ["home", home],
  ["trip planning", tripPlanning],
  ["cruise hub", cruiseHub],
  ["journey planner", planner],
  ["directory surfaces", directory],
  ["mobility", mobility],
  ["saved places", savedPage],
  ["partner surfaces", partnersLayout],
  ["booking request", bookingPage],
  ["booking status", bookingsPage],
] as const) {
  assert.match(contents, /ViPublicHeader/, `${name} must use ViPublicHeader`);
}

for (const [name, contents] of [
  ["catalog directory detail", directoryDetail],
  ["live beach detail", liveBeachDetail],
] as const) {
  assert.match(contents, /PremiumDetailShell/, `${name} must use PremiumDetailShell`);
}

assert.match(premiumDetailShell, /ViPublicHeader/);
assert.match(premiumDetailShell, /PlaceActionBar/);
assert.match(placeActionBar, /SavePlaceButton/);
assert.match(placeActionBar, /AddToJourneyButton/);
assert.match(placeActionBar, /Ask Concierge/);
assert.match(placeActionBar, /Book \/ request/);
assert.match(placeActionBar, /\/saved/);

assert.match(directoryCard, /SavePlaceButton/);
assert.match(directoryCard, /AddToJourneyButton/);
assert.match(directoryCard, /buildContextualConciergeHref/);
assert.match(directoryCard, /Navigation/);

assert.match(mapPage, /MapEntityContextBar/);
assert.match(mapEntityContextBar, /SavePlaceButton/);
assert.match(mapEntityContextBar, /AddToJourneyButton/);
assert.match(mapEntityContextBar, /My Trip/);
assert.match(mapLinks, /placeHref/);
assert.match(mapLinks, /placeSlug/);

assert.match(rootLayout, /JourneyMapStateBridge/);
assert.match(rootLayout, /ActiveIslandRouteSync/);
assert.match(journeyMapStateBridge, /TRIP_STORAGE_KEY/);
assert.match(journeyMapStateBridge, /JOURNEY_PLAN_UPDATED_EVENT/);
assert.match(appNavigation, /ACTIVE_ISLAND_UPDATED_EVENT/);
assert.match(appNavigation, /\/places\?island=/);
assert.match(appNavigation, /\/map\?island=/);
assert.match(appNavigation, /\/concierge\?island=/);

assert.match(savedPlacesBoard, /readSavedPlaces/);
assert.match(savedPlacesBoard, /AddToJourneyButton/);

assert.match(merchantLayout, /MerchantConsoleNav/);
assert.match(merchantNav, /aria-current/);
assert.match(partnersLayout, /\/partners\/apply/);
assert.match(partnersLayout, /\/partners\/status/);

for (const [name, contents] of [
  ["travel advisor desk", travelDesk],
  ["travel proposal desk", travelProposalDesk],
  ["cruise advisor desk", cruiseDesk],
] as const) {
  assert.match(contents, /AdminShell/, `${name} must use AdminShell`);
  assert.match(contents, /OpsMetric/, `${name} must use shared OpsMetric`);
  assert.match(contents, /OpsSection/, `${name} must use shared OpsSection`);
  assert.match(contents, /OpsPill/, `${name} must use shared OpsPill`);
}

assert.match(travelDesk, /Send through VI Guide/);
assert.match(travelDesk, /sendFollowup/);
assert.match(travelAdvisorRoute, /travel_advisor_followup/);
assert.match(travelAdvisorRoute, /traveler_followup_queued/);
assert.match(travelAdvisorRoute, /processBookingNotificationOutboxIds/);
assert.match(travelAdvisorRoute, /loadLinkedCommerceBookings/);
assert.match(travelAdvisorRoute, /summarizeTravelAdvisorBookings/);
assert.match(travelDeskPage, /TravelAdvisorRevenueOverview/);
assert.match(travelRevenueOverview, /Advisor bookings & recorded revenue/);
assert.match(travelRevenueOverview, /TravelAdvisorCommercePanel/);
assert.match(travelRevenuePanel, /Booking & revenue loop/);
assert.match(travelRevenuePanel, /Manage reservation/);

assert.match(travelProposalDesk, /readJourneyPlans/);
assert.match(travelProposalDesk, /Publish & send/);
assert.match(travelProposalDesk, /privacy-safe read-only itinerary/);
assert.match(travelProposalRoute, /buildTravelAdvisorProposalSnapshot/);
assert.match(travelProposalRoute, /travel_advisor_proposal/);
assert.match(travelProposalRoute, /proposal_published/);
assert.match(travelProposalRoute, /proposal_sent/);
assert.match(travelProposalRoute, /processBookingNotificationOutboxIds/);
assert.match(travelProposalQueueRoute, /proposalHref/);
assert.match(sharedTrip, /Prepared through the VI Guide Travel Advisor workflow/);
assert.match(sharedTrip, /not a confirmation/);

assert.match(adminNav, /\/admin\/travel-requests/);
assert.match(adminNav, /\/admin\/travel-proposals/);
assert.match(adminNav, /\/admin\/cruise-requests/);

for (const token of [
  "--vi-ink",
  "--vi-teal",
  "--vi-gold",
  "--vi-canvas",
  "--vi-surface",
  "--vi-line",
]) {
  assert.ok(globals.includes(token), `Missing shared UI token ${token}`);
}

console.log("VI Guide UI and customer-journey consistency contracts passed.");
