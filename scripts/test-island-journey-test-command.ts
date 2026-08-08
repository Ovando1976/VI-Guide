import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const command = readFileSync(resolve(process.cwd(), "docs/island-journey-test-command.md"), "utf8");
assert.match(command, /npx tsx scripts\/test-island-journey-ship-gate\.ts/);
assert.match(command, /production gate remains authoritative/);
console.log("VI Guide Island Journey test-command contract passed.");
