import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const qa = readFileSync(resolve(process.cwd(), "docs/island-journey-qa.md"), "utf8");
assert.match(qa, /mobile and desktop/);
assert.match(qa, /taxi then ferry/);
assert.match(qa, /direct ferry leg/);
assert.match(qa, /ferry then arrival taxi/);
assert.match(qa, /canonical `\/trips`/);
assert.match(qa, /official schedule verification links/);
console.log("VI Guide Island Journey QA contracts passed.");
