import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const planner = readFileSync(
  resolve(process.cwd(), "components/journey/journey-planner.tsx"),
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

console.log("VI Guide Journey Planner visual synchronization contracts passed.");
