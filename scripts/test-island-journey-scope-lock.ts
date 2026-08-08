import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const scope = readFileSync(resolve(process.cwd(), "docs/island-journey-release-scope.md"), "utf8");
assert.match(scope, /remain focused on the connected Island Journey slice/);
assert.match(scope, /next iteration after this slice passes production/);
console.log("VI Guide Island Journey release-scope contracts passed.");
