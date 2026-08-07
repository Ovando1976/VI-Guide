import assert from "node:assert/strict";

import {
  canTransitionTravelRequest,
  normalizeTravelPlanningRequest,
  normalizeTravelRequestStatus,
  travelIslandLabel,
  travelTerritoryDayKey,
} from "../lib/travel-advisor";

const now = new Date("2026-08-07T18:30:00.000Z");
const valid = normalizeTravelPlanningRequest(
  {
    travelerName: "Test Traveler",
    email: "Traveler@Example.com",
    phone: "340-555-0101",
    island: "stt",
    arrival: "2026-09-10",
    departure: "2026-09-15",
    travelers: "2",
    budget: "comfort",
    stayStatus: "need_help",
    pace: "balanced",
    interests: ["beaches", "food", "invalid", "beaches"],
    notes: " Anniversary trip ",
    consent: true,
    website: "",
    formStartedAt: "2026-08-07T18:29:00.000Z",
  },
  now,
);

assert.equal(valid.ok, true);
if (!valid.ok) throw new Error(valid.error);
assert.equal(valid.request.email, "traveler@example.com");
assert.equal(valid.request.travelers, 2);
assert.deepEqual(valid.request.interests, ["beaches", "food"]);
assert.equal(valid.request.notes, "Anniversary trip");
assert.equal(valid.request.submittedAt, now.toISOString());

const badDates = normalizeTravelPlanningRequest(
  {
    travelerName: "Test Traveler",
    email: "traveler@example.com",
    island: "stj",
    arrival: "2026-09-15",
    departure: "2026-09-10",
    travelers: 2,
    budget: "comfort",
    stayStatus: "already_booked",
    pace: "relaxed",
    interests: [],
    consent: true,
  },
  now,
);
assert.equal(badDates.ok, false);
if (badDates.ok) throw new Error("Expected invalid date order");
assert.match(badDates.error, /Departure must be after arrival/);

const noConsent = normalizeTravelPlanningRequest(
  {
    travelerName: "Test Traveler",
    email: "traveler@example.com",
    island: "multi",
    travelers: 4,
    budget: "premium",
    stayStatus: "compare_options",
    pace: "packed",
    interests: ["culture_history"],
    consent: false,
  },
  now,
);
assert.equal(noConsent.ok, false);

const honeypot = normalizeTravelPlanningRequest(
  {
    travelerName: "Bot Traveler",
    email: "bot@example.com",
    island: "stx",
    travelers: 1,
    budget: "value",
    stayStatus: "hotel",
    pace: "relaxed",
    interests: [],
    consent: true,
    website: "https://spam.example",
  },
  now,
);
assert.equal(honeypot.ok, false);
if (honeypot.ok) throw new Error("Expected honeypot rejection");
assert.equal(honeypot.spam, true);

const tooFast = normalizeTravelPlanningRequest(
  {
    travelerName: "Fast Traveler",
    email: "fast@example.com",
    island: "not_sure",
    travelers: 1,
    budget: "flexible",
    stayStatus: "villa",
    pace: "balanced",
    interests: [],
    consent: true,
    formStartedAt: "2026-08-07T18:29:59.500Z",
  },
  now,
);
assert.equal(tooFast.ok, false);
if (tooFast.ok) throw new Error("Expected timing rejection");
assert.equal(tooFast.spam, true);

assert.equal(normalizeTravelRequestStatus("reviewing"), "reviewing");
assert.equal(normalizeTravelRequestStatus("unknown"), null);
assert.equal(canTransitionTravelRequest("new", "reviewing"), true);
assert.equal(canTransitionTravelRequest("new", "booked"), false);
assert.equal(canTransitionTravelRequest("contacted", "booked"), true);
assert.equal(canTransitionTravelRequest("closed", "new"), false);
assert.equal(travelIslandLabel("stx"), "St. Croix");
assert.equal(travelTerritoryDayKey(now), "2026-08-07");

console.log("USVI travel advisor intake tests passed.");
