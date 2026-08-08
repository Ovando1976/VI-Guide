import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const marker = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-submit-now.md"), "utf8");
assert.match(marker, /Feature branch source is ready/);
assert.match(marker, /Create the PR/);
console.log("VI Guide connected Journey PR-submit marker contracts passed.");
