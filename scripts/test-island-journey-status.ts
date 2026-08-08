import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const status = readFileSync(resolve(process.cwd(), "docs/island-journey-status.md"), "utf8");
assert.match(status, /Dedicated `\/journey` traveler route/);
assert.match(status, /Three initial governed corridors/);
assert.match(status, /Not yet claimed/);
assert.match(status, /Live ferry availability/);
assert.match(status, /Persisting generated multimodal legs directly into Journey Plan storage/);
console.log("VI Guide Island Journey status boundary contracts passed.");
