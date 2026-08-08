import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const state = readFileSync(resolve(process.cwd(), "docs/island-journey-final-state.md"), "utf8");
assert.match(state, /Functional source work is complete/);
assert.match(state, /next truthful state transition is PR creation/);
assert.match(state, /no production claim should be made/);
console.log("VI Guide connected Journey pre-PR truth contracts passed.");
