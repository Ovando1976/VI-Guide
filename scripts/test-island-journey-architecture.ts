import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const architecture = readFileSync(resolve(process.cwd(), "docs/island-journey-architecture.md"), "utf8");
assert.match(architecture, /governed ferry schedule source/);
assert.match(architecture, /without copying schedule values/);
assert.match(architecture, /canonical traveler workspace remains `\/trips`/);
assert.match(architecture, /Planner\/My Trip distinction/);
console.log("VI Guide Island Journey architecture contracts passed.");
