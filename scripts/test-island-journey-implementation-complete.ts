import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const state = readFileSync(resolve(process.cwd(), "docs/island-journey-implementation-complete.md"), "utf8");
assert.match(state, /implementation phase.*complete/);
assert.match(state, /Validation and merge.*pull-request production gate/);
console.log("VI Guide connected Journey implementation-state contracts passed.");
