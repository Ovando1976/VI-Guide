import assert from "node:assert/strict";

import {
  normalizeActiveTrip,
  summarizeJourneyPlan,
} from "../lib/intelligence/active-trip";
import {
  buildTripRiskPrompt,
  evaluateTripRisk,
} from "../lib/intelligence/trip-risk";
import type { JourneyPlan } from "../lib/journey-planner";
import type {
  IntelligenceActiveTrip,
  IntelligenceMemory,
} from "../types/intelligence";

const NOW = "2026-08-06T16:00:00-04:00";

function trip(
  patch: Partial<IntelligenceActiveTrip> = {},
): IntelligenceActiveTrip {
  return {
    id: "trip_proactive_test",
    title: "Protected St. Thomas day",
    island: "stt",
    date: "2026-08-06",
    status: "ready",
    updatedAt: NOW,
    stops: [
      {
        id: "stop_port",
        title: "Havensight pickup",
        kind: "cruise terminal",
        summary: "Meet the reserved taxi near the cruise dock.",
        startTime: "09:00",
        durationMinutes: 45,
        mobility: { mode: "taxi", estimatedMinutes: 25 },
      },
      {
        id: "stop_beach",
        title: "Magens Bay",
        kind: "beach",
        summary: "Relaxed beach visit with nearby facilities.",
        startTime: "10:30",
        durationMinutes: 120,
        mobility: { mode: "taxi", estimatedMinutes: 30 },
      },
      {
        id: "stop_town",
        title: "Charlotte Amalie",
        kind: "place",
        summary: "Lunch and a short historic district walk.",
        startTime: "13:30",
        durationMinutes: 90,
        mobility: { mode: "taxi", estimatedMinutes: 25 },
      },
    ],
    ...patch,
  };
}

const healthy = evaluateTripRisk(trip(), {}, { now: NOW });
assert.equal(healthy.status, "healthy");
assert.equal(healthy.issueCount, 0);
assert.equal(healthy.score, 100);

const overlapping = evaluateTripRisk(
  trip({
    stops: [
      {
        id: "first",
        title: "First stop",
        kind: "place",
        startTime: "09:00",
        durationMinutes: 120,
      },
      {
        id: "second",
        title: "Second stop",
        kind: "place",
        startTime: "10:15",
        durationMinutes: 60,
      },
    ],
  }),
  {},
  { now: NOW },
);
assert.equal(overlapping.status, "attention");
assert.ok(overlapping.issues.some((issue) => issue.id.startsWith("overlap_")));

const tightFerryTransfer = evaluateTripRisk(
  trip({
    stops: [
      {
        id: "ferry",
        title: "Red Hook ferry terminal",
        kind: "ferry",
        startTime: "09:00",
        durationMinutes: 60,
        mobility: { mode: "ferry" },
      },
      {
        id: "tour",
        title: "Cruz Bay walking tour",
        kind: "tour",
        startTime: "10:20",
        durationMinutes: 90,
      },
    ],
  }),
  {},
  { now: NOW },
);
assert.ok(
  tightFerryTransfer.issues.some(
    (issue) => issue.category === "transfer" && issue.severity === "high",
  ),
);

const cruiseMemory: IntelligenceMemory = {
  cruise: {
    ship: "Test Ship",
    arrivalTime: "08:00",
    allAboardTime: "16:00",
  },
};
const missedShip = evaluateTripRisk(
  trip({
    stops: [
      {
        id: "late_stop",
        title: "Late island tour",
        kind: "tour",
        summary: "A long tour far from the cruise terminal.",
        startTime: "14:30",
        durationMinutes: 120,
      },
    ],
  }),
  cruiseMemory,
  { now: NOW },
);
assert.equal(missedShip.status, "critical");
assert.equal(missedShip.returnWindow?.allAboardTime, "16:00");
assert.equal(missedShip.returnWindow?.safeReturnByTime, "14:30");
assert.ok(
  missedShip.issues.some((issue) => issue.id === "cruise_return_missed"),
);

const accessibility = evaluateTripRisk(
  trip({
    stops: [
      {
        id: "steep_trail",
        title: "Steep heritage trail",
        kind: "hike",
        summary: "Rocky stairway and a long climb with limited shade.",
        startTime: "09:00",
        durationMinutes: 90,
      },
    ],
  }),
  {
    party: { accessibilityNeeds: ["step-free access"] },
    preferences: { avoid: ["steep trails"] },
  },
  { now: NOW },
);
assert.ok(
  accessibility.issues.some(
    (issue) => issue.category === "accessibility",
  ),
);

const bookingPending = evaluateTripRisk(
  trip({
    stops: [
      {
        id: "pending_booking",
        title: "Private sail",
        kind: "booking",
        summary: "Availability request submitted; awaiting confirmation.",
        startTime: "10:00",
        durationMinutes: 180,
        bookingHref: "/bookings/pending",
      },
    ],
  }),
  {},
  { now: NOW },
);
assert.ok(
  bookingPending.issues.some((issue) => issue.category === "booking"),
);

const weather = evaluateTripRisk(trip(), {}, {
  now: NOW,
  weatherAlerts: [
    {
      id: "official-severe-alert",
      event: "Flash Flood Warning",
      headline: "Flash flooding is possible in the U.S. Virgin Islands.",
      severity: "severe",
      onset: "2026-08-06T14:00:00-04:00",
      expires: "2026-08-06T20:00:00-04:00",
      instruction: "Avoid flooded roads and low-lying areas.",
      sourceUrl: "https://api.weather.gov/alerts/test",
    },
  ],
});
assert.equal(weather.status, "attention");
assert.ok(
  weather.issues.some(
    (issue) => issue.category === "weather" && issue.severity === "high",
  ),
);

const futureWeather = evaluateTripRisk(
  trip({ date: "2026-08-08" }),
  {},
  {
    now: NOW,
    weatherAlerts: [
      {
        id: "expired-alert",
        event: "Flood Advisory",
        headline: "Advisory only for August 6.",
        severity: "moderate",
        onset: "2026-08-06T12:00:00-04:00",
        expires: "2026-08-06T18:00:00-04:00",
      },
    ],
  },
);
assert.ok(!futureWeather.issues.some((issue) => issue.category === "weather"));

const prompt = buildTripRiskPrompt(missedShip, trip());
assert.match(prompt, /Trip health:/);
assert.match(prompt, /The itinerary runs past all-aboard time/);
assert.match(prompt, /Protected St\. Thomas day/);

const journey: JourneyPlan = {
  id: "journey_context",
  title: "Context-rich journey",
  island: "stt",
  date: "2026-08-06",
  createdAt: NOW,
  updatedAt: NOW,
  status: "ready",
  notes: "",
  plan: [
    {
      id: "context_stop",
      title: "Red Hook ferry",
      island: "stt",
      kind: "ferry",
      summary: "Pending confirmation for an inter-island ferry connection.",
      startTime: "09:00",
      durationMinutes: 60,
      bookingHref: "/bookings/ferry",
      mobility: {
        to: "Cruz Bay",
        mode: "ferry",
        estimatedMinutes: 20,
      },
    },
  ],
};
const summarized = summarizeJourneyPlan(journey);
assert.equal(summarized?.stops[0]?.summary, journey.plan[0].summary);
assert.equal(summarized?.stops[0]?.bookingHref, "/bookings/ferry");
assert.equal(summarized?.stops[0]?.mobility?.mode, "ferry");
assert.equal(summarized?.stops[0]?.mobility?.estimatedMinutes, 20);

const normalized = normalizeActiveTrip(summarized);
assert.equal(normalized?.stops[0]?.mobility?.mode, "ferry");
assert.equal(normalized?.stops[0]?.summary, journey.plan[0].summary);

console.log("Proactive trip intelligence tests passed.");
