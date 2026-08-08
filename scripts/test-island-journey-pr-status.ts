import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const status = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-status.md"), "utf8");
assert.match(status, /Ready to open/);
assert.match(status, /Not yet merged/);
assert.match(status, /Not yet deployed/);
console.log("VI Guide connected Journey PR-status contracts passed.");
