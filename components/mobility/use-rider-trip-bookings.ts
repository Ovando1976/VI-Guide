"use client";

import { useEffect, useMemo, useState } from "react";

import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import {
  JOURNEY_PLANS_STORAGE_KEY,
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";
import { normalizeMobilityJourneyPlanId } from "@/lib/mobility-trip-continuity";
import { scopeRiderBookingsToJourneyPlans } from "@/lib/traveler-ride-scope";
import {
  buildTravelerTripScopes,
  resolveTravelerTripScope,
} from "@/lib/traveler-trip-scope";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_STORAGE_KEY,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
} from "@/lib/traveler-trip-selection";
import type { RideBooking } from "@/types/mobility";

/**
 * Account ride subscriptions remain generic. My Trip opts into this hook so
 * live ride cards, driver tracking, history, and cancellation all use the same
 * active JourneyPlan scope as the rest of the traveler workspace.
 */
export function useRiderTripBookings(riderId: string) {
  const [accountBookings, setAccountBookings] = useState<RideBooking[]>([]);
  const [activePlanIds, setActivePlanIds] = useState<string[] | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToRiderBookings(
      riderId,
      (bookings) => {
        setAccountBookings(bookings);
        setError(null);
      },
      (subscriptionError) => {
        console.error("rider trip booking listener error", subscriptionError);
        setError(subscriptionError.message);
      },
    );
  }, [riderId]);

  useEffect(() => {
    function refreshScope() {
      const plans = readJourneyPlans();
      if (!plans.length) {
        setActivePlanIds(null);
        return;
      }

      const queryPlanId = normalizeMobilityJourneyPlanId(
        new URLSearchParams(window.location.search).get("trip"),
      );
      const selectedPlanId =
        queryPlanId || readSelectedTravelerTripPlanId();
      const scope = resolveTravelerTripScope(
        buildTravelerTripScopes(plans),
        selectedPlanId,
      );
      setActivePlanIds(scope?.planIds ?? null);
    }

    function handleStorage(event: StorageEvent) {
      if (
        !event.key ||
        event.key === JOURNEY_PLANS_STORAGE_KEY ||
        event.key === TRAVELER_TRIP_SELECTION_STORAGE_KEY
      ) {
        refreshScope();
      }
    }

    refreshScope();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshScope);
    window.addEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, refreshScope);
    window.addEventListener("popstate", refreshScope);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshScope);
      window.removeEventListener(
        TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
        refreshScope,
      );
      window.removeEventListener("popstate", refreshScope);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const bookings = useMemo(
    () =>
      activePlanIds === undefined
        ? []
        : scopeRiderBookingsToJourneyPlans(accountBookings, activePlanIds),
    [accountBookings, activePlanIds],
  );

  return {
    bookings,
    error,
    scopeReady: activePlanIds !== undefined,
    activePlanIds: activePlanIds ?? [],
  };
}
