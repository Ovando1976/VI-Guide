import assert from "node:assert/strict";

import {
  cruisePortDaySafetyLabel,
  evaluateCruisePortDaySafety,
} from "../lib/cruise-port-day-safety";

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

console.log("Cruise port-day safety tests passed.");
