import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const model = source("lib/door-to-door-journey.ts");
const planner = source("components/door-to-door-journey-planner.tsx");
const journeyPage = source("app/journey/page.tsx");
const ferryPage = source("app/ferry/page.tsx");

assert.match(model, /Cyril E\. King Airport → Cruz Bay/);
assert.match(model, /Charlotte Amalie → Cruz Bay/);
assert.match(model, /St\. Thomas → Christiansted/);
assert.match(model, /findFerryRoute/);
assert.match(model, /mode: "taxi"/);
assert.match(model, /mode: "ferry"/);
assert.match(model, /\/mobility\?mode=ferry-transfer/);
assert.match(model, /ferry check-in buffer/);

assert.match(planner, /One trip\. Ground \+ water \+ arrival\./);
assert.match(planner, /Plan this ride/);
assert.match(planner, /Coordinate with Concierge/);
assert.match(planner, /Add to itinerary/);
assert.match(planner, /href="\/trips"/);

assert.match(journeyPage, /Island Journey/);
assert.match(journeyPage, /DoorToDoorJourneyPlanner/);
assert.match(journeyPage, /secondaryHref="\/trips"/);
assert.match(ferryPage, /Ferry \+ Island Journey Planner/);
assert.match(ferryPage, /DoorToDoorJourneyPlanner/);
assert.match(ferryPage, /FerryPlanner/);

console.log("VI Guide connected Island Journey contracts passed.");
