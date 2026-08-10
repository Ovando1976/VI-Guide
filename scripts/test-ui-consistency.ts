import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const home = source("app/page.tsx");
const rootLayout = source("app/layout.tsx");
const tripPlanning = source("app/trip-planning/page.tsx");
const tripsPage = source("app/trips/page.tsx");
const todayPage = source("app/today/page.tsx");
const travelerTripCommand = source("components/trips/traveler-trip-command-center.tsx");
const travelerTripModel = source("lib/traveler-trip-command.ts");
const travelerTripReadiness = source("components/trips/traveler-trip-readiness-panel.tsx");
const travelerTripReadinessModel = source("lib/traveler-trip-readiness.ts");
const travelerTripScope = source("lib/traveler-trip-scope.ts");
const travelerTripSelection = source("lib/traveler-trip-selection.ts");
const journeyPlannerModel = source("lib/journey-planner.ts");
const journeyCloudSync = source("components/journey/journey-cloud-sync.tsx");
const journeyCloudState = source("lib/journey-cloud-state.ts");
const journeySyncState = source("lib/journey-sync-state.ts");
const journeySyncRoute = source("app/api/journeys/route.ts");
const cruiseHub = source("app/cruises/page.tsx");
const cruiseAdvisor = source("app/cruises/plan/page.tsx");
const cruisePortCalls = source("app/cruises/port-calls/page.tsx");
const shoreExcursionsLayout = source("app/shore-excursions/layout.tsx");
const planner = source("app/planner/page.tsx");
const directory = source("components/directory/discovery-directory-page.tsx");
const directoryCard = source("components/directory/directory-card.tsx");
const directoryDetail = source("components/directory/directory-detail-screen.tsx");
const liveBeachDetail = source("components/beaches/live-beach-detail-screen.tsx");
const premiumDetailShell = source("components/place/premium-detail-shell.tsx");
const placeActionBar = source("components/place/place-action-bar.tsx");
const addToJourneyButton = source("components/journey/add-to-journey-button.tsx");
const mobility = source("components/mobility-booking-screen.tsx");
const mobilityBooking = source("components/booking-panel.tsx");
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
const travelConversionRoute = source("app/api/travel-advisor/conversion/route.ts");
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
  ["traveler trip command", tripsPage],
  ["my day", todayPage],
  ["cruise hub", cruiseHub],
  ["cruise advisor", cruiseAdvisor],
  ["official cruise port calls", cruisePortCalls],
  ["shore excursion flow", shoreExcursionsLayout],
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

assert.match(cruiseAdvisor, /CruiseHubNav/);
assert.match(cruiseAdvisor, /secondaryHref="\/trips"/);
assert.match(cruisePortCalls, /CruiseHubNav/);
assert.match(cruisePortCalls, /actionHref="\/cruises\/plan"/);
assert.match(shoreExcursionsLayout, /actionHref="\/cruises\/plan"/);
assert.match(shoreExcursionsLayout, /secondaryHref="\/cruises"/);

for (const [name, contents] of [
  ["catalog directory detail", directoryDetail],
  ["live beach detail", liveBeachDetail],
] as const) {
  assert.match(contents, /PremiumDetailShell/, `${name} must use PremiumDetailShell`);
}

assert.match(directory, /actionHref="\/trips"/);
assert.match(directory, /actionLabel=\{`My Trip · \$\{savedStopCount\}`\}/);
assert.doesNotMatch(directory, /actionHref="\/planner"/);

assert.match(premiumDetailShell, /ViPublicHeader/);
assert.match(premiumDetailShell, /secondaryHref="\/trips"/);
assert.match(premiumDetailShell, /href="\/trips"/);
assert.doesNotMatch(premiumDetailShell, /(?:secondaryHref|href)="\/planner"/);
assert.match(premiumDetailShell, /PlaceActionBar/);
assert.match(placeActionBar, /SavePlaceButton/);
assert.match(placeActionBar, /AddToJourneyButton/);
assert.match(placeActionBar, /Ask Concierge/);
assert.match(placeActionBar, /Book \/ request/);
assert.match(placeActionBar, /\/saved/);

assert.match(addToJourneyButton, /href="\/planner"/);
assert.match(addToJourneyButton, /Saved · Open planner/);
assert.doesNotMatch(addToJourneyButton, /Saved · View trip/);

assert.match(directoryCard, /SavePlaceButton/);
assert.match(directoryCard, /AddToJourneyButton/);
assert.match(directoryCard, /buildContextualConciergeHref/);
assert.match(directoryCard, /Navigation/);

assert.match(mapPage, /MapEntityContextBar/);
assert.match(mapPage, /href="\/planner"/);
assert.match(mapPage, /Plan itinerary/);
assert.doesNotMatch(mapPage, /> Open trip/);
assert.match(mapEntityContextBar, /SavePlaceButton/);
assert.match(mapEntityContextBar, /AddToJourneyButton/);
assert.match(mapEntityContextBar, /My Trip/);
assert.match(mapLinks, /placeHref/);
assert.match(mapLinks, /placeSlug/);

assert.match(rootLayout, /JourneyCloudSync/);
assert.match(rootLayout, /JourneyMapStateBridge/);
assert.match(rootLayout, /ActiveIslandRouteSync/);
assert.match(journeyMapStateBridge, /TRIP_STORAGE_KEY/);
assert.match(journeyMapStateBridge, /JOURNEY_PLAN_UPDATED_EVENT/);
assert.match(journeyCloudSync, /mergeJourneyCloudState/);
assert.match(journeyCloudSync, /readJourneyTombstones/);
assert.match(journeyCloudSync, /TRAVELER_TRIP_SELECTION_UPDATED_EVENT/);
assert.match(journeyCloudSync, /pathname === "\/trips"/);
assert.match(journeyCloudState, /journeyTombstoneIds/);
assert.match(journeyCloudState, /resolveTravelerTripSelection/);
assert.match(journeySyncState, /JOURNEY_TOMBSTONES_STORAGE_KEY/);
assert.match(journeySyncState, /rememberJourneyDeletion/);
assert.match(journeySyncRoute, /journeySync/);
assert.match(journeySyncRoute, /mergeJourneyTombstones/);
assert.match(journeySyncRoute, /activePlanId/);
assert.match(journeySyncRoute, /activePlanUpdatedAt/);
assert.match(appNavigation, /ACTIVE_ISLAND_UPDATED_EVENT/);
assert.match(appNavigation, /\/places\?island=/);
assert.match(appNavigation, /\/map\?island=/);
assert.match(appNavigation, /\/concierge\?island=/);
assert.match(appNavigation, /base: "\/trips", label: "My Trip"/);
assert.match(appNavigation, /"\/bookings"/);

assert.match(tripsPage, /TravelerTripCommandCenter/);
assert.match(tripsPage, /TravelerTripReadinessPanel/);
assert.match(tripsPage, /ProactiveTripIntelligence/);
assert.match(tripsPage, /commerceBookings/);
assert.match(tripsPage, /travelPlanningRequests/);
assert.match(tripsPage, /RiderLiveDriverMap/);
assert.match(travelerTripCommand, /readJourneyPlans/);
assert.match(travelerTripCommand, /readTrackedBookings/);
assert.match(travelerTripCommand, /Active trip scope/);
assert.match(travelerTripCommand, /buildTravelerTripScopes/);
assert.match(travelerTripCommand, /scopeTravelerTripRecords/);
assert.match(travelerTripCommand, /writeSelectedTravelerTripPlanId/);
assert.match(travelerTripCommand, /Bookings & payments/);
assert.match(travelerTripCommand, /Travel Advisor/);
assert.match(travelerTripCommand, /Live transportation|Mobility/);
assert.match(travelerTripModel, /summarizeTravelerTrip/);
assert.match(travelerTripModel, /Payment ready/);
assert.match(travelerTripModel, /Your advisor proposal is ready/);
assert.match(travelerTripModel, /sourceProposal|proposalHref/);
assert.match(travelerTripReadiness, /evaluateTravelerTripReadiness/);
assert.match(travelerTripReadiness, /scopeTravelerTripRecords/);
assert.match(travelerTripReadiness, /Scoped to/);
assert.match(travelerTripReadiness, /supplier confirmation or guarantee/);
assert.match(travelerTripReadinessModel, /payment_required/);
assert.match(travelerTripReadinessModel, /Replace unavailable booking/);
assert.match(travelerTripReadinessModel, /Advisor proposal available/);
assert.match(travelerTripScope, /buildTravelerTripScopes/);
assert.match(travelerTripScope, /resolveTravelerTripScope/);
assert.match(travelerTripScope, /recordMatchesScope/);
assert.match(travelerTripSelection, /TRAVELER_TRIP_SELECTION_STORAGE_KEY/);
assert.match(travelerTripSelection, /activePlan|updatedAt|TravelerTripSelection/);
assert.match(travelerTripSelection, /prioritizeSelectedTravelerPlan/);
assert.match(journeyPlannerModel, /prioritizeSelectedTravelerPlan/);
assert.match(journeyPlannerModel, /rememberJourneyDeletion/);
assert.match(journeyPlannerModel, /forgetJourneyDeletion/);
assert.match(todayPage, /ProactiveTripIntelligence/);
assert.match(todayPage, /actionHref="\/trips"/);

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
assert.match(travelRevenueOverview, /Travel Advisor funnel, actions & recorded revenue/);
assert.match(travelRevenueOverview, /Next-action queue/);
assert.match(travelRevenueOverview, /\/api\/travel-advisor\/conversion/);
assert.match(travelRevenueOverview, /TravelAdvisorCommercePanel/);
assert.match(travelRevenuePanel, /Booking & revenue loop/);
assert.match(travelRevenuePanel, /Manage reservation/);
assert.match(travelConversionRoute, /summarizeTravelAdvisorFunnel/);
assert.match(travelConversionRoute, /travelAdvisorConversionStage/);
assert.match(travelConversionRoute, /sourceTravelRequestId/);

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

assert.match(mobilityBooking, /furthestStep/);
assert.match(mobilityBooking, /disabled=\{stepNumber > furthestStep\}/);
assert.match(mobilityBooking, /if \(routeReady\) return/);
assert.doesNotMatch(mobilityBooking, /routeReady \|\| activeStep === 1/);
assert.match(mobilityBooking, /setFurthestStep\(1\)/);
assert.match(mobilityBooking, /\}, \[routeReady\]\);/);
assert.match(mobilityBooking, /advanceToStep\(4\)/);
assert.match(mobilityBooking, /new Intl\.Collator/);
assert.match(mobilityBooking, /numeric: true/);
assert.match(mobilityBooking, /sortedEstates\.map/);
assert.match(mobilityBooking, /a\.geoid\.localeCompare\(b\.geoid\)/);

console.log("VI Guide UI and customer-journey consistency contracts passed.");
