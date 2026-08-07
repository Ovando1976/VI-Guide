"use client";

import { useEffect } from "react";

import { cruiseMemoryFromJourneyPlan } from "@/lib/cruise-trip";
import {
  getIntelligenceMemory,
  replaceIntelligenceMemory,
} from "@/lib/intelligence/client";
import {
  sameActiveTrip,
  summarizeJourneyPlan,
} from "@/lib/intelligence/active-trip";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
} from "@/lib/journey-planner";

export function JourneyIntelligenceSync() {
  useEffect(() => {
    function sync() {
      const memory = getIntelligenceMemory();
      const plan = readJourneyPlans()[0];
      const activeTrip = summarizeJourneyPlan(plan);
      const journeyCruise = cruiseMemoryFromJourneyPlan(plan);
      const activeTripMatches = sameActiveTrip(memory.activeTrip, activeTrip);
      const cruiseMatches =
        JSON.stringify(memory.cruise ?? null) ===
        JSON.stringify(journeyCruise ?? null);

      if (activeTripMatches && (journeyCruise ? cruiseMatches : !memory.cruise?.tripId)) {
        return;
      }

      const next = { ...memory };
      if (activeTrip) next.activeTrip = activeTrip;
      else delete next.activeTrip;

      if (journeyCruise) {
        next.cruise = journeyCruise;
        next.preferredIsland = plan?.island ?? next.preferredIsland;
      } else if (memory.cruise?.tripId) {
        delete next.cruise;
      }

      replaceIntelligenceMemory(next);
    }

    sync();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return null;
}
