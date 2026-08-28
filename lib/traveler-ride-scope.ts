import { normalizeMobilityJourneyPlanId } from "@/lib/mobility-trip-continuity";

/**
 * Keeps ride UI inside the same saved JourneyPlan scope as My Trip.
 *
 * A missing/empty active scope intentionally preserves the legacy account-wide
 * rider view. Once My Trip has an active scope, a ride must carry one of that
 * scope's JourneyPlan IDs to appear in live controls, history, or cancellation.
 */
export function scopeRiderBookingsToJourneyPlans<
  T extends { journeyPlanId?: string | null },
>(bookings: T[], activePlanIds: Iterable<string> | null | undefined): T[] {
  if (!activePlanIds) return bookings;

  const allowed = new Set(
    Array.from(activePlanIds)
      .map((planId) => normalizeMobilityJourneyPlanId(planId))
      .filter(Boolean),
  );
  if (!allowed.size) return bookings;

  return bookings.filter((booking) => {
    const journeyPlanId = normalizeMobilityJourneyPlanId(booking.journeyPlanId);
    return Boolean(journeyPlanId && allowed.has(journeyPlanId));
  });
}
