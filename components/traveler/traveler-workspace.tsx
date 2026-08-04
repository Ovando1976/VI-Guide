"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ItineraryTimeline } from "@/components/intelligence/itinerary-timeline";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  buildJourneyMapHref,
  importLegacyTripPlans,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

const ISLANDS = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

export function TravelerWorkspace() {
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function refresh() {
      const stored = readJourneyPlans();
      setPlans(stored.length ? stored : importLegacyTripPlans());
      setHydrated(true);
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const active = plans[0] ?? null;
  const currentStop = active?.plan[0] ?? null;
  const progress = useMemo(() => {
    if (!active?.plan.length) return 0;
    return active.status === "ready" ? Math.min(25, Math.round(100 / active.plan.length)) : 0;
  }, [active]);

  function openStop(stop: IntelligencePlanStop) {
    const href = stop.mapHref ?? stop.href;
    if (href) window.location.assign(href);
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#f7f2e7] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-48 rounded-[34px] bg-slate-200" />
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="h-[520px] rounded-[30px] bg-slate-200" />
            <div className="h-[520px] rounded-[30px] bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!active) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f2e7] px-4 text-[#043331]">
        <section className="max-w-xl rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Sparkles className="mx-auto h-10 w-10 text-teal-700" />
          <h1 className="mt-5 text-3xl font-black tracking-[-.04em]">Your traveler workspace is ready.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
            Start a mission or build a journey, then return here to manage the complete day.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/mission" className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white">
              Start a mission
            </Link>
            <Link href="/planner" className="rounded-full border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]">
              Open planner
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const mapHref = buildJourneyMapHref(active);
  const conciergePrompt = encodeURIComponent(
    `Continue my active mission ${active.title} on ${ISLANDS[active.island]}. Review the itinerary, focus on ${currentStop?.title ?? "the next useful stop"}, transportation, timing, reservations, and a backup option.`,
  );

  return (
    <main className="min-h-screen bg-[#f7f2e7] pb-28 text-[#043331]">
      <section className="bg-[linear-gradient(145deg,#032f2d,#075e58_62%,#0f8d83)] px-4 py-8 text-white sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">Traveler Workspace</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">{active.title}</h1>
              <p className="mt-3 text-sm font-semibold text-white/65">
                {ISLANDS[active.island]} · {active.date} · {active.plan.length} stops
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={mapHref} className="rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#043331]">
                <Map className="mr-2 inline h-4 w-4" /> Continue mission
              </Link>
              <Link href={`/map?concierge=open&prompt=${conciergePrompt}`} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white">
                <Sparkles className="mr-2 inline h-4 w-4" /> Ask Concierge
              </Link>
            </div>
          </div>
          <div className="mt-7 rounded-full bg-white/10 p-1">
            <div className="h-2 rounded-full bg-[#f5c451] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-black uppercase tracking-[.15em] text-white/45">
            <span>{active.status === "ready" ? "Mission ready" : "Draft journey"}</span>
            <span>{progress}% underway</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Current stop</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">{currentStop?.title ?? "Choose the next stop"}</h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f5f2] text-teal-700"><MapPin size={21} /></span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {currentStop?.summary || "Open the planner or Concierge to add the first destination to this mission."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={currentStop?.mapHref ?? mapHref} className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white">
                <Navigation className="mr-2 inline h-4 w-4" /> Navigate
              </Link>
              {currentStop?.href ? (
                <Link href={currentStop.href} className="rounded-full border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]">
                  View place
                </Link>
              ) : null}
              <Link href={`/map?concierge=open&prompt=${conciergePrompt}`} className="rounded-full border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]">
                Ask about this stop
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] bg-[#06131b] p-4 shadow-xl sm:p-6">
            <ItineraryTimeline plan={active.plan} onSelectStop={openStop} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[radial-gradient(circle_at_20%_20%,rgba(245,196,81,.28),transparent_35%),linear-gradient(145deg,#073c39,#0d766e)] p-6 text-white">
              <Map className="h-7 w-7 text-[#f5c451]" />
              <h2 className="mt-10 text-2xl font-black tracking-[-.04em]">Living Map</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/65">Open the mission route with its current destination and itinerary context already attached.</p>
              <Link href={mapHref} className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#043331]">Open full map</Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-teal-700" />
              <h2 className="text-xl font-black">Reservations</h2>
            </div>
            <div className="mt-5 rounded-2xl bg-[#f8f4ea] p-4">
              <p className="text-sm font-black">No linked reservation summary yet</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Booking-aware stops remain available inside the timeline and existing booking flows.</p>
              <Link href="/bookings" className="mt-4 inline-flex text-[10px] font-black uppercase tracking-[.14em] text-teal-700">Review bookings →</Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-amber-600" /><h2 className="text-xl font-black">Quick Concierge</h2></div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">The Concierge opens with the current mission, next stop, island, and timing request already supplied.</p>
            <div className="mt-5 grid gap-2">
              <Link href={`/map?concierge=open&prompt=${conciergePrompt}`} className="rounded-2xl bg-[#043331] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[.16em] text-white">Optimize this mission</Link>
              <Link href={`/map?concierge=open&prompt=${encodeURIComponent(`Find food near ${currentStop?.title ?? ISLANDS[active.island]} and keep my mission timing realistic.`)}`} className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[.16em]">Find food nearby</Link>
              <Link href={`/mobility?island=${active.island}${currentStop ? `&destinationName=${encodeURIComponent(currentStop.title)}` : ""}`} className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[.16em]">Request transportation</Link>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
            <Metric icon={Clock3} label="Stops" value={String(active.plan.length)} />
            <Metric icon={CheckCircle2} label="Status" value={active.status === "ready" ? "Ready" : "Draft"} />
            <Metric icon={MapPin} label="Island" value={active.island.toUpperCase()} />
          </section>
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-center shadow-sm">
      <Icon className="mx-auto h-4 w-4 text-teal-700" />
      <div className="mt-3 text-lg font-black">{value}</div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</div>
    </div>
  );
}
