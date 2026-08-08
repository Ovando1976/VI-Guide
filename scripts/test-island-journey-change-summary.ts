import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const summary = readFileSync(resolve(process.cwd(), "docs/island-journey-change-summary.md"), "utf8");
assert.match(summary, /avoids broad unrelated UI changes/);
assert.match(summary, /Mobility, Ferry, Concierge, Planner and My Trip as one flow/);
console.log("VI Guide focused Island Journey change contracts passed.");
