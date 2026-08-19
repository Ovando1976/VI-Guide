import assert from "node:assert/strict";

import {
  derivePlanningAllAboard,
  getOfficialCruisePortCall,
} from "../lib/cruise-port-calls";
import {
  cruisePortDaySafetyLabel,
  evaluateCruisePortDaySafety,
} from "../lib/cruise-port-day-safety";
import {
  cruiseSafetyStopId,
  provenanceLabel,
  upsertCruiseSafetyJourneyPlan,
} from "../lib/cruise-port-day-trip";

const protectedPlan = evaluateCruisePortDaySafety({
  allAboardTime: "17:30",
  plannedReturnDepartureTime: "15:30",
  estimatedReturnTravelMinutes: 30,
  desiredSafetyBufferMinutes: 60,
});
assert.equal(protectedPlan.ok, true);
if (protectedPlan.ok) {
  assert.equal(protectedPlan.result.status, "safe_buffer");
  assert.equal(protectedPlan.result.returnBufferMet, true);
  assert.equal(protectedPlan.result.safeReturnDeadline, "16:30");
  assert.equal(protectedPlan.result.expectedPortReturnTime, "16:00");
  assert.equal(protectedPlan.result.expectedBufferMinutes, 90);
}

const exactBoundary = evaluateCruisePortDaySafety({
  allAboardTime: "17:30",
  plannedReturnDepartureTime: "16:00",
  estimatedReturnTravelMinutes: 30,
  desiredSafetyBufferMinutes: 60,
});
assert.equal(exactBoundary.ok, true);
if (exactBoundary.ok) {
  assert.equal(exactBoundary.result.status, "safe_buffer");
  assert.equal(exactBoundary.result.expectedBufferMinutes, 60);
}

const shortBuffer = evaluateCruisePortDaySafety({
  allAboardTime: "17:30",
  plannedReturnDepartureTime: "16:01",
  estimatedReturnTravelMinutes: 30,
  desiredSafetyBufferMinutes: 60,
});
assert.equal(shortBuffer.ok, true);
if (shortBuffer.ok) {
  assert.equal(shortBuffer.result.status, "buffer_short");
  assert.equal(shortBuffer.result.returnBufferMet, false);
  assert.equal(shortBuffer.result.expectedBufferMinutes, 59);
}

const missesAllAboard = evaluateCruisePortDaySafety({
  allAboardTime: "17:30",
  plannedReturnDepartureTime: "17:10",
  estimatedReturnTravelMinutes: 30,
  desiredSafetyBufferMinutes: 60,
});
assert.equal(missesAllAboard.ok, true);
if (missesAllAboard.ok) {
  assert.equal(missesAllAboard.result.status, "misses_all_aboard");
  assert.equal(missesAllAboard.result.expectedBufferMinutes, -10);
}

const afterAllAboard = evaluateCruisePortDaySafety({
  allAboardTime: "17:30",
  plannedReturnDepartureTime: "18:00",
  estimatedReturnTravelMinutes: 15,
  desiredSafetyBufferMinutes: 30,
});
assert.deepEqual(afterAllAboard, {
  ok: false,
  error: "The planned return departure must be before the ship's all-aboard time.",
});

assert.equal(
  evaluateCruisePortDaySafety({
    allAboardTime: "bad",
    plannedReturnDepartureTime: "16:00",
    estimatedReturnTravelMinutes: 30,
    desiredSafetyBufferMinutes: 60,
  }).ok,
  false,
);
assert.equal(
  evaluateCruisePortDaySafety({
    allAboardTime: "17:30",
    plannedReturnDepartureTime: "16:00",
    estimatedReturnTravelMinutes: 0,
    desiredSafetyBufferMinutes: 60,
  }).ok,
  false,
);
assert.equal(cruisePortDaySafetyLabel("safe_buffer"), "Buffer protected");
assert.equal(cruisePortDaySafetyLabel("buffer_short"), "Buffer too tight");
assert.equal(cruisePortDaySafetyLabel("misses_all_aboard"), "Misses all aboard");

const officialCall = getOfficialCruisePortCall(
  "2026-08-19_havensight_disney-treasure",
);
assert.ok(officialCall);
assert.equal(officialCall.departsAt, "16:00");
const planningProxy = derivePlanningAllAboard(officialCall.departsAt);
assert.equal(planningProxy, "15:30");
assert.match(
  provenanceLabel("official_departure_proxy"),
  /planning proxy/,
);
assert.match(
  provenanceLabel("traveler_confirmed_all_aboard"),
  /traveler-confirmed/,
);

const officialSafety = evaluateCruisePortDaySafety({
  allAboardTime: planningProxy!,
  plannedReturnDepartureTime: "13:45",
  estimatedReturnTravelMinutes: 30,
  desiredSafetyBufferMinutes: 60,
});
assert.equal(officialSafety.ok, true);
if (officialSafety.ok) {
  const saved = upsertCruiseSafetyJourneyPlan({
    plans: [],
    call: officialCall,
    result: officialSafety.result,
    allAboardTime: planningProxy!,
    plannedReturnDepartureTime: "13:45",
    estimatedReturnTravelMinutes: 30,
    desiredSafetyBufferMinutes: 60,
    provenance: "official_departure_proxy",
  });
  assert.equal(saved.date, officialCall.date);
  assert.equal(saved.island, officialCall.island);
  assert.equal(saved.plan.length, 1);
  assert.equal(saved.plan[0]?.id, cruiseSafetyStopId(officialCall.id));
  assert.equal(saved.plan[0]?.kind, "cruise_safety");
  assert.match(saved.plan[0]?.summary ?? "", /planning evidence only/);
  assert.doesNotMatch(saved.plan[0]?.summary ?? "", /buffer_verified: true/);

  const updated = upsertCruiseSafetyJourneyPlan({
    plans: [saved],
    call: officialCall,
    result: officialSafety.result,
    allAboardTime: "15:15",
    plannedReturnDepartureTime: "13:45",
    estimatedReturnTravelMinutes: 30,
    desiredSafetyBufferMinutes: 60,
    provenance: "traveler_confirmed_all_aboard",
  });
  assert.equal(updated.plan.length, 1, "same port call replaces its safety stop");
  assert.match(updated.plan[0]?.summary ?? "", /traveler-confirmed/);
}

console.log("Cruise port-day safety and My Trip handoff tests passed.");
