import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const model = source("lib/door-to-door-journey.ts");
const smartModel = source("lib/smart-island-journey.ts");
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
assert.match(model, /ferry check-in buffer/);

assert.match(smartModel, /planSmartIslandJourney/);
assert.match(smartModel, /departAfter/);
assert.match(smartModel, /arriveBy/);
assert.match(smartModel, /Cyril E\. King Airport/);
assert.match(smartModel, /Henry E\. Rohlsen Airport/);
assert.match(smartModel, /routeOperatesOnDate/);
assert.match(smartModel, /checkInMinutes/);
assert.match(smartModel, /sourceLabel/);
assert.match(smartModel, /mobilityHref/);

assert.match(smartBuilder, /Tell us where\. VI Guide connects the trip\./);
assert.match(smartBuilder, /Leave after/);
assert.match(smartBuilder, /Arrive by/);
assert.match(smartBuilder, /Save to My Trip/);
assert.match(smartBuilder, /createJourneyPlan/);
assert.match(smartBuilder, /upsertJourneyPlan/);
assert.match(smartBuilder, /writeSelectedTravelerTripPlanId/);
assert.match(smartBuilder, /Verify ferry source/);
assert.match(smartBuilder, /America\/St_Thomas/);

assert.match(planner, /One trip\. Ground \+ water \+ arrival\./);
assert.match(planner, /Plan this ride/);
assert.match(planner, /Coordinate with Concierge/);
assert.match(planner, /Add to itinerary/);
assert.match(planner, /href="\/trips"/);

assert.match(journeyPage, /Island Journey/);
assert.match(journeyPage, /SmartIslandJourneyBuilder/);
assert.match(journeyPage, /Quick journey templates/);
assert.match(journeyPage, /DoorToDoorJourneyPlanner/);
assert.match(journeyPage, /secondaryHref="\/trips"/);
assert.match(ferryPage, /Ferry \+ Island Journey Planner/);
assert.match(ferryPage, /DoorToDoorJourneyPlanner/);
assert.match(ferryPage, /FerryPlanner/);

assert.match(homeStatus, /label: "Ferry \+ island journey"/);
assert.match(homeStatus, /value: "Plan taxi \+ ferry as one trip"/);
assert.match(homeStatus, /href: "\/journey"/);
assert.doesNotMatch(homeStatus, /label: "Ferry planning"[\s\S]{0,180}href: "\/mobility"/);

console.log("VI Guide connected and smart Island Journey contracts passed.");