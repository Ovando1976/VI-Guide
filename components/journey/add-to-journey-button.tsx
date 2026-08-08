"use client";

import Link from "next/link";
import { Check, Plus, Route } from "lucide-react";
import { useEffect, useState } from "react";

import {
  JOURNEY_PLAN_UPDATED_EVENT,
  addStopToJourney,
  importLegacyTripPlans,
  readJourneyPlans,
  type JourneyStopInput,
} from "@/lib/journey-planner";

export function AddToJourneyButton({
  stop,
  className = "",
}: {
  stop: JourneyStopInput;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    function refresh() {
      setAdded(
        readJourneyPlans().some((plan) =>
          plan.plan.some(
            (candidate) =>
              candidate.placeId === stop.id || candidate.id === `place_${stop.id}`,
          ),
        ),
      );
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [stop.id]);

  function add() {
    importLegacyTripPlans();
    addStopToJourney(stop);
    setAdded(true);
  }

  if (added) {
    return (
      <Link
        href="/planner"
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-100 px-5 text-[10px] font-black uppercase tracking-[.16em] text-emerald-900 transition hover:bg-emerald-200 ${className}`}
      >
        <Check className="h-4 w-4" /> Saved · Open planner
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-[#f8f4ea] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:bg-white ${className}`}
    >
      <Plus className="h-4 w-4" /> <Route className="h-4 w-4" /> Add to trip
    </button>
  );
}
