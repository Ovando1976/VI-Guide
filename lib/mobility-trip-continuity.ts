export const PENDING_MOBILITY_TRIP_KEY = "vi-guide.pending-mobility-trip";

const JOURNEY_PLAN_ID_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;

export function normalizeMobilityJourneyPlanId(value: unknown) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  return JOURNEY_PLAN_ID_PATTERN.test(normalized) ? normalized : "";
}

export function readPendingMobilityTripPlanId() {
  if (typeof window === "undefined") return "";
  try {
    return normalizeMobilityJourneyPlanId(
      window.sessionStorage.getItem(PENDING_MOBILITY_TRIP_KEY),
    );
  } catch {
    return "";
  }
}

export function rememberPendingMobilityTripPlanId(value: unknown) {
  if (typeof window === "undefined") return "";
  const normalized = normalizeMobilityJourneyPlanId(value);
  try {
    if (normalized) {
      window.sessionStorage.setItem(PENDING_MOBILITY_TRIP_KEY, normalized);
    } else {
      window.sessionStorage.removeItem(PENDING_MOBILITY_TRIP_KEY);
    }
  } catch {
    // Storage restrictions should never block a ride request.
  }
  return normalized;
}

export function clearPendingMobilityTripPlanId() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_MOBILITY_TRIP_KEY);
  } catch {
    // Storage restrictions should never block checkout completion.
  }
}
