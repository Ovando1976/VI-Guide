"use client";

import Link from "next/link";
import { Check, Plus, Route } from "lucide-react";
import { useState } from "react";

import { addStopToJourney, type JourneyStopInput } from "@/lib/journey-planner";

export function AddToJourneyButton({
  stop,
  className = "",
}: {
  stop: JourneyStopInput;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  function add() {
    addStopToJourney(stop);
    setAdded(true);
  }

  if (added) {
    return (
      <Link
        href="/planner"
        className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-100 px-5 text-[10px] font-black uppercase tracking-[.16em] text-emerald-900 transition hover:bg-emerald-200 ${className}`}
      >
        <Check className="h-4 w-4" /> Added · View trip
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
