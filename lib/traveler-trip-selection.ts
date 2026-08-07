export const TRAVELER_TRIP_SELECTION_STORAGE_KEY =
  "vi-guide.traveler-trip-selection.v1";
export const TRAVELER_TRIP_SELECTION_UPDATED_EVENT =
  "vi-guide-traveler-trip-selection";

// Keep existing trip-aware surfaces in sync without importing journey-planner here
// (which would create a circular dependency once journey-planner honors selection).
const JOURNEY_PLAN_UPDATED_EVENT = "vi-guide-intelligence-plan-saved";

export type TravelerTripSelection = {
  planId: string;
  updatedAt: string;
};

export function normalizeTravelerTripSelection(value: unknown): TravelerTripSelection {
  if (typeof value === "string") {
    return { planId: clean(value), updatedAt: "" };
  }
  if (!value || typeof value !== "object") {
    return { planId: "", updatedAt: "" };
  }
  const candidate = value as Partial<TravelerTripSelection>;
  return {
    planId: clean(candidate.planId),
    updatedAt: normalizeTimestamp(candidate.updatedAt),
  };
}

export function readSelectedTravelerTripSelection(): TravelerTripSelection {
  if (typeof window === "undefined") return { planId: "", updatedAt: "" };
  try {
    const raw = window.localStorage.getItem(TRAVELER_TRIP_SELECTION_STORAGE_KEY);
    if (!raw) return { planId: "", updatedAt: "" };
    try {
      return normalizeTravelerTripSelection(JSON.parse(raw));
    } catch {
      return normalizeTravelerTripSelection(raw);
    }
  } catch {
    return { planId: "", updatedAt: "" };
  }
}

export function readSelectedTravelerTripPlanId() {
  return readSelectedTravelerTripSelection().planId;
}

export function writeSelectedTravelerTripPlanId(
  planId: string,
  updatedAt = new Date().toISOString(),
) {
  const selection = normalizeTravelerTripSelection({ planId, updatedAt });
  if (typeof window === "undefined") return selection.planId;
  try {
    if (selection.planId) {
      window.localStorage.setItem(
        TRAVELER_TRIP_SELECTION_STORAGE_KEY,
        JSON.stringify(selection),
      );
    } else {
      window.localStorage.removeItem(TRAVELER_TRIP_SELECTION_STORAGE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, {
        detail: selection.planId,
      }),
    );
    window.dispatchEvent(new Event(JOURNEY_PLAN_UPDATED_EVENT));
  } catch {
    // Private browsing policies should never prevent a traveler from using My Trip.
  }
  return selection.planId;
}

export function resolveTravelerTripSelection(input: {
  local?: TravelerTripSelection | null;
  remote?: TravelerTripSelection | null;
  availablePlanIds: Iterable<string>;
}): TravelerTripSelection {
  const available = new Set(input.availablePlanIds);
  const local = normalizeTravelerTripSelection(input.local);
  const remote = normalizeTravelerTripSelection(input.remote);
  const candidates = [local, remote]
    .filter((selection) => selection.planId && available.has(selection.planId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return candidates[0] ?? { planId: "", updatedAt: "" };
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

function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}
