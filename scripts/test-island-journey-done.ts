import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const done = readFileSync(resolve(process.cwd(), "docs/island-journey-definition-of-done.md"), "utf8");
assert.match(done, /PR passes the repository's production checks/);
assert.match(done, /Vercel production deployment is READY/);
assert.match(done, /three initial corridors render as connected leg sequences/);
console.log("VI Guide Island Journey definition-of-done contracts passed.");
