import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const release = readFileSync(resolve(process.cwd(), "docs/island-journey-release.md"), "utf8");
assert.match(release, /No second trip store or duplicate ferry schedule/);
assert.match(release, /Airport → Red Hook → Cruz Bay/);
assert.match(release, /Gallows Bay → Christiansted/);
assert.match(release, /Context-preserving Mobility handoffs/);
console.log("VI Guide Island Journey release scope contracts passed.");
