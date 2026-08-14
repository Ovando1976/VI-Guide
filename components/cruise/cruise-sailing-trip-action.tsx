"use client";

import Link from "next/link";
import { ArrowRight, CalendarPlus2, CheckCircle2, MapPinned } from "lucide-react";
import { useState } from "react";

import type { CruiseSailing } from "@/lib/cruise-inventory/types";
import {
  selectCruiseSailing,
  type CruiseTripSelectionResult,
} from "@/lib/cruise-trip-client";

export function CruiseSailingTripAction({ sailing }: { sailing: CruiseSailing }) {
  const [selection, setSelection] = useState<CruiseTripSelectionResult | null>(null);

  function select() {
    setSelection(selectCruiseSailing(sailing));
  }

  if (selection) {
    return (
      <div className="mt-5 rounded-[20px] border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[.13em] text-emerald-700">
              Sailing connected
            </p>
            <p className="mt-1 text-sm font-black">
              {selection.plans.length
                ? `${selection.plans.length} U.S. Virgin Islands port ${selection.plans.length === 1 ? "day is" : "days are"} now in My Trip.`
                : "This sailing is saved, but no U.S. Virgin Islands port call was detected in its itinerary."}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-emerald-900/70">
              Ship, cruise line, port date, arrival, and a conservative planning all-aboard time now feed USVI Explorer trip continuity.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/planner"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white"
              >
                <MapPinned className="h-4 w-4 text-[#f5c451]" /> My Trip
              </Link>
              {selection.firstPortDayHref ? (
                <Link
                  href={selection.firstPortDayHref}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-emerald-900"
                >
                  Plan first port day <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={select}
      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:-translate-y-0.5"
    >
      <CalendarPlus2 className="h-4 w-4" /> Use this sailing in My Trip
    </button>
  );
}
