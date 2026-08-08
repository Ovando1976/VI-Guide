import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const check = readFileSync(resolve(process.cwd(), "docs/island-journey-release-check.md"), "utf8");
assert.match(check, /ready for pull-request CI/);
assert.match(check, /does not claim CI\/build success until GitHub\/Vercel executes/);
console.log("VI Guide connected journey release-check contracts passed.");
