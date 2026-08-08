import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const ready = readFileSync(resolve(process.cwd(), "docs/island-journey-ready.md"), "utf8");
assert.match(ready, /ready to enter the pull-request production gate/);
console.log("VI Guide connected Journey branch-ready contract passed.");
