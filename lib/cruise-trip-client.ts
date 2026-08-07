"use client";

import type { CruiseSailing } from "@/lib/cruise-inventory/types";
import {
  CRUISE_TRIP_STORAGE_KEY,
  CRUISE_TRIP_UPDATED_EVENT,
  buildShoreExcursionHref,
  createCanonicalCruiseTrip,
  cruiseMemoryFromJourneyPlan,
  materializeCruiseJourneyPlans,
  type CanonicalCruiseTrip,
} from "@/lib/cruise-trip";
import { patchIntelligenceMemory } from "@/lib/intelligence/client";
import {
  readJourneyPlans,
  writeJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";

export type CruiseTripSelectionResult = {
  trip: CanonicalCruiseTrip;
  plans: JourneyPlan[];
  firstPortDayHref?: string;
};

export function selectCruiseSailing(
  sailing: CruiseSailing,
): CruiseTripSelectionResult {
  const trip = createCanonicalCruiseTrip(sailing);
  const plans = materializeCruiseJourneyPlans(trip);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CRUISE_TRIP_STORAGE_KEY, JSON.stringify(trip));
    window.dispatchEvent(
      new CustomEvent(CRUISE_TRIP_UPDATED_EVENT, { detail: trip }),
    );
  }

  if (plans.length) {
    const existing = readJourneyPlans().filter(
      (plan) => !plan.notes.includes(`\"cruiseTripId\":\"${trip.id}\"`),
    );
    writeJourneyPlans([...plans, ...existing].slice(0, 24));

    const cruise = cruiseMemoryFromJourneyPlan(plans[0]);
    if (cruise) {
      patchIntelligenceMemory({
        preferredIsland: plans[0].island,
        cruise,
        activeTrip: undefined,
      });
    }
  }

  const firstUsviCall = trip.portCalls.find((call) => call.island);
  return {
    trip,
    plans,
    ...(firstUsviCall
      ? { firstPortDayHref: buildShoreExcursionHref(trip, firstUsviCall) }
      : {}),
  };
}

export function readSelectedCruiseTrip(): CanonicalCruiseTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CRUISE_TRIP_STORAGE_KEY);
    return value ? (JSON.parse(value) as CanonicalCruiseTrip) : null;
  } catch {
    return null;
  }
}
