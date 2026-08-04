"use client";

import { useEffect } from "react";

import { TravelerWorkspace } from "@/components/traveler/traveler-workspace";
import {
  VI_MAP_FOCUS_EVENT,
  type LivingMapFocusDetail,
} from "@/lib/intelligence/map-focus-events";
import {
  readJourneyPlans,
  upsertJourneyPlan,
} from "@/lib/journey-planner";

export function SyncedTravelerWorkspace() {
  useEffect(() => {
    function handleMapFocus(event: Event) {
      const detail = (event as CustomEvent<LivingMapFocusDetail>).detail;
      if (!detail?.primaryId) return;

      const plans = readJourneyPlans();
      const active = plans[0];
      if (!active?.plan.length) return;

      const selectedIndex = active.plan.findIndex((stop) => {
        const stopId = stop.placeId ?? stop.id;
        return stopId === detail.primaryId || stop.id === detail.primaryId;
      });

      if (selectedIndex <= 0) return;

      const selected = active.plan[selectedIndex];
      const nextPlan = [
        selected,
        ...active.plan.filter((_, index) => index !== selectedIndex),
      ];

      upsertJourneyPlan({
        ...active,
        plan: nextPlan,
        notes: active.notes,
      });
    }

    window.addEventListener(VI_MAP_FOCUS_EVENT, handleMapFocus);
    return () => window.removeEventListener(VI_MAP_FOCUS_EVENT, handleMapFocus);
  }, []);

  return <TravelerWorkspace />;
}
