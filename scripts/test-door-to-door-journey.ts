import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const model = source("lib/door-to-door-journey.ts");
const component = source("components/door-to-door-journey-planner.tsx");
const ferryPage = source("app/ferry/page.tsx");

assert.match(model, /airport-cruz-bay/);
assert.match(model, /Cyril E\. King Airport/);
assert.match(model, /charlotte-cruz-bay/);
assert.match(model, /stt-christiansted/);
assert.match(model, /findFerryRoute/);
assert.match(model, /checkInMinutes/);
assert.match(model, /mode: "taxi"/);
assert.match(model, /mode: "ferry"/);
assert.match(model, /\/mobility\?mode=ferry-transfer/);
assert.match(model, /Coordinate the ground transfers, ferry check-in buffer/);

assert.match(component, /One trip\. Ground \+ water \+ arrival\./);
assert.match(component, /Plan this ride/);
assert.match(component, /Coordinate with Concierge/);
assert.match(component, /Add to itinerary/);
assert.match(component, /Open My Trip/);
assert.match(component, /href="\/trips"/);

assert.match(ferryPage, /DoorToDoorJourneyPlanner/);
assert.match(ferryPage, /Ferry \+ Island Journey Planner/);
assert.match(ferryPage, /complete movement line/);

console.log("VI Guide door-to-door island journey contracts passed.");
