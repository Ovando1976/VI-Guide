import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const ci = readFileSync(resolve(process.cwd(), "docs/island-journey-ci.md"), "utf8");
assert.match(ci, /Opening the pull request is the trigger/);
assert.match(ci, /Do not merge solely from source inspection/);
console.log("VI Guide Island Journey CI discipline contracts passed.");
