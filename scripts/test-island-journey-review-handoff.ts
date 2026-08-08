import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const handoff = readFileSync(resolve(process.cwd(), "docs/island-journey-ready-to-review.md"), "utf8");
assert.match(handoff, /ready for automated production checks and code review/);
assert.match(handoff, /Review the actual production files first/);
console.log("VI Guide Island Journey review-handoff contracts passed.");
