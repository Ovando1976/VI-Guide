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

export function prioritizeSelectedTravelerPlan<
  T extends { id: string; date?: string },
>(plans: T[]) {
  if (plans.length < 2) return plans;
  const selectedPlanId = readSelectedTravelerTripPlanId();
  const selectedIndex = selectedPlanId
    ? plans.findIndex((plan) => plan.id === selectedPlanId)
    : -1;
  if (selectedIndex >= 0) return moveToFront(plans, selectedIndex);

  const today = territoryDate(new Date());
  const dated = plans
    .map((plan, index) => ({ index, date: normalizeDate(plan.date) }))
    .filter((entry): entry is { index: number; date: string } => Boolean(entry.date));
  const upcoming = dated
    .filter((entry) => entry.date >= today)
    .sort((left, right) => left.date.localeCompare(right.date))[0];
  if (upcoming) return moveToFront(plans, upcoming.index);

  const latestPast = dated.sort((left, right) =>
    right.date.localeCompare(left.date),
  )[0];
  return latestPast ? moveToFront(plans, latestPast.index) : plans;
}

function moveToFront<T>(items: T[], index: number) {
  if (index <= 0) return items;
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}

function normalizeDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : "";
}

function territoryDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}
