import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const model = source("lib/door-to-door-journey.ts");
const smartModel = source("lib/smart-island-journey.ts");
const catalog = source("lib/journey-place-catalog.ts");
const planner = source("components/door-to-door-journey-planner.tsx");
const smartBuilder = source("components/smart-island-journey-builder.tsx");
const journeyPage = source("app/journey/page.tsx");
const ferryPage = source("app/ferry/page.tsx");
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

assert.match(smartBuilder, /Choose any mapped VI Guide place\./);
assert.match(smartBuilder, /\/api\/route/);
assert.match(smartBuilder, /resolveTerminalTransfers/);
assert.match(smartBuilder, /Calculating the road connections/);
assert.match(smartBuilder, /Leave after/);
assert.match(smartBuilder, /Arrive by/);
assert.match(smartBuilder, /Save to My Trip/);
assert.match(smartBuilder, /upsertJourneyPlan/);
assert.match(smartBuilder, /writeSelectedTravelerTripPlanId/);
assert.match(smartBuilder, /Verify ferry source/);
assert.match(smartBuilder, /America\/St_Thomas/);

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
assert.match(ferryPage, /Ferry \+ Island Journey Planner/);
assert.match(ferryPage, /DoorToDoorJourneyPlanner/);
assert.match(ferryPage, /FerryPlanner/);

assert.match(homeStatus, /label: "Ferry \+ island journey"/);
assert.match(homeStatus, /value: "Plan taxi \+ ferry as one trip"/);
assert.match(homeStatus, /href: "\/journey"/);

console.log("VI Guide connected, smart, catalog-routed Island Journey contracts passed.");