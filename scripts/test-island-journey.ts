import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

assert.match(smartBuilder, /Choose any mapped VI Guide place\./);
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
assert.match(ferryPlanner, /USVI Compass shows the published planning schedule/);
assert.match(ferryNetworkMap, /MapContainer/);
assert.match(ferryNetworkMap, /FERRY_PORT_COORDINATES/);
assert.match(ferryNetworkMap, /Tap a route line/);
assert.match(ferryNetworkMap, /Orange = passport route/);

assert.match(homeStatus, /label: "Ferry \+ island journey"/);
assert.match(homeStatus, /value: "Plan taxi \+ ferry as one trip"/);
assert.match(homeStatus, /href: "\/journey"/);

console.log(
  "VI Guide connected, smart, catalog-routed, Living Map Island Journey contracts passed.",
);
