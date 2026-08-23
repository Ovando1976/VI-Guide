import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { USVI_EVENTS } from "../lib/events";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const eventsData = source("lib/events.ts");
const eventsPage = source("app/events/page.tsx");
const eventDetail = source("app/events/[slug]/page.tsx");
const searchPage = source("app/search/page.tsx");
const homeLiveStatus = source("components/home/home-live-status.tsx");

for (const [value, label] of [
  ["USVI_EVENTS", "Events has a typed source-backed catalog"],
  ["verifiedAt", "event records keep verification dates"],
  ["sourceUrl", "event records keep official source URLs"],
  ["st-thomas-restaurant-week-2026", "St. Thomas Restaurant Week is seeded"],
  ["victory-run-walk-2026", "Victory Run/Walk is seeded"],
  ["labor-day-races-2026", "Labor Day Races is seeded"],
  ["wall2wall-sprint-triathlon-2026", "Wall2Wall is seeded"],
  ["national-public-lands-day-2026", "National Public Lands Day is seeded"],
  ["sunday-funday-at-the-fort-2026", "Sunday Funday at the Fort is seeded"],
  ["sunset-sounds-at-loops-beach-2026", "Sunset Sounds is seeded"],
  ["americas-paradise-challenge-2026", "America's Paradise Challenge is seeded"],
  ["virgin-islands-puerto-rico-friendship-day-2026", "VI–Puerto Rico Friendship Day is seeded"],
  ["isca-world-championship-2026", "ISCA World Championship is seeded"],
  ["vibes-on-the-rock-2026", "VIBES on the Rock is seeded"],
  ["usvi-charter-yacht-show-2026", "USVI Charter Yacht Show is seeded"],
  ["paradise-jam-2026", "Paradise Jam is seeded"],
  ["crucian-coconut-festival-2026", "Crucian Coconut Festival is seeded"],
  ["crucian-christmas-festival-2026", "Crucian Christmas Festival is seeded"],
  ["st-croix-christmas-boat-parade-2026", "St. Croix Christmas Boat Parade is seeded"],
  ["st-thomas-carnival-2027", "St. Thomas Carnival is seeded"],
  ["st-john-celebration-2027", "St. John Celebration is seeded"],
  ["new Date().toISOString().slice(0, 10)", "upcoming filtering rolls forward with the current date"],
] as const) {
  assert.ok(eventsData.includes(value), `Events contract failed: ${label}`);
}

assert.ok(USVI_EVENTS.length >= 18, "Events contract failed: official event catalog unexpectedly shrank");
assert.equal(
  new Set(USVI_EVENTS.map((event) => event.id)).size,
  USVI_EVENTS.length,
  "Events contract failed: event IDs must remain unique",
);
assert.equal(
  new Set(USVI_EVENTS.map((event) => event.slug)).size,
  USVI_EVENTS.length,
  "Events contract failed: event slugs must remain unique",
);
for (const event of USVI_EVENTS) {
  assert.ok(event.name.trim(), `${event.id} needs a name`);
  assert.ok(event.location.trim(), `${event.id} needs a location`);
  assert.ok(event.sourceLabel.trim(), `${event.id} needs a source label`);
  assert.match(event.sourceUrl, /^https?:\/\//, `${event.id} needs an official source URL`);
  assert.match(event.verifiedAt, /^\d{4}-\d{2}-\d{2}$/, `${event.id} needs verifiedAt`);
}

const crucianChristmas = USVI_EVENTS.find(
  (event) => event.id === "stx-crucian-christmas-festival-2026",
);
assert.equal(
  crucianChristmas?.startDate,
  "2026-12-05",
  "Events contract failed: Crucian Christmas Festival must use the current official Dec. 5 start",
);
assert.equal(
  crucianChristmas?.endDate,
  "2027-01-02",
  "Events contract failed: Crucian Christmas Festival must use the current official Jan. 2 end",
);

for (const [value, label] of [
  ["ViPublicHeader", "Events uses shared USVI Explorer public chrome"],
  ['secondaryHref="/trips"', "Events keeps the canonical My Trip handoff"],
  ["Plan with Concierge", "Events exposes Concierge planning"],
  ["EVENT_CATEGORY_LABELS", "Events supports event-type filtering"],
  ["EVENT_ISLAND_LABELS", "Events supports island filtering"],
  ["Official Visit USVI calendar", "Events links to the official tourism calendar"],
  ["Event dates can change", "Events explains source freshness"],
  ["/events/${event.slug}", "event cards route to event detail pages"],
] as const) {
  assert.ok(eventsPage.includes(value), `Events hub contract failed: ${label}`);
}

assert.ok(
  !eventsPage.includes("next/image"),
  "Events hub contract failed: first release must not depend on new fragile event-image assets",
);

for (const [value, label] of [
  ["generateStaticParams", "event detail pages are generated for the source catalog"],
  ["getEventBySlug", "event detail resolves catalog records"],
  ["AddToJourneyButton", "event detail can become a real journey stop"],
  ["Open official listing", "event detail exposes the official source"],
  ["Open Living Map", "event detail keeps the Living Map handoff"],
  ["Build my event day", "event detail keeps Concierge planning"],
  ['href="/trips"', "event detail keeps the canonical My Trip handoff"],
  ["Verify before you go", "event detail communicates schedule-change risk"],
] as const) {
  assert.ok(eventDetail.includes(value), `Event detail contract failed: ${label}`);
}

for (const [value, label] of [
  ['value: "events"', "whole-territory Search exposes an Events filter"],
  ["getUpcomingEvents", "Search indexes upcoming event records"],
  ["EventResultCard", "Search renders event-specific result cards"],
  ["EVENT_CATEGORY_LABELS", "Search includes event categories in ranking"],
  ["EVENT_ISLAND_LABELS", "Search includes event islands in ranking"],
  ["/events/${event.slug}", "Search event results route to event detail pages"],
] as const) {
  assert.ok(searchPage.includes(value), `Events Search contract failed: ${label}`);
}

for (const [value, label] of [
  ['href="/events"', "homepage live-status panel links directly to Events"],
  ["See events", "homepage labels the Events entry clearly"],
]) {
  assert.ok(homeLiveStatus.includes(value), `Events home-entry contract failed: ${label}`);
}

console.log("USVI Explorer Events traveler-surface contracts passed.");
