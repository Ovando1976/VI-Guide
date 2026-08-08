import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const legacyWorkspace = source("app/workspace/page.tsx");
const tripsPage = source("app/trips/page.tsx");

assert.match(legacyWorkspace, /redirect\("\/trips"\)/);
assert.doesNotMatch(legacyWorkspace, /ReservationEnabledWorkspace/);
assert.doesNotMatch(legacyWorkspace, /Traveler Workspace/);

assert.match(tripsPage, /title: "My Trip \| VI Guide"/);
assert.match(tripsPage, /TravelerTripCommandCenter/);
assert.match(tripsPage, /TravelerTripReadinessPanel/);
assert.match(tripsPage, /RiderLiveDriverMap/);
assert.match(tripsPage, /Open Planner/);
assert.match(tripsPage, /Open Living Map/);
assert.match(tripsPage, /Ask Concierge/);

console.log("VI Guide canonical My Trip workspace contracts passed.");
