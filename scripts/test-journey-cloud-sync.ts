import assert from "node:assert/strict";

import { mergeJourneyCloudState } from "../lib/journey-cloud-state";
import { normalizeJourneyTombstones } from "../lib/journey-sync-state";
import {
  normalizeTravelerTripSelection,
  resolveTravelerTripSelection,
} from "../lib/traveler-trip-selection";
import type { JourneyPlan } from "../lib/journey-planner";

const oldPlan = plan("plan_old", "2026-05-02", "2026-05-02T12:00:00.000Z");
const currentLocal = plan("plan_aug", "2026-08-10", "2026-08-07T20:00:00.000Z");
const currentRemote = {
  ...currentLocal,
  title: "Updated on another device",
  updatedAt: "2026-08-07T21:00:00.000Z",
};
const winterPlan = plan("plan_winter", "2026-12-20", "2026-08-07T19:00:00.000Z");

const tombstones = normalizeJourneyTombstones([
  { id: "plan_old", deletedAt: "2026-08-07T21:10:00.000Z" },
  { id: "plan_old", deletedAt: "2026-08-07T20:10:00.000Z" },
  { id: "", deletedAt: "not-a-date" },
]);
assert.deepEqual(tombstones, [
  { id: "plan_old", deletedAt: "2026-08-07T21:10:00.000Z" },
]);

const merged = mergeJourneyCloudState({
  localPlans: [oldPlan, currentLocal],
  remotePlans: [currentRemote, winterPlan],
  localTombstones: [],
  remoteTombstones: tombstones,
  localSelection: {
    planId: "plan_aug",
    updatedAt: "2026-08-07T20:30:00.000Z",
  },
  remoteSelection: {
    planId: "plan_winter",
    updatedAt: "2026-08-07T21:30:00.000Z",
  },
});

assert.equal(merged.plans.some((item) => item.id === "plan_old"), false);
assert.equal(
  merged.plans.find((item) => item.id === "plan_aug")?.title,
  "Updated on another device",
);
assert.equal(merged.selection.planId, "plan_winter");
assert.equal(merged.tombstones.length, 1);

const deletedRemoteSelection = mergeJourneyCloudState({
  localPlans: [currentLocal],
  remotePlans: [oldPlan],
  remoteTombstones: tombstones,
  localSelection: {
    planId: "plan_aug",
    updatedAt: "2026-08-07T20:30:00.000Z",
  },
  remoteSelection: {
    planId: "plan_old",
    updatedAt: "2026-08-07T22:00:00.000Z",
  },
});
assert.equal(deletedRemoteSelection.selection.planId, "plan_aug");
assert.equal(deletedRemoteSelection.plans.length, 1);

const selection = resolveTravelerTripSelection({
  local: normalizeTravelerTripSelection({
    planId: "plan_aug",
    updatedAt: "2026-08-07T20:00:00.000Z",
  }),
  remote: normalizeTravelerTripSelection({
    planId: "plan_winter",
    updatedAt: "2026-08-07T21:00:00.000Z",
  }),
  availablePlanIds: ["plan_aug", "plan_winter"],
});
assert.equal(selection.planId, "plan_winter");

const legacySelection = normalizeTravelerTripSelection("plan_aug");
assert.deepEqual(legacySelection, { planId: "plan_aug", updatedAt: "" });

console.log("Journey cross-device sync integrity tests passed.");

function plan(id: string, date: string, updatedAt: string): JourneyPlan {
  return {
    id,
    title: id,
    island: "stt",
    date,
    createdAt: updatedAt,
    updatedAt,
    status: "ready",
    notes: "",
    plan: [],
  };
}
