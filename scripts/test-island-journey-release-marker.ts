import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const marker = readFileSync(resolve(process.cwd(), "docs/island-journey-release-marker.md"), "utf8");
assert.match(marker, /codex\/door-to-door-island-journeys/);
assert.match(marker, /merge and production deployment remain pending/);
console.log("VI Guide connected Journey release-marker contracts passed.");
