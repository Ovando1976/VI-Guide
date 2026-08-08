import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const title = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-title.txt"), "utf8").trim();
assert.equal(title, "Turn ferry travel into a connected Island Journey");
console.log("VI Guide Island Journey PR-title contracts passed.");
