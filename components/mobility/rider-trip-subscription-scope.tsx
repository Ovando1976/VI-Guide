"use client";

import { useEffect } from "react";

import {
  JOURNEY_PLANS_STORAGE_KEY,
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";
import { normalizeMobilityJourneyPlanId } from "@/lib/mobility-trip-continuity";
import { setRiderBookingSubscriptionScope } from "@/lib/rider-booking-subscription-scope";
import {
  buildTravelerTripScopes,
  resolveTravelerTripScope,
} from "@/lib/traveler-trip-scope";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_STORAGE_KEY,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
} from "@/lib/traveler-trip-selection";

/**
 * Enables JourneyPlan-scoped rider subscriptions only while the My Trip
 * workspace is mounted. Other rider surfaces retain the account-wide view.
 */
export function RiderTripSubscriptionScope() {
  useEffect(() => {
    function refreshScope() {
      const plans = readJourneyPlans();
      if (!plans.length) {
        setRiderBookingSubscriptionScope(null);
        return;
      }

      const queryPlanId = normalizeMobilityJourneyPlanId(
        new URLSearchParams(window.location.search).get("trip"),
      );
      const selectedPlanId = queryPlanId || readSelectedTravelerTripPlanId();
      const scope = resolveTravelerTripScope(
        buildTravelerTripScopes(plans),
        selectedPlanId,
      );
      setRiderBookingSubscriptionScope(scope?.planIds ?? null);
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
      setRiderBookingSubscriptionScope(null);
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshScope);
      window.removeEventListener(
        TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
        refreshScope,
      );
      window.removeEventListener("popstate", refreshScope);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
