import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const body = readFileSync(resolve(process.cwd(), "docs/island-journey-pr-body-final.md"), "utf8");
assert.match(body, /first three inter-island corridors/);
assert.match(body, /Ground legs hand off to Mobility/);
assert.match(body, /does not duplicate ferry truth or imply live availability/);
assert.match(body, /structured Journey Plan persistence/);
console.log("VI Guide final Island Journey PR-description contracts passed.");
