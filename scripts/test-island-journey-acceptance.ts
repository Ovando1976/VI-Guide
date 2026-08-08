import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const acceptance = readFileSync(resolve(process.cwd(), "docs/island-journey-acceptance.md"), "utf8");
assert.match(acceptance, /open `\/journey`/);
assert.match(acceptance, /hand any ground connection to Mobility/);
assert.match(acceptance, /ask Concierge to coordinate the entire journey/);
assert.match(acceptance, /canonical My Trip/);
assert.match(acceptance, /schedule values are not duplicated/);
console.log("VI Guide Island Journey acceptance contracts passed.");
