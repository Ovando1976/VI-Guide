import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const planner = readFileSync(
  resolve(process.cwd(), "components/journey/journey-planner.tsx"),
  "utf8",
);
const routeSummary = readFileSync(
  resolve(process.cwd(), "components/journey/journey-route-summary.tsx"),
  "utf8",
);
const routeDashboard = readFileSync(
  resolve(process.cwd(), "components/journey/journey-route-dashboard.tsx"),
  "utf8",
);

assert.match(planner, /JOURNEY_VISUALS/);
assert.match(planner, /usvi-harbor-hero\.jpg/);
assert.match(planner, /trunk-bay-overlook-1\.jpg/);
assert.match(planner, /cane-bay-beach-1\.jpg/);
assert.match(planner, /VI Guide · Journey Planner/);
assert.match(planner, /Keep the whole trip connected\./);
assert.match(planner, /Active journey/);
assert.match(planner, /Open Living Map/);
assert.match(planner, /Trip command/);
assert.match(planner, /Your island day/);
assert.doesNotMatch(planner, /linear-gradient\(145deg/);

assert.match(routeSummary, /Movement line/);
assert.match(routeSummary, /Transportation between every stop\./);
assert.match(routeSummary, /Open Living Map/);
assert.match(routeSummary, /Plan this ride/);
assert.match(routeSummary, /fetch\("\/api\/route"/);
assert.match(routeSummary, /return `\/mobility\?\$\{params\.toString\(\)\}`/);
assert.match(routeSummary, /buildJourneyMapHref\(plan\)/);
assert.match(routeDashboard, /lg:pl-\[330px\]/);

console.log("VI Guide Journey Planner visual synchronization contracts passed.");
