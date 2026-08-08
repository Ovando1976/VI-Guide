import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const story = readFileSync(resolve(process.cwd(), "docs/island-journey-user-story.md"), "utf8");
assert.match(story, /ground transfer, ferry crossing and arrival connection/);
assert.match(story, /without mentally stitching together separate taxi, ferry and trip-planning tools/);
console.log("VI Guide connected journey traveler story contracts passed.");
