import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const check = readFileSync(resolve(process.cwd(), "docs/island-journey-last-check.md"), "utf8");
assert.match(check, /No production merge has occurred/);
assert.match(check, /Open the PR and use its checks as the next decision point/);
console.log("VI Guide connected Journey last pre-PR contracts passed.");
