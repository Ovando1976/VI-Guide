import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const home = source("app/page.tsx");
const tripPlanning = source("app/trip-planning/page.tsx");
const cruiseHub = source("app/cruises/page.tsx");
const planner = source("app/planner/page.tsx");
const directory = source("components/directory/discovery-directory-page.tsx");
const mobility = source("components/mobility-booking-screen.tsx");
const travelDesk = source("components/admin/travel-request-board.tsx");
const cruiseDesk = source("components/admin/cruise-request-board.tsx");
const adminNav = source("components/admin-nav.tsx");
const globals = source("app/globals.css");

for (const [name, contents] of [
  ["home", home],
  ["trip planning", tripPlanning],
  ["cruise hub", cruiseHub],
  ["journey planner", planner],
  ["directory surfaces", directory],
  ["mobility", mobility],
] as const) {
  assert.match(contents, /ViPublicHeader/, `${name} must use ViPublicHeader`);
}

for (const [name, contents] of [
  ["travel advisor desk", travelDesk],
  ["cruise advisor desk", cruiseDesk],
] as const) {
  assert.match(contents, /AdminShell/, `${name} must use AdminShell`);
  assert.match(contents, /OpsMetric/, `${name} must use shared OpsMetric`);
  assert.match(contents, /OpsSection/, `${name} must use shared OpsSection`);
  assert.match(contents, /OpsPill/, `${name} must use shared OpsPill`);
}

assert.match(adminNav, /\/admin\/travel-requests/);
assert.match(adminNav, /\/admin\/cruise-requests/);

for (const token of [
  "--vi-ink",
  "--vi-teal",
  "--vi-gold",
  "--vi-canvas",
  "--vi-surface",
  "--vi-line",
]) {
  assert.ok(globals.includes(token), `Missing shared UI token ${token}`);
}

console.log("VI Guide UI consistency contracts passed.");
