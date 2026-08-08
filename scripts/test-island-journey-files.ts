import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const files = readFileSync(resolve(process.cwd(), "docs/island-journey-files.md"), "utf8");
for (const path of ["lib/door-to-door-journey.ts", "components/door-to-door-journey-planner.tsx", "app/journey/page.tsx", "app/journey/layout.tsx", "app/ferry/page.tsx"]) assert.ok(files.includes(path), `Missing production file inventory: ${path}`);
console.log("VI Guide connected journey production file contracts passed.");
