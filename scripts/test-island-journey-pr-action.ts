import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const action = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-open.md"), "utf8");
assert.match(action, /against `main`/);
assert.match(action, /Turn ferry travel into a connected Island Journey/);
assert.match(action, /island-journey-pr-body-final\.md/);
console.log("VI Guide connected Journey PR-action contracts passed.");
