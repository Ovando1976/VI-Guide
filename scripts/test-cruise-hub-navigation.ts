import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const cruiseHub = source("app/cruises/page.tsx");
const cruiseNav = source("components/cruise/cruise-hub-nav.tsx");
const activeCruise = source("components/cruise/cruise-active-trip-card.tsx");
const sailingTripAction = source("components/cruise/cruise-sailing-trip-action.tsx");
const shoreExcursions = source("app/shore-excursions/page.tsx");

for (const [value, label] of [
  ["ViPublicHeader", "Cruise Hub keeps shared USVI Explorer chrome"],
  ["USVI Explorer Cruise Hub", "Cruise Hub keeps its traveler-facing identity"],
  ["<CruiseHubNav />", "Cruise Hub keeps cruise section navigation"],
  ["<CruiseActiveTripCard />", "Cruise Hub keeps the selected sailing visible"],
  ["<CruiseInventoryGateway />", "Cruise Hub keeps sailing inventory"],
  ['href="/cruises/port-calls"', "Cruise Hub keeps official port-call access"],
  ['href="/shore-excursions"', "Cruise Hub keeps shore-excursion access"],
  ['href="/cruises/plan"', "Cruise Hub keeps advisor planning access"],
  ['href="/bookings"', "Cruise Hub keeps My Bookings access"],
  ["Ask Concierge", "Cruise Hub keeps the AI Concierge handoff"],
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

for (const [value, label] of [
  ['href: "/trips"', "Cruise nav exposes canonical My Trip"],
  ['label: "My Trip"', "Cruise nav labels the canonical traveler workspace"],
  ['href: "/bookings"', "Cruise nav keeps My Bookings"],
] as const) {
  assert.ok(cruiseNav.includes(value), `Cruise nav contract failed: ${label}`);
}

for (const [value, label] of [
  ["Selected cruise", "Selected cruise card keeps the traveler in context"],
  ["readSelectedCruiseTrip", "Selected cruise card reads canonical sailing state"],
  ["CRUISE_TRIP_UPDATED_EVENT", "Selected cruise card reacts immediately to sailing selection"],
  ["buildShoreExcursionHref", "Selected cruise card preserves cruise context into the first port day"],
  ['href="/trips"', "Selected cruise card routes My Trip canonically"],
  ["Ask Concierge", "Selected cruise card keeps AI planning available"],
  ["Ship-clock protection", "Selected cruise card keeps the onboard all-aboard warning visible"],
] as const) {
  assert.ok(activeCruise.includes(value), `Selected cruise contract failed: ${label}`);
}
assert.doesNotMatch(
  activeCruise,
  /href="\/planner"/,
  "Selected cruise card must never route My Trip to the legacy planner path",
);

assert.match(
  sailingTripAction,
  /href="\/trips"/,
  "Selecting a sailing must hand off to canonical My Trip",
);
assert.match(
  sailingTripAction,
  /My Trip/,
  "Selecting a sailing must keep the My Trip continuation visible",
);
assert.doesNotMatch(
  sailingTripAction,
  /href="\/planner"/,
  "Selecting a sailing must not route My Trip to the legacy planner path",
);

for (const [value, label] of [
  ["<CruiseHubNav compact />", "Shore Excursions keeps Cruise Hub navigation"],
  ["Selected sailing context", "Shore Excursions keeps sailing-context guidance"],
  ["Official port-call match", "Shore Excursions keeps official port-call context"],
  ["resolveOfficialPortCallContext", "Shore Excursions keeps official call resolution"],
  ["loadOfficialPortCallMatches", "Shore Excursions keeps capacity-aware matching"],
  ["Return buffer checked before request", "Shore Excursions keeps protected return guidance"],
  ['href="/trips"', "Shore Excursion My Trip actions use the canonical traveler workspace"],
] as const) {
  assert.ok(
    shoreExcursions.includes(value),
    `Shore Excursion navigation contract failed: ${label}`,
  );
}

assert.equal(
  [...shoreExcursions.matchAll(/href="\/trips"[\s\S]{0,240}Open My Trip/g)].length,
  2,
  "Shore Excursion navigation contract failed: both My Trip handoffs must resolve to /trips",
);
assert.doesNotMatch(
  shoreExcursions,
  /href="\/planner"[\s\S]{0,240}Open My Trip/,
  "Shore Excursion navigation contract failed: My Trip must not route directly to Journey Planner",
);

console.log("USVI Explorer Cruise Hub and Shore Excursion navigation contracts passed.");
