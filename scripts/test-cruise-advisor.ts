import assert from "node:assert/strict";

import {
  canTransitionCruiseRequest,
  cruiseTerritoryDayKey,
  humanizeCruiseValue,
  normalizeCruiseAdvisorNote,
  normalizeCruisePlanningRequest,
} from "../lib/cruise-advisor";
import {
  MAX_CRUISE_REQUESTS_PER_EMAIL_DAY,
  cruiseRequestEmailDayFingerprint,
  cruiseRequestFingerprint,
  cruiseRequestQuotaAllows,
} from "../lib/cruise-advisor-intake";

const now = new Date("2026-08-06T18:00:00.000Z");
const valid = normalizeCruisePlanningRequest(
  {
    travelerName: " Ovando Traveler ",
    email: " TRAVELER@EXAMPLE.COM ",
    phone: "+1 (340) 555-0199",
    departureWindowStart: "2026-11-01",
    departureWindowEnd: "2026-11-30",
    departurePort: "san_juan",
    destinations: [
      "us_virgin_islands",
      "southern_caribbean",
      "us_virgin_islands",
      "invalid",
    ],
    adults: "2",
    children: "1",
    budgetDollars: "$6,500",
    tripLength: "6_8_nights",
    cabinPreference: "balcony",
    priorities: ["food", "culture", "food"],
    accessibilityNotes: "One traveler needs step-free access.",
    celebration: "Anniversary",
    notes: "Prefer a quiet ship with strong dining options.",
    consent: true,
    website: "",
    formStartedAt: "2026-08-06T17:59:30.000Z",
  },
  now,
);
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.request.travelerName, "Ovando Traveler");
  assert.equal(valid.request.email, "traveler@example.com");
  assert.equal(valid.request.budgetCents, 650_000);
  assert.deepEqual(valid.request.destinations, [
    "us_virgin_islands",
    "southern_caribbean",
  ]);
  assert.deepEqual(valid.request.priorities, ["food", "culture"]);
  assert.equal(valid.request.submittedAt, now.toISOString());
}

assert.deepEqual(
  normalizeCruisePlanningRequest(
    {
      travelerName: "Bot Traveler",
      email: "bot@example.com",
      departureWindowStart: "2026-11-01",
      departureWindowEnd: "2026-11-20",
      departurePort: "miami",
      destinations: ["bahamas"],
      adults: 2,
      children: 0,
      tripLength: "3_5_nights",
      cabinPreference: "best_value",
      consent: true,
      website: "spam.example",
      formStartedAt: "2026-08-06T17:59:30.000Z",
    },
    now,
  ),
  { ok: false, error: "Unable to submit this request.", spam: true },
);

const tooFast = normalizeCruisePlanningRequest(
  {
    travelerName: "Fast Traveler",
    email: "fast@example.com",
    departureWindowStart: "2026-11-01",
    departureWindowEnd: "2026-11-20",
    departurePort: "miami",
    destinations: ["bahamas"],
    adults: 2,
    children: 0,
    tripLength: "3_5_nights",
    cabinPreference: "best_value",
    consent: true,
    formStartedAt: "2026-08-06T17:59:59.000Z",
  },
  now,
);
assert.equal(tooFast.ok, false);
assert.equal(tooFast.ok ? false : tooFast.spam, true);

const invalidWindow = normalizeCruisePlanningRequest(
  {
    travelerName: "Window Traveler",
    email: "window@example.com",
    departureWindowStart: "2026-12-01",
    departureWindowEnd: "2026-11-01",
    departurePort: "miami",
    destinations: ["eastern_caribbean"],
    adults: 2,
    children: 0,
    tripLength: "6_8_nights",
    cabinPreference: "balcony",
    consent: true,
    formStartedAt: "2026-08-06T17:59:30.000Z",
  },
  now,
);
assert.equal(invalidWindow.ok, false);
assert.equal(
  invalidWindow.ok ? "" : invalidWindow.error,
  "The travel-window end date must be on or after the start date.",
);

const missingOtherPort = normalizeCruisePlanningRequest(
  {
    travelerName: "Other Port Traveler",
    email: "port@example.com",
    departureWindowStart: "2026-11-01",
    departureWindowEnd: "2026-11-20",
    departurePort: "other",
    destinations: ["open_to_recommendations"],
    adults: 2,
    children: 0,
    tripLength: "flexible",
    cabinPreference: "unsure",
    consent: true,
    formStartedAt: "2026-08-06T17:59:30.000Z",
  },
  now,
);
assert.equal(missingOtherPort.ok, false);
assert.equal(
  missingOtherPort.ok ? "" : missingOtherPort.error,
  "Enter the preferred departure city or port.",
);

const fingerprint = cruiseRequestFingerprint({
  email: "Traveler@Example.com",
  departureWindowStart: "2026-11-01",
  departureWindowEnd: "2026-11-30",
  adults: 2,
  children: 1,
  dayKey: "2026-08-06",
});
assert.equal(fingerprint.length, 64);
assert.equal(
  fingerprint,
  cruiseRequestFingerprint({
    email: "traveler@example.com",
    departureWindowStart: "2026-11-01",
    departureWindowEnd: "2026-11-30",
    adults: 2,
    children: 1,
    dayKey: "2026-08-06",
  }),
);
assert.notEqual(
  fingerprint,
  cruiseRequestFingerprint({
    email: "traveler@example.com",
    departureWindowStart: "2026-12-01",
    departureWindowEnd: "2026-12-20",
    adults: 2,
    children: 1,
    dayKey: "2026-08-06",
  }),
);

const emailFingerprint = cruiseRequestEmailDayFingerprint({
  email: "Traveler@Example.com",
  dayKey: "2026-08-06",
});
assert.equal(emailFingerprint.length, 64);
assert.equal(
  emailFingerprint,
  cruiseRequestEmailDayFingerprint({
    email: "traveler@example.com",
    dayKey: "2026-08-06",
  }),
);
assert.equal(cruiseRequestQuotaAllows(0), true);
assert.equal(
  cruiseRequestQuotaAllows(MAX_CRUISE_REQUESTS_PER_EMAIL_DAY - 1),
  true,
);
assert.equal(
  cruiseRequestQuotaAllows(MAX_CRUISE_REQUESTS_PER_EMAIL_DAY),
  false,
);
assert.equal(cruiseRequestQuotaAllows("invalid"), true);

assert.equal(canTransitionCruiseRequest("new", "researching"), true);
assert.equal(canTransitionCruiseRequest("researching", "quoted"), true);
assert.equal(canTransitionCruiseRequest("quoted", "booked"), true);
assert.equal(canTransitionCruiseRequest("booked", "researching"), false);
assert.equal(canTransitionCruiseRequest("closed", "researching"), true);
assert.equal(
  normalizeCruiseAdvisorNote("  Research balcony cabins next.  "),
  "Research balcony cabins next.",
);
assert.equal(humanizeCruiseValue("customer_review"), "Customer Review");
assert.equal(cruiseTerritoryDayKey(now), "2026-08-06");

console.log("Cruise advisor tests passed.");
