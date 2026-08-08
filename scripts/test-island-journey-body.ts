import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const body = readFileSync(resolve(process.cwd(), "docs/island-journey-release-body.md"), "utf8");
assert.match(body, /Airport → Red Hook → Cruz Bay/);
assert.match(body, /preserve context into Mobility/);
assert.match(body, /does not claim live ferry availability/);
assert.match(body, /arbitrary origin\/destination and time-aware routing next/);
console.log("VI Guide connected journey PR narrative contracts passed.");
