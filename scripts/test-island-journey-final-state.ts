import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const state = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-final-state.md"), "utf8");
assert.match(state, /Ready for pull request/);
assert.match(state, /CI status unknown until the PR is opened/);
console.log("VI Guide final connected Journey branch-state contracts passed.");
