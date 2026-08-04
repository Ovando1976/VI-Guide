"use client";

import Link from "next/link";
import { CheckCircle2, FastForward, Navigation, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";

import {
  buildJourneyMapHref,
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function MissionExecutionControls({
  journey,
  currentStop,
}: {
  journey: JourneyPlan;
  currentStop: IntelligencePlanStop | null;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const navigationHref = useMemo(() => {
    if (!currentStop) return buildJourneyMapHref(journey);
    return currentStop.mapHref ?? buildJourneyMapHref(journey);
  }, [currentStop, journey]);

  function advance(action: "completed" | "skipped") {
    const latest = readJourneyPlans().find((plan) => plan.id === journey.id) ?? journey;
    if (!latest.plan.length) return;

    const [active, ...remaining] = latest.plan;
    const historyLine = `${action === "completed" ? "Completed" : "Skipped"}: ${active.title}`;
    const next: JourneyPlan = {
      ...latest,
      status: "ready",
      plan: remaining,
      notes: [latest.notes, historyLine].filter(Boolean).join("\n").slice(0, 2000),
      updatedAt: new Date().toISOString(),
    };

    upsertJourneyPlan(next);
    setMessage(
      remaining.length
        ? `${active.title} ${action}. Next stop is ${remaining[0].title}.`
        : `${active.title} ${action}. Mission complete.`,
    );
  }

  function replaceStop() {
    if (!currentStop) return;
    const prompt = encodeURIComponent(
      `Replace the current stop ${currentStop.title} in my active mission ${journey.title}. Keep the rest of the itinerary intact, choose a better nearby alternative, and preserve realistic timing and transportation.`,
    );
    window.location.assign(`/map?concierge=open&prompt=${prompt}`);
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">
            Mission execution
          </p>
          <h3 className="mt-2 text-xl font-black">Keep the day moving</h3>
        </div>
        {message ? (
          <p className="max-w-md text-xs font-bold text-teal-700">{message}</p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href={navigationHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#043331] px-4 text-[10px] font-black uppercase tracking-[.15em] text-white"
        >
          <Navigation size={15} /> Navigate
        </Link>
        <button
          type="button"
          disabled={!currentStop}
          onClick={() => advance("completed")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 text-[10px] font-black uppercase tracking-[.15em] text-emerald-900 disabled:opacity-40"
        >
          <CheckCircle2 size={15} /> Complete stop
        </button>
        <button
          type="button"
          disabled={!currentStop}
          onClick={() => advance("skipped")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-[10px] font-black uppercase tracking-[.15em] disabled:opacity-40"
        >
          <FastForward size={15} /> Skip stop
        </button>
        <button
          type="button"
          disabled={!currentStop}
          onClick={replaceStop}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-[10px] font-black uppercase tracking-[.15em] disabled:opacity-40"
        >
          <RefreshCcw size={15} /> Replace stop
        </button>
      </div>
    </section>
  );
}
