"use client";

import { useEffect, useState } from "react";

import { SyncedTravelerWorkspace } from "@/components/traveler/synced-traveler-workspace";
import { WorkspaceReservations } from "@/components/traveler/workspace-reservations";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  importLegacyTripPlans,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";

export function ReservationEnabledWorkspace() {
  const [active, setActive] = useState<JourneyPlan | null>(null);

  useEffect(() => {
    function refresh() {
      const stored = readJourneyPlans();
      const plans = stored.length ? stored : importLegacyTripPlans();
      setActive(plans[0] ?? null);
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      <SyncedTravelerWorkspace />
      {active ? (
        <section className="relative z-10 -mt-20 bg-[#f7f2e7] px-4 pb-28 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <WorkspaceReservations journey={active} />
          </div>
        </section>
      ) : null}
    </>
  );
}
