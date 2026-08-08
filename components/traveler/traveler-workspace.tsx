"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Navigation,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { ItineraryTimeline } from "@/components/intelligence/itinerary-timeline";
import { LiveMissionStatus } from "@/components/traveler/live-mission-status";
import { MissionExecutionControls } from "@/components/traveler/mission-execution-controls";
import { ProactiveMissionGuide } from "@/components/traveler/proactive-mission-guide";
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

const ISLAND_VISUALS = {
  stt: {
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Virgin Islands harbor and island hills",
  },
  stj: {
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay and the green hills of St. John",
  },
  stx: {
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay shoreline on St. Croix",
  },
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
    if (!active?.plan.length) return active?.status === "ready" ? 100 : 0;
    return active.status === "ready"
      ? Math.min(25, Math.round(100 / active.plan.length))
      : 0;
  }, [active]);

  function openStop(stop: IntelligencePlanStop) {
    const href = stop.mapHref ?? stop.href;
    if (href) window.location.assign(href);
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#f7f2e7] px-4 py-5 text-[#043331] sm:px-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <ViPublicHeader
            actionHref="/concierge"
            actionLabel="Ask VI Concierge"
            actionIcon={Sparkles}
            secondaryHref="/trips"
            secondaryLabel="My Trip"
          />
          <div className="animate-pulse space-y-5" role="status">
            <div className="h-[360px] rounded-[36px] bg-slate-200" />
            <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <div className="h-[520px] rounded-[30px] bg-slate-200" />
              <div className="h-[520px] rounded-[30px] bg-slate-200" />
            </div>
            <span className="sr-only">Loading traveler workspace</span>
          </div>
        </div>
      </main>
    );
  }

  if (!active) {
    return (
      <main className="min-h-screen bg-[#f7f2e7] px-4 py-5 text-[#043331] sm:px-6 lg:py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <ViPublicHeader
            actionHref="/concierge?prompt=Help%20me%20build%20my%20first%20Virgin%20Islands%20trip"
            actionLabel="Ask VI Concierge"
            actionIcon={Sparkles}
            secondaryHref="/"
            secondaryLabel="Home"
          />

          <section className="relative min-h-[520px] overflow-hidden rounded-[38px] shadow-[0_30px_90px_rgba(4,51,49,.24)]">
            <Image
              src="/images/usvi-harbor-hero.jpg"
              alt="Virgin Islands harbor and island hills"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,47,45,.96)_0%,rgba(3,47,45,.82)_46%,rgba(3,47,45,.18)_100%)]" />
            <div className="relative flex min-h-[520px] max-w-3xl flex-col justify-end p-7 text-white sm:p-10 lg:p-14">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778] backdrop-blur">
                <Route className="h-4 w-4" /> Traveler workspace · trip execution
              </div>
              <h1 className="mt-6 text-5xl font-black leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl">
                Your trip becomes a live workspace here.
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                Build an itinerary or start a Concierge mission, then VI Guide can keep the next stop, Living Map, transportation, reservations, and trip decisions in one connected place.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/mission"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.15em] text-[#043331]"
                >
                  <Sparkles className="h-4 w-4" /> Start a mission
                </Link>
                <Link
                  href="/planner"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/18 bg-white/10 px-6 text-[9px] font-black uppercase tracking-[.15em] text-white backdrop-blur"
                >
                  <Route className="h-4 w-4" /> Build itinerary
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <EmptySignal
              icon={Map}
              title="Living Map connected"
              copy="A saved itinerary can open directly on the territory map with route context attached."
            />
            <EmptySignal
              icon={Sparkles}
              title="Concierge aware"
              copy="Mission prompts can carry the island, next stop, timing, transportation, and backup request forward."
            />
            <EmptySignal
              icon={CalendarCheck}
              title="Reservations ready"
              copy="Bookable itinerary stops surface their next reservation action without separating them from the trip."
            />
          </section>
        </div>
      </main>
    );
  }

  const missionComplete = active.status === "ready" && active.plan.length === 0;
  const mapHref = buildJourneyMapHref(active);
  const islandVisual = ISLAND_VISUALS[active.island];
  const conciergePrompt = encodeURIComponent(
    `Continue my active mission ${active.title} on ${ISLANDS[active.island]}. Review the itinerary, focus on ${currentStop?.title ?? "the next useful stop"}, transportation, timing, reservations, and a backup option.`,
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2e7_0%,#fff_48%,#f4f7f5_100%)] pb-28 text-[#043331]">
      <section className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref={`/map?concierge=open&prompt=${conciergePrompt}`}
          actionLabel="Ask VI Concierge"
          actionIcon={Sparkles}
          secondaryHref="/trips"
          secondaryLabel="My Trip"
        />

        <div className="relative mx-auto mt-6 max-w-7xl overflow-hidden rounded-[38px] shadow-[0_30px_90px_rgba(4,51,49,.26)]">
          <Image
            src={islandVisual.image}
            alt={islandVisual.alt}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,47,45,.96)_0%,rgba(3,47,45,.82)_48%,rgba(3,47,45,.2)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(2,29,28,.45))]" />

          <div className="relative grid min-h-[500px] gap-8 p-7 text-white sm:p-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:p-12">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f7d778] backdrop-blur">
                  Traveler workspace · active journey
                </span>
                <span className="rounded-full border border-white/15 bg-black/20 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-white/75 backdrop-blur">
                  {ISLANDS[active.island]} context
                </span>
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[.9] tracking-[-.065em] sm:text-6xl lg:text-7xl">
                {active.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                Your trip, in motion. Keep the next stop, map, timing, reservations, transportation, and Concierge decisions connected as the day changes.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.15em]">
                <SignalChip icon={Map} label="Map connected" />
                <SignalChip icon={Sparkles} label="Concierge aware" />
                <SignalChip icon={ShieldCheck} label="Trip protected" />
                <SignalChip icon={CalendarCheck} label="Reservations connected" />
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={mapHref}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.15em] text-[#043331] shadow-lg"
                >
                  <Map className="h-4 w-4" /> Continue on Living Map
                </Link>
                <Link
                  href={`/map?concierge=open&prompt=${conciergePrompt}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/18 bg-white/10 px-6 text-[9px] font-black uppercase tracking-[.15em] text-white backdrop-blur"
                >
                  <Sparkles className="h-4 w-4" /> Ask Concierge
                </Link>
                <Link
                  href="/trips"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/18 bg-black/15 px-6 text-[9px] font-black uppercase tracking-[.15em] text-white backdrop-blur"
                >
                  <Route className="h-4 w-4" /> Open My Trip
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-[#021d1c]/55 p-5 backdrop-blur-md sm:p-6">
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#f7d778]">
                Active journey context
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <JourneyContext
                  label="Next stop"
                  value={currentStop?.title ?? "Choose the next stop"}
                />
                <JourneyContext label="Trip date" value={active.date} />
                <JourneyContext
                  label="Journey state"
                  value={
                    missionComplete
                      ? "Mission complete"
                      : active.status === "ready"
                        ? "Mission ready"
                        : "Draft journey"
                  }
                />
              </div>
              <div className="mt-6 rounded-full bg-white/10 p-1">
                <div
                  className="h-2 rounded-full bg-[#f5c451] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[8px] font-black uppercase tracking-[.15em] text-white/45">
                <span>{active.plan.length} stops</span>
                <span>{progress}% underway</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:py-10">
        <div className="space-y-6">
          {missionComplete ? (
            <section className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-7 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-700" />
              <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">
                Mission complete
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-emerald-900/70">
                Every active stop has been completed or skipped. The mission history remains saved in your journey notes.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/mission"
                  className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
                >
                  Start another mission
                </Link>
                <Link
                  href="/planner"
                  className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]"
                >
                  Review journey
                </Link>
              </div>
            </section>
          ) : (
            <>
              <LiveMissionStatus journey={active} currentStop={currentStop} />

              <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-[.72fr_1.28fr]">
                  <div className="relative min-h-[220px] overflow-hidden bg-[#043331]">
                    <Image
                      src={islandVisual.image}
                      alt={islandVisual.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 38vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.08),rgba(3,47,45,.78))]" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <div className="text-[8px] font-black uppercase tracking-[.17em] text-[#f7d778]">
                        {ISLANDS[active.island]} context
                      </div>
                      <div className="mt-2 text-sm font-black">
                        Route decisions stay tied to the island map.
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">
                          Current stop
                        </p>
                        <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
                          {currentStop?.title ?? "Choose the next stop"}
                        </h2>
                      </div>
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e8f5f2] text-teal-700">
                        <MapPin size={21} />
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                      {currentStop?.summary ||
                        "Open the planner or Concierge to add the first destination to this mission."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={currentStop?.mapHref ?? mapHref}
                        className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
                      >
                        <Navigation className="mr-2 inline h-4 w-4" /> Navigate
                      </Link>
                      {currentStop?.href ? (
                        <Link
                          href={currentStop.href}
                          className="rounded-full border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]"
                        >
                          View place
                        </Link>
                      ) : null}
                      <Link
                        href={`/map?concierge=open&prompt=${conciergePrompt}`}
                        className="rounded-full border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]"
                      >
                        Ask about this stop
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <ProactiveMissionGuide journey={active} currentStop={currentStop} />

              <MissionExecutionControls journey={active} currentStop={currentStop} />

              <section className="rounded-[32px] bg-[#06131b] p-4 shadow-xl sm:p-6">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[.17em] text-[#f7d778]">
                      Connected itinerary
                    </div>
                    <h2 className="mt-1 text-xl font-black text-white">
                      The rest of the day
                    </h2>
                  </div>
                  <Link
                    href="/planner"
                    className="text-[9px] font-black uppercase tracking-[.14em] text-white/65"
                  >
                    Edit itinerary →
                  </Link>
                </div>
                <ItineraryTimeline plan={active.plan} onSelectStop={openStop} />
              </section>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <section className="relative min-h-[340px] overflow-hidden rounded-[32px] border border-slate-200 bg-[#043331] shadow-lg">
            <Image
              src={islandVisual.image}
              alt={islandVisual.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.08),rgba(3,47,45,.92))]" />
            <div className="relative flex min-h-[340px] flex-col justify-end p-6 text-white">
              <div className="text-[8px] font-black uppercase tracking-[.17em] text-[#f7d778]">
                Living Map · {ISLANDS[active.island]} context
              </div>
              <Map className="mt-4 h-7 w-7 text-[#f5c451]" />
              <h2 className="mt-5 text-3xl font-black tracking-[-.04em]">
                Keep the route visible.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/68">
                Open the mission route with its current destination and itinerary context already attached.
              </p>
              <Link
                href={mapHref}
                className="mt-5 inline-flex w-fit rounded-full bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#043331]"
              >
                Open full map
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-teal-700" />
              <h2 className="text-xl font-black">Reservations</h2>
            </div>
            <div className="mt-5 rounded-2xl bg-[#f8f4ea] p-4">
              <p className="text-sm font-black">Reservation actions stay with the trip</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                Bookable stops, active requests, and existing reservations remain connected to this workspace and the full booking history.
              </p>
              <Link
                href="/bookings"
                className="mt-4 inline-flex text-[10px] font-black uppercase tracking-[.14em] text-teal-700"
              >
                Review bookings →
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-600" />
              <h2 className="text-xl font-black">Quick Concierge</h2>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              The Concierge opens with the current mission, next stop, island, and timing request already supplied.
            </p>
            <div className="mt-5 grid gap-2">
              <Link
                href={`/map?concierge=open&prompt=${conciergePrompt}`}
                className="rounded-2xl bg-[#043331] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[.16em] text-white"
              >
                Optimize this mission
              </Link>
              <Link
                href={`/map?concierge=open&prompt=${encodeURIComponent(`Find food near ${currentStop?.title ?? ISLANDS[active.island]} and keep my mission timing realistic.`)}`}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[.16em]"
              >
                Find food nearby
              </Link>
              <Link
                href={`/mobility?island=${active.island}${currentStop ? `&destinationName=${encodeURIComponent(currentStop.title)}` : ""}`}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[.16em]"
              >
                Request transportation
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3">
            <Metric icon={Clock3} label="Stops" value={String(active.plan.length)} />
            <Metric
              icon={CheckCircle2}
              label="Status"
              value={
                missionComplete
                  ? "Done"
                  : active.status === "ready"
                    ? "Ready"
                    : "Draft"
              }
            />
            <Metric
              icon={MapPin}
              label="Island"
              value={active.island.toUpperCase()}
            />
          </section>
        </aside>
      </section>
    </main>
  );
}

function SignalChip({
  icon: Icon,
  label,
}: {
  icon: typeof Map;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-white/75 backdrop-blur">
      <Icon className="h-3.5 w-3.5 text-[#f7d778]" /> {label}
    </span>
  );
}

function JourneyContext({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[8px] font-black uppercase tracking-[.17em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-sm font-black leading-5 text-white">{value}</div>
    </div>
  );
}

function EmptySignal({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Map;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-5 text-xl font-black tracking-[-.035em]">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-550 text-slate-600">
        {copy}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 text-center shadow-sm">
      <Icon className="mx-auto h-4 w-4 text-teal-700" />
      <div className="mt-3 text-lg font-black">{value}</div>
      <div className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </div>
    </div>
  );
}
