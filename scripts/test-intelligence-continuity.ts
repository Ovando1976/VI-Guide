import assert from "node:assert/strict";

import {
  normalizeActiveTrip,
  summarizeJourneyPlan,
} from "../lib/intelligence/active-trip";
import {
  bearerTokenFromAuthorization,
  bindVerifiedIntelligenceIdentity,
} from "../lib/intelligence/identity";
import { mergeIntelligenceMemory } from "../lib/intelligence/memory-core";
import type { JourneyPlan } from "../lib/journey-planner";
import type { IntelligenceContext } from "../types/intelligence";

const context: IntelligenceContext = {
  sessionId: "intelligence_test_session",
  userId: "forged-user-id",
  page: "concierge",
  island: "stt",
  now: "2026-08-06T19:00:00.000Z",
  timezone: "America/St_Thomas",
  party: { adults: 2, children: 0, accessibilityNeeds: [] },
  preferences: { interests: ["beaches"], food: [], avoid: [] },
  memory: {},
};

const anonymous = bindVerifiedIntelligenceIdentity(context);
assert.equal(anonymous.userId, undefined);
assert.equal(anonymous.sessionId, context.sessionId);

const authenticated = bindVerifiedIntelligenceIdentity(
  context,
  "verified-firebase-user",
);
assert.equal(authenticated.userId, "verified-firebase-user");
assert.notEqual(authenticated.userId, context.userId);

assert.equal(
  bearerTokenFromAuthorization("Bearer verified-token"),
  "verified-token",
);
assert.equal(bearerTokenFromAuthorization("Basic invalid"), null);
assert.equal(bearerTokenFromAuthorization("Bearer   "), null);
assert.equal(bearerTokenFromAuthorization(null), null);

const plan: JourneyPlan = {
  id: "plan_st_thomas",
  title: "St. Thomas cruise day",
  island: "stt",
  date: "2026-12-12",
  createdAt: "2026-08-06T18:00:00.000Z",
  updatedAt: "2026-08-06T19:00:00.000Z",
  status: "ready",
  notes: "",
  plan: Array.from({ length: 14 }, (_, index) => ({
    id: `stop_${index + 1}`,
    title: `Stop ${index + 1}`,
    island: "stt" as const,
    kind: index === 0 ? "beach" : "place",
    summary: "Grounded stop",
    startTime: index === 0 ? "09:00" : undefined,
    durationMinutes: 75,
  })),
};

const activeTrip = summarizeJourneyPlan(plan);
assert.ok(activeTrip);
assert.equal(activeTrip?.id, plan.id);
assert.equal(activeTrip?.status, "ready");
assert.equal(activeTrip?.stops.length, 12);
assert.equal(activeTrip?.stops[0]?.startTime, "09:00");

const normalized = normalizeActiveTrip({
  ...activeTrip,
  stops: [
    ...(activeTrip?.stops ?? []),
    { id: "bad-time", title: "Bad time", kind: "place", startTime: "31:99" },
  ],
});
assert.ok(normalized);
assert.equal(normalized?.stops.length, 12);
assert.ok(normalized?.stops.every((stop) => stop.startTime !== "31:99"));
assert.equal(normalizeActiveTrip({ title: "Missing fields" }), undefined);

const merged = mergeIntelligenceMemory(
  {
    preferredIsland: "stj",
    preferences: {
      interests: ["history"],
      food: ["seafood"],
      avoid: ["crowds"],
    },
    activeTrip,
  },
  {
    preferredIsland: "stt",
    preferences: {
      interests: ["beaches", "history"],
      food: ["local food"],
      avoid: ["steep trails"],
    },
  },
);
assert.equal(merged.preferredIsland, "stt");
assert.deepEqual(merged.preferences?.interests, ["history", "beaches"]);
assert.deepEqual(merged.preferences?.food, ["seafood", "local food"]);
assert.deepEqual(merged.preferences?.avoid, ["crowds", "steep trails"]);
assert.equal(merged.activeTrip?.id, plan.id);

console.log("Intelligence identity and trip continuity tests passed.");
