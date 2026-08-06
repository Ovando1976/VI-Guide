"use client";

import { useEffect } from "react";

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
      const activeTrip = summarizeJourneyPlan(readJourneyPlans()[0]);
      if (sameActiveTrip(memory.activeTrip, activeTrip)) return;

      if (activeTrip) {
        replaceIntelligenceMemory({ ...memory, activeTrip });
        return;
      }

      const { activeTrip: _removed, ...remaining } = memory;
      replaceIntelligenceMemory(remaining);
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
