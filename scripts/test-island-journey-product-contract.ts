import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contract = readFileSync(resolve(process.cwd(), "docs/island-journey-product-contract.md"), "utf8");
assert.match(contract, /one VI Guide journey/);
assert.match(contract, /governed Ferry Planner/);
assert.match(contract, /VI Guide Mobility with context/);
assert.match(contract, /VI Concierge with context/);
assert.match(contract, /canonical saved traveler command center remains My Trip/);
assert.match(contract, /without implying real-time ferry availability/);
console.log("VI Guide Island Journey product contracts passed.");
