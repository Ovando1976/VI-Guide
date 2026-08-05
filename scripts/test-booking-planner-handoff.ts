import assert from "node:assert/strict";

import {
  buildBookingPlannerHref,
  createBookingJourneyPlan,
  parseBookingPlannerHandoff,
} from "../lib/booking/booking-planner-handoff";

const accommodation = {
  reference: "VI-STAY-ME7F3K-AB12",
  kind: "accommodation" as const,
  island: "stt" as const,
  listingId: "ritz-carlton-st-thomas",
  listingName: "The Ritz-Carlton, St. Thomas",
  startDate: "2026-09-10",
  endDate: "2026-09-14",
  listingHref: "/accommodations/ritz-carlton-st-thomas?island=stt",
};

const href = buildBookingPlannerHref(accommodation);
assert.match(href, /^\/planner\?/);
assert.equal(href.includes("email="), false);
assert.equal(href.includes("phone="), false);
assert.equal(href.includes("guestName="), false);

const parsed = parseBookingPlannerHandoff(
  new URL(href, "https://vi-guide.local").searchParams,
);
assert.deepEqual(parsed, accommodation);

const plan = createBookingJourneyPlan(
  accommodation,
  new Date("2026-08-05T12:00:00.000Z"),
);
assert.equal(plan.id, "booking-vi-stay-me7f3k-ab12");
assert.equal(plan.date, "2026-09-10");
assert.equal(plan.island, "stt");
assert.equal(plan.plan.length, 1);
assert.equal(plan.plan[0]?.title, "The Ritz-Carlton, St. Thomas");
assert.equal(
  plan.plan[0]?.href,
  "/accommodations/ritz-carlton-st-thomas?island=stt",
);
assert.match(plan.notes, /not a confirmed reservation/i);
assert.match(plan.plan[0]?.summary ?? "", /under review/i);

const samePlan = createBookingJourneyPlan(
  accommodation,
  new Date("2026-08-06T12:00:00.000Z"),
);
assert.equal(samePlan.id, plan.id, "reopening the same request must stay idempotent");

assert.equal(
  parseBookingPlannerHandoff(
    new URLSearchParams({
      source: "booking",
      reference: "VI-TOUR-ME7F3K-AB12",
      kind: "accommodation",
      island: "stt",
      listingId: "test",
      listingName: "Test stay",
      startDate: "2026-09-10",
      endDate: "2026-09-14",
    }),
  ),
  null,
  "reference prefix must match the booking kind",
);

assert.equal(
  parseBookingPlannerHandoff(
    new URLSearchParams({
      source: "booking",
      reference: "VI-STAY-ME7F3K-AB12",
      kind: "accommodation",
      island: "stt",
      listingId: "test",
      listingName: "Test stay",
      startDate: "2026-09-10",
      endDate: "2026-09-10",
    }),
  ),
  null,
  "same-day accommodation ranges must be rejected",
);

const externalHref = parseBookingPlannerHandoff(
  new URLSearchParams({
    source: "booking",
    reference: "VI-TOUR-ME7F3K-CD34",
    kind: "tour",
    island: "stj",
    listingId: "reef-tour",
    listingName: "Reef Tour",
    startDate: "2026-09-12",
    listingHref: "https://evil.example/steal",
  }),
);
assert.deepEqual(externalHref, {
  reference: "VI-TOUR-ME7F3K-CD34",
  kind: "tour",
  island: "stj",
  listingId: "reef-tour",
  listingName: "Reef Tour",
  startDate: "2026-09-12",
});

assert.equal(
  parseBookingPlannerHandoff(
    new URLSearchParams({
      source: "other",
      reference: "VI-EXP-ME7F3K-EF56",
      kind: "experience",
      island: "stx",
      listingId: "food-walk",
      listingName: "Food Walk",
      startDate: "2026-09-15",
    }),
  ),
  null,
);

console.log("Booking planner handoff tests passed.");
