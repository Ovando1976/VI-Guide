export const TRAVELER_TRIP_SELECTION_STORAGE_KEY =
  "vi-guide.traveler-trip-selection.v1";
export const TRAVELER_TRIP_SELECTION_UPDATED_EVENT =
  "vi-guide-traveler-trip-selection";

// Keep existing trip-aware surfaces in sync without importing journey-planner here
// (which would create a circular dependency once journey-planner honors selection).
const JOURNEY_PLAN_UPDATED_EVENT = "vi-guide-intelligence-plan-saved";

export function readSelectedTravelerTripPlanId() {
  if (typeof window === "undefined") return "";
  try {
    return clean(window.localStorage.getItem(TRAVELER_TRIP_SELECTION_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function writeSelectedTravelerTripPlanId(planId: string) {
  const normalized = clean(planId);
  if (typeof window === "undefined") return normalized;
  try {
    if (normalized) {
      window.localStorage.setItem(
        TRAVELER_TRIP_SELECTION_STORAGE_KEY,
        normalized,
      );
    } else {
      window.localStorage.removeItem(TRAVELER_TRIP_SELECTION_STORAGE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, {
        detail: normalized,
      }),
    );
    window.dispatchEvent(new Event(JOURNEY_PLAN_UPDATED_EVENT));
  } catch {
    // Private browsing policies should never prevent a traveler from using My Trip.
  }
  return normalized;
}

export function prioritizeSelectedTravelerPlan<T extends { id: string }>(plans: T[]) {
  const selectedPlanId = readSelectedTravelerTripPlanId();
  if (!selectedPlanId) return plans;
  const index = plans.findIndex((plan) => plan.id === selectedPlanId);
  if (index <= 0) return plans;
  return [plans[index], ...plans.slice(0, index), ...plans.slice(index + 1)];
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}
