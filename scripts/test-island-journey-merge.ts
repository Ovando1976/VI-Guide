import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const merge = readFileSync(resolve(process.cwd(), "docs/island-journey-merge.md"), "utf8");
assert.match(merge, /production gate confirms the branch compiles and builds/);
assert.match(merge, /Vercel production deployment reaches READY/);
console.log("VI Guide connected journey merge criteria contracts passed.");
