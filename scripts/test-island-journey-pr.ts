import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const notes = readFileSync(resolve(process.cwd(), "docs/island-journey-pr.md"), "utf8");
assert.match(notes, /door-to-door sequence/);
assert.match(notes, /\/journey/);
assert.match(notes, /Mobility, Concierge, Planner and My Trip/);
assert.match(notes, /without claiming real-time ferry availability/);
assert.match(notes, /schedule source of truth/);
console.log("VI Guide Island Journey PR scope contracts passed.");
