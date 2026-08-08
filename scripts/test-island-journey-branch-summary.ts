import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const summary = readFileSync(resolve(process.cwd(), "docs/island-journey-branch-summary.md"), "utf8");
assert.match(summary, /codex\/door-to-door-island-journeys/);
assert.match(summary, /first door-to-door inter-island traveler flow/);
console.log("VI Guide connected Journey branch-summary contracts passed.");
