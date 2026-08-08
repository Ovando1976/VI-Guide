import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const launch = readFileSync(resolve(process.cwd(), "docs/island-journey-launch.md"), "utf8");
assert.match(launch, /Open the PR now/);
assert.match(launch, /production checks as the decision gate before merge/);
console.log("VI Guide connected Journey launch-note contracts passed.");
