import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const cruiseHub = readFileSync(
  resolve(process.cwd(), "app/cruises/page.tsx"),
  "utf8",
);

for (const [value, label] of [
  ["ViPublicHeader", "Cruise Hub keeps shared VI Guide chrome"],
  ["VI Guide Cruise Hub", "Cruise Hub keeps its traveler-facing identity"],
  ["<CruiseHubNav />", "Cruise Hub keeps cruise section navigation"],
  ["<CruiseInventoryGateway />", "Cruise Hub keeps sailing inventory"],
  ['href="/cruises/port-calls"', "Cruise Hub keeps official port-call access"],
  ['href="/shore-excursions"', "Cruise Hub keeps shore-excursion access"],
  ['href="/cruises/plan"', "Cruise Hub keeps advisor planning access"],
  ['href="/bookings"', "Cruise Hub keeps My Bookings access"],
  ["The connected journey", "Cruise Hub keeps the connected-journey handoff"],
  ['href="/trips"', "Open My Trip uses the canonical traveler workspace"],
  ["Open My Trip", "Cruise Hub keeps the My Trip continuation"],
] as const) {
  assert.ok(
    cruiseHub.includes(value),
    `Cruise Hub navigation contract failed: ${label}`,
  );
}

assert.doesNotMatch(
  cruiseHub,
  /href="\/planner"[\s\S]{0,240}Open My Trip/,
  "Cruise Hub navigation contract failed: Open My Trip must not route directly to Journey Planner",
);

console.log("VI Guide Cruise Hub navigation contract passed.");
