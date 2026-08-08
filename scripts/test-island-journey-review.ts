import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const review = readFileSync(resolve(process.cwd(), "docs/island-journey-review.md"), "utf8");
assert.match(review, /traveler clarity/);
assert.match(review, /mobile leg sequencing/);
assert.match(review, /query-string compatibility/);
assert.match(review, /must not imply.*live availability/);
console.log("VI Guide connected journey review contracts passed.");
