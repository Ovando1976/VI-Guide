import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const layout = readFileSync(resolve(process.cwd(), "app/journey/layout.tsx"), "utf8");
assert.match(layout, /Island Journey \| VI Guide/);
assert.match(layout, /connected taxi and ferry journeys/);
console.log("VI Guide connected journey metadata contracts passed.");
