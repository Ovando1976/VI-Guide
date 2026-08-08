import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const next = readFileSync(resolve(process.cwd(), "docs/island-journey-next.md"), "utf8");
assert.match(next, /arbitrary VI Guide place\/address/);
assert.match(next, /depart-by or arrive-by time/);
assert.match(next, /terminal check-in buffer/);
assert.match(next, /existing Journey Plan and cloud-sync path/);
assert.match(next, /Living Map and My Day/);
console.log("VI Guide connected journey evolution contracts passed.");
