import { scopeRiderBookingsToJourneyPlans } from "@/lib/traveler-ride-scope";

const SCOPE_UPDATED_EVENT = "vi-guide:rider-booking-scope-updated";

let activeJourneyPlanIds: string[] | null = null;

export function setRiderBookingSubscriptionScope(
  planIds: Iterable<string> | null,
) {
  activeJourneyPlanIds = planIds ? Array.from(planIds) : null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SCOPE_UPDATED_EVENT));
  }
}

export function scopeRiderBookingSubscription<T extends {
  journeyPlanId?: string | null;
}>(bookings: T[]) {
  return scopeRiderBookingsToJourneyPlans(bookings, activeJourneyPlanIds);
}

export function subscribeToRiderBookingScopeUpdates(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(SCOPE_UPDATED_EVENT, callback);
  return () => window.removeEventListener(SCOPE_UPDATED_EVENT, callback);
}
