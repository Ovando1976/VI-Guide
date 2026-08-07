import type { JourneyPlan } from "@/lib/journey-planner";
import {
  journeyTombstoneIds,
  mergeJourneyTombstones,
  type JourneyTombstone,
} from "@/lib/journey-sync-state";
import {
  normalizeTravelerTripSelection,
  resolveTravelerTripSelection,
  type TravelerTripSelection,
} from "@/lib/traveler-trip-selection";

export type JourneyCloudState = {
  plans: JourneyPlan[];
  tombstones: JourneyTombstone[];
  selection: TravelerTripSelection;
};

export function mergeJourneyCloudState(input: {
  localPlans: JourneyPlan[];
  remotePlans: JourneyPlan[];
  localTombstones?: JourneyTombstone[];
  remoteTombstones?: JourneyTombstone[];
  localSelection?: TravelerTripSelection | null;
  remoteSelection?: TravelerTripSelection | null;
}): JourneyCloudState {
  const tombstones = mergeJourneyTombstones(
    input.localTombstones ?? [],
    input.remoteTombstones ?? [],
  );
  const deleted = journeyTombstoneIds(tombstones);
  const merged = new Map<string, JourneyPlan>();

  for (const plan of [...input.localPlans, ...input.remotePlans]) {
    if (deleted.has(plan.id)) continue;
    const existing = merged.get(plan.id);
    if (!existing || plan.updatedAt > existing.updatedAt) {
      merged.set(plan.id, plan);
    }
  }

  const plans = [...merged.values()].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  const selection = resolveTravelerTripSelection({
    local: normalizeTravelerTripSelection(input.localSelection),
    remote: normalizeTravelerTripSelection(input.remoteSelection),
    availablePlanIds: plans.map((plan) => plan.id),
  });

  return { plans, tombstones, selection };
}

export function filterJourneyPlansByTombstones(
  plans: JourneyPlan[],
  tombstones: JourneyTombstone[],
) {
  const deleted = journeyTombstoneIds(tombstones);
  return plans.filter((plan) => !deleted.has(plan.id));
}
