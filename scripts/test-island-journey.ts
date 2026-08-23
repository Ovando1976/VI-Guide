import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CAR_BARGE_ROUTES,
  FERRY_ROUTES,
  FERRY_SCHEDULE_SOURCES,
  findFerryRoute,
  getNextFerryDeparture,
  isScheduleSuppressed,
} from "../lib/ferry-planner";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const model = source("lib/door-to-door-journey.ts");
const smartModel = source("lib/smart-island-journey.ts");
const catalog = source("lib/journey-place-catalog.ts");
const mapModel = source("lib/island-journey-map.ts");
const planner = source("components/door-to-door-journey-planner.tsx");
const smartBuilder = source("components/smart-island-journey-builder.tsx");
const journeyMap = source("components/map/saved-island-journey-living-map.tsx");
const tripMapLink = source("components/trips/trip-aware-living-map-link.tsx");
const tripCommandMapLink = source("components/trips/trip-command-map-link.tsx");
const tripCommandCenter = source("components/trips/traveler-trip-command-center.tsx");
const journeyPage = source("app/journey/page.tsx");
const journeyMapPage = source("app/map/journey/page.tsx");
const tripsPage = source("app/trips/page.tsx");
const ferryPage = source("app/ferry/page.tsx");
const ferryPlanner = source("components/ferry-planner.tsx");
const ferryNetworkMap = source("components/ferry-network-map.tsx");
const ferryCanonical = source("lib/ferry-planner.ts");
const ferryGoverned = source("lib/ferry-planner-current.ts");
const homeStatus = source("components/home/home-live-status.tsx");

assert.match(model, /Cyril E\. King Airport → Cruz Bay/);
assert.match(model, /Charlotte Amalie → Cruz Bay/);
assert.match(model, /St\. Thomas → Christiansted/);
assert.match(model, /findFerryRoute/);
assert.match(model, /mode: "taxi"/);
assert.match(model, /mode: "ferry"/);
assert.match(model, /\/mobility\?mode=ferry-transfer/);

assert.match(smartModel, /planSmartIslandJourney/);
assert.match(smartModel, /departAfter/);
assert.match(smartModel, /arriveBy/);
assert.match(smartModel, /FERRY_TERMINAL_COORDS/);
assert.match(smartModel, /ferryPortsForIsland/);
assert.match(smartModel, /routeOperatesOnDate/);
assert.match(smartModel, /checkInMinutes/);
assert.match(smartModel, /sourceLabel/);

assert.match(catalog, /ALL_PUBLIC_TRAVEL_KNOWLEDGE/);
assert.match(catalog, /typeof item\.lat === "number"/);
assert.match(catalog, /typeof item\.lng === "number"/);
assert.match(catalog, /catalog:/);
assert.match(catalog, /sourceHref/);

assert.match(mapModel, /buildIslandJourneyMapStops/);
assert.match(mapModel, /ferry-terminal-departure/);
assert.match(mapModel, /ferry-terminal-arrival/);
assert.match(mapModel, /isIslandJourneyPlan/);
assert.match(mapModel, /mapHrefForJourneyPlan/);
assert.match(mapModel, /\/map\/journey\?trip=/);
assert.match(mapModel, /positionedJourneyStops/);
assert.match(mapModel, /PR #241\/#242 saved the ferry leg/);
assert.match(mapModel, /isFerryWaterSegment/);
assert.match(mapModel, /joinJourneySegments/);

assert.match(smartBuilder, /Choose any mapped USVI Explorer place\./);
assert.match(smartBuilder, /\/api\/route/);
assert.match(smartBuilder, /resolveTerminalTransfers/);
assert.match(smartBuilder, /Calculating the road connections/);
assert.match(smartBuilder, /Leave after/);
assert.match(smartBuilder, /Arrive by/);
assert.match(smartBuilder, /Save to My Trip/);
assert.match(smartBuilder, /buildIslandJourneyMapStops/);
assert.match(smartBuilder, /View on Living Map/);
assert.match(smartBuilder, /\/map\/journey\?trip=/);
assert.match(smartBuilder, /upsertJourneyPlan/);
assert.match(smartBuilder, /writeSelectedTravelerTripPlanId/);
assert.match(smartBuilder, /Verify ferry source/);
assert.match(smartBuilder, /America\/St_Thomas/);

assert.match(journeyMap, /EstateMap/);
assert.match(journeyMap, /readJourneyPlans/);
assert.match(journeyMap, /positionedJourneyStops/);
assert.match(journeyMap, /isFerryWaterSegment/);
assert.match(journeyMap, /directJourneySegment/);
assert.match(journeyMap, /joinJourneySegments/);
assert.match(journeyMap, /fetch\("\/api\/route"/);
assert.match(journeyMap, /Complete taxi \+ ferry \+ taxi journey is mapped\./);
assert.match(journeyMap, /Route partly estimated/);

assert.match(tripMapLink, /readSelectedTravelerTripPlanId/);
assert.match(tripMapLink, /TRAVELER_TRIP_SELECTION_UPDATED_EVENT/);
assert.match(tripMapLink, /mapHrefForJourneyPlan/);
assert.match(tripMapLink, /Open journey map/);
assert.match(tripMapLink, /Open Living Map/);
assert.match(tripsPage, /TripAwareLivingMapLink/);

assert.match(tripCommandMapLink, /mapHrefForJourneyPlan/);
assert.match(tripCommandMapLink, /Open journey map/);
assert.match(tripCommandMapLink, /Journey Map/);
assert.match(tripCommandCenter, /const selectedPlan = useMemo/);
assert.equal((tripCommandCenter.match(/<TripCommandMapLink/g) ?? []).length, 2);
assert.doesNotMatch(tripCommandCenter, /<QuickLink href="\/map"/);
assert.doesNotMatch(tripCommandCenter, /<ToolLink href="\/map"/);

assert.match(planner, /One trip\. Ground \+ water \+ arrival\./);
assert.match(planner, /Plan this ride/);
assert.match(planner, /Coordinate with Concierge/);
assert.match(planner, /Add to itinerary/);
assert.match(planner, /href="\/trips"/);

assert.match(journeyPage, /getJourneyCatalogPlaces/);
assert.match(journeyPage, /catalogPlaces=\{catalogPlaces\}/);
assert.match(journeyPage, /Quick journey templates/);
assert.match(journeyPage, /DoorToDoorJourneyPlanner/);
assert.match(journeyPage, /secondaryHref="\/trips"/);
assert.match(journeyMapPage, /SavedIslandJourneyLivingMap/);
assert.match(journeyMapPage, /Living Map/);
assert.match(journeyMapPage, /Taxi · Ferry · Taxi/);
assert.match(ferryPage, /Next boat\. True fare\. Full island journey\./);
assert.match(ferryPage, /Ferry command center/);
assert.match(ferryPage, /id="ferry-intelligence"/);
assert.match(ferryPage, /id="door-to-door"/);
assert.match(ferryPage, /Ask VI Concierge/);
assert.match(ferryPage, /DoorToDoorJourneyPlanner/);
assert.match(ferryPage, /FerryPlanner/);
assert.match(ferryPlanner, /FerryNetworkMap/);
assert.match(ferryPlanner, /USVI Explorer shows the published planning schedule/);
assert.match(ferryNetworkMap, /MapContainer/);
assert.match(ferryNetworkMap, /FERRY_PORT_COORDINATES/);
assert.match(ferryNetworkMap, /Tap a route line/);
assert.match(ferryNetworkMap, /Orange = passport route/);

assert.match(ferryCanonical, /ferry-planner-current/);
assert.match(ferryGoverned, /ferry-planner-base/);
assert.match(ferryGoverned, /temporary-override/);
assert.match(ferryGoverned, /operator-dependent/);
assert.match(ferryGoverned, /2026-10-31/);

assert.ok(FERRY_ROUTES.length >= 20, "Passenger ferry route coverage unexpectedly shrank");
assert.equal(CAR_BARGE_ROUTES.length, 2, "St. Thomas–St. John car-barge directions must remain covered");
assert.ok(FERRY_SCHEDULE_SOURCES.length >= 3, "Ferry governance needs VIPA, Water Island, and BVI schedule sources");
for (const scheduleSource of FERRY_SCHEDULE_SOURCES) {
  assert.match(scheduleSource.url, /^https:\/\//, `${scheduleSource.id} needs an HTTPS source`);
  assert.match(scheduleSource.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${scheduleSource.id} needs verifiedAt`);
}

const redHookToCruzBay = findFerryRoute("red-hook", "cruz-bay");
assert.ok(redHookToCruzBay, "Red Hook → Cruz Bay must remain covered");
assert.equal(redHookToCruzBay.durationMinutes, 15, "VIPA currently describes Red Hook → Cruz Bay as approximately 15 minutes");
assert.equal(redHookToCruzBay.scheduleStatus, "temporary-override");
assert.equal(redHookToCruzBay.departures.length, 0, "Regular Red Hook timetable must be suppressed while the temporary VIPA schedule is active");
assert.ok(redHookToCruzBay.scheduleNotice?.includes("July 26 through October 31, 2026"));
const activeOffSeason = new Date("2026-08-23T16:00:00Z");
assert.equal(isScheduleSuppressed(redHookToCruzBay, activeOffSeason), true);
assert.equal(getNextFerryDeparture(redHookToCruzBay, activeOffSeason), null, "Temporary schedule must fail closed instead of guessing a next ferry");

const crownToCruz = findFerryRoute("crown-bay", "cruz-bay");
assert.ok(crownToCruz, "Crown Bay → Cruz Bay must remain covered");
assert.deepEqual(crownToCruz.weekdayDepartures, ["3:30 PM", "5:30 PM"]);
assert.deepEqual(crownToCruz.saturdayDepartures, ["2:15 PM", "3:30 PM", "5:30 PM"]);
assert.deepEqual(crownToCruz.sundayDepartures, ["2:15 PM", "3:30 PM", "5:30 PM"]);
assert.ok(crownToCruz.operatorPhones?.includes("(340) 201-6311"));
assert.doesNotMatch(crownToCruz.operatingDays, /Friday/);
assert.ok(!(crownToCruz.goodToKnow ?? []).some((note) => /9:45 AM|Friday/i.test(note)));

const cruzToCrown = findFerryRoute("cruz-bay", "crown-bay");
assert.ok(cruzToCrown, "Cruz Bay → Crown Bay must remain covered");
assert.deepEqual(cruzToCrown.weekdayDepartures, ["11:00 AM", "4:15 PM"]);
assert.deepEqual(cruzToCrown.saturdayDepartures, ["11:00 AM", "1:15 PM", "4:15 PM"]);
assert.deepEqual(cruzToCrown.sundayDepartures, ["11:00 AM", "1:15 PM", "4:15 PM"]);
assert.ok(!(cruzToCrown.goodToKnow ?? []).some((note) => /8:30 AM|Friday/i.test(note)));

const redHookToRoadTown = findFerryRoute("red-hook", "road-town");
assert.ok(redHookToRoadTown, "Red Hook → Road Town must remain covered");
assert.deepEqual(redHookToRoadTown.departures, ["5:45 PM"]);
assert.equal(redHookToRoadTown.operatingDays, "Daily; stops at West End, Tortola");
assert.equal(redHookToRoadTown.scheduleStatus, "verify-current");

const roadTownToRedHook = findFerryRoute("road-town", "red-hook");
assert.ok(roadTownToRedHook, "Road Town → Red Hook must remain covered");
assert.deepEqual(roadTownToRedHook.departures, ["6:45 AM"]);

const redHookToWestEnd = findFerryRoute("red-hook", "west-end");
assert.ok(redHookToWestEnd, "Red Hook → West End must remain covered");
assert.deepEqual(redHookToWestEnd.departures, ["8:30 AM", "1:45 PM", "5:45 PM"]);

const westEndToRedHook = findFerryRoute("west-end", "red-hook");
assert.ok(westEndToRedHook, "West End → Red Hook must remain covered");
assert.deepEqual(westEndToRedHook.departures, ["7:15 AM", "10:00 AM", "4:00 PM"]);

const waterIsland = findFerryRoute("crown-bay", "phillips-landing");
assert.ok(waterIsland, "Crown Bay → Water Island must remain covered");
assert.equal(waterIsland.fare?.adultOneWay, 10);
assert.equal(waterIsland.fare?.adultRoundTrip, 20);
assert.equal(waterIsland.fare?.bagOneWay, 2);
assert.equal(waterIsland.sourceAuthority, "Water Island Ferry");

for (const barge of CAR_BARGE_ROUTES) {
  assert.equal(barge.scheduleStatus, "operator-dependent");
  assert.equal(barge.departures.length, 0, `${barge.id} must not collapse three operators into a fake next-barge timetable`);
  assert.equal(isScheduleSuppressed(barge, activeOffSeason), true);
  assert.equal(getNextFerryDeparture(barge, activeOffSeason), null);
  assert.equal(barge.sourceAuthority, "Virgin Islands Port Authority");
  assert.ok((barge.goodToKnow ?? []).some((note) => /(not interchangeable|cannot be used on another operator)/i.test(note)));
}

for (const route of [...FERRY_ROUTES, ...CAR_BARGE_ROUTES]) {
  assert.match(route.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${route.id} needs verifiedAt`);
  assert.match(route.sourceUrl, /^https:\/\//, `${route.id} needs a verification URL`);
  assert.ok(route.sourceAuthority.trim(), `${route.id} needs a source authority`);
}
assert.equal(new Set(FERRY_ROUTES.map((route) => route.id)).size, FERRY_ROUTES.length, "Passenger ferry route IDs must be unique");
assert.equal(new Set(CAR_BARGE_ROUTES.map((route) => route.id)).size, CAR_BARGE_ROUTES.length, "Car-barge route IDs must be unique");

assert.match(homeStatus, /label: "Ferry \+ island journey"/);
assert.match(homeStatus, /value: "Plan taxi \+ ferry as one trip"/);
assert.match(homeStatus, /href: "\/journey"/);

console.log(
  `USVI Explorer connected, current-source-governed Ferry + Living Map Island Journey contracts passed for ${FERRY_ROUTES.length} passenger routes and ${CAR_BARGE_ROUTES.length} car-barge directions.`,
);
