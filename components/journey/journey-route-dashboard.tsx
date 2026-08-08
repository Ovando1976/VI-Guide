"use client";

import { useEffect, useState } from "react";

import { JourneyRouteSummary } from "@/components/journey/journey-route-summary";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";

export function JourneyRouteDashboard() {
  const [plan, setPlan] = useState<JourneyPlan | null>(null);

  useEffect(() => {
    function refresh() {
      setPlan(readJourneyPlans()[0] ?? null);
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!plan) return null;

  return (
    <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 pb-32 sm:px-6 lg:pl-[330px]">
      <JourneyRouteSummary plan={plan} />
    </div>
  );
}
