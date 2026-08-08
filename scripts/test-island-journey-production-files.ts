import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const focus = readFileSync(resolve(process.cwd(), "docs/island-journey-production-files.md"), "utf8");
assert.match(focus, /five production files/);
assert.match(focus, /lib\/door-to-door-journey\.ts/);
assert.match(focus, /components\/door-to-door-journey-planner\.tsx/);
assert.match(focus, /app\/ferry\/page\.tsx/);
console.log("VI Guide connected Journey production-diff contracts passed.");
