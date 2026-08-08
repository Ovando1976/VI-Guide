import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const ready = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-ready.md"), "utf8");
assert.match(ready, /Source implementation and source-level contracts are complete/);
assert.match(ready, /open the pull request/);
assert.match(ready, /production checks determine whether code changes are build-safe/);
console.log("VI Guide Island Journey PR-ready-state contracts passed.");
