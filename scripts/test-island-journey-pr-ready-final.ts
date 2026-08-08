import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const ready = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-ready-final.md"), "utf8");
assert.match(ready, /Create the pull request against `main`/);
assert.match(ready, /inspect the resulting checks before any merge action/);
console.log("VI Guide final connected Journey PR-ready contracts passed.");
