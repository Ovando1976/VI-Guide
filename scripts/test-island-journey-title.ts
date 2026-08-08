import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const title = readFileSync(resolve(process.cwd(), "docs/island-journey-release-title.md"), "utf8");
assert.match(title, /connected Island Journey/);
console.log("VI Guide connected journey release title contract passed.");
