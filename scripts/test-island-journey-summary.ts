import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const summary = readFileSync(resolve(process.cwd(), "docs/island-journey-summary.md"), "utf8");
for (const phrase of ["Ferry Planner owns published ferry truth", "Island Journey owns the sequence", "Mobility owns ground-transfer execution", "Concierge owns coordination", "Planner owns itinerary editing", "My Trip owns the saved traveler command center"]) assert.ok(summary.includes(phrase), `Missing ownership boundary: ${phrase}`);
console.log("VI Guide connected Island Journey ownership contracts passed.");
