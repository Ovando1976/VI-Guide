"use client";

import Link from "next/link";
import { AlertTriangle, Car, Loader2, Map, Navigation, Route } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildJourneyMapHref, type JourneyPlan } from "@/lib/journey-planner";

type RouteLeg = {
  fromId: string;
  toId: string;
  fromTitle: string;
  toTitle: string;
  distanceMeters: number;
  durationSeconds: number;
  rideHref: string;
};

type RouteResponse = {
  ok?: boolean;
  distanceMeters?: number;
  durationSeconds?: number;
  error?: string;
};

export function JourneyRouteSummary({ plan }: { plan: JourneyPlan }) {
  const routableStops = useMemo(
    () =>
      plan.plan.filter(
        (stop) => typeof stop.lat === "number" && typeof stop.lng === "number",
      ),
    [plan.plan],
  );
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (routableStops.length < 2) {
      setLegs([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    async function load() {
      const requests = routableStops.slice(0, -1).map(async (from, index) => {
        const to = routableStops[index + 1];
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            from: { lat: from.lat, lng: from.lng },
            to: { lat: to.lat, lng: to.lng },
          }),
        });
        const payload = (await response.json().catch(() => null)) as RouteResponse | null;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || `No route found from ${from.title} to ${to.title}.`);
        }
        return {
          fromId: from.id,
          toId: to.id,
          fromTitle: from.title,
          toTitle: to.title,
          distanceMeters: payload.distanceMeters ?? 0,
          durationSeconds: payload.durationSeconds ?? 0,
          rideHref: buildRideHref(plan.island, from, to),
        } satisfies RouteLeg;
      });

      try {
        setLegs(await Promise.all(requests));
      } catch (routeError) {
        if (!controller.signal.aborted) {
          setError(routeError instanceof Error ? routeError.message : "Route sequencing failed.");
          setLegs([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [plan.island, routableStops]);

  const totalMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const totalSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#d6e3df] bg-[#fffdf8] shadow-[0_18px_52px_rgba(4,51,49,.08)]">
      <div className="grid gap-5 border-b border-[#dce8e4] bg-[linear-gradient(135deg,#073b39,#0b5c57)] p-5 text-white sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="vi-eyebrow text-[#f5c451]">Movement line</p>
          <h2 className="vi-display mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">
            Transportation between every stop.
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/66">
            VI Guide calculates the driving sequence from saved map coordinates and keeps each ride handoff attached to the itinerary.
          </p>
        </div>
        {legs.length ? (
          <div className="rounded-[22px] border border-white/12 bg-white/[.09] px-5 py-4 text-left backdrop-blur lg:min-w-[190px] lg:text-right">
            <div className="vi-eyebrow text-[#8ef0e7]">Route total</div>
            <div className="vi-display mt-2 text-2xl font-bold text-white">
              {formatDistance(totalMeters)}
            </div>
            <div className="mt-1 text-xs font-black uppercase tracking-[.12em] text-white/52">
              about {formatDuration(totalSeconds)}
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-5 sm:p-7">
        {loading ? (
          <div className="flex items-center gap-3 rounded-[22px] border border-[#dce8e4] bg-white p-5 text-sm font-bold text-slate-500">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e9f7f3] text-[#0f766e]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            Calculating the complete route…
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error} The itinerary remains saved and each stop can still be opened individually.</span>
          </div>
        ) : null}

        {!loading && !error && routableStops.length < 2 ? (
          <div className="rounded-[24px] border border-dashed border-[#c9dbd6] bg-white p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f7f3] text-[#0f766e]">
              <Map className="h-6 w-6" />
            </span>
            <p className="vi-display mt-4 text-2xl font-bold">Add at least two mapped destinations</p>
            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-500">
              Stops added from VI Guide detail pages include coordinates automatically, so the movement line can calculate itself as your journey grows.
            </p>
            <Link
              href={buildJourneyMapHref(plan)}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#073b39] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              <Route className="h-4 w-4" /> Open Living Map
            </Link>
          </div>
        ) : null}

        {legs.length ? (
          <div className="space-y-3">
            {legs.map((leg, index) => (
              <article
                key={`${leg.fromId}-${leg.toId}`}
                className="rounded-[24px] border border-[#dce7e3] bg-white p-4 shadow-[0_8px_24px_rgba(4,51,49,.04)] sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#073b39] text-[#8ef0e7] shadow-[0_10px_24px_rgba(4,51,49,.12)]">
                    <Car className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="vi-eyebrow text-[#9b5d12]">Transfer {index + 1}</div>
                    <div className="mt-2 text-base font-black leading-6 text-[#043331]">
                      {leg.fromTitle} <span className="text-[#91aaa5]">→</span> {leg.toTitle}
                    </div>
                    <div className="mt-2 inline-flex rounded-full bg-[#edf6f2] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-[#0f766e]">
                      {formatDistance(leg.distanceMeters)} · about {formatDuration(leg.durationSeconds)}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={leg.rideHref}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f5c451] px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
                      >
                        <Navigation className="h-3.5 w-3.5" /> Plan this ride
                      </Link>
                      <Link
                        href={buildJourneyMapHref(plan)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d6e3df] bg-[#f8f4ea] px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:bg-[#edf6f2]"
                      >
                        <Route className="h-3.5 w-3.5" /> Open trip map
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function buildRideHref(
  island: JourneyPlan["island"],
  from: JourneyPlan["plan"][number],
  to: JourneyPlan["plan"][number],
) {
  const params = new URLSearchParams({
    island,
    pickup: from.title,
    destination: to.title,
  });
  if (typeof from.lat === "number") params.set("fromLat", String(from.lat));
  if (typeof from.lng === "number") params.set("fromLng", String(from.lng));
  if (typeof to.lat === "number") params.set("toLat", String(to.lat));
  if (typeof to.lng === "number") params.set("toLng", String(to.lng));
  return `/mobility?${params.toString()}`;
}

function formatDistance(meters: number) {
  const miles = meters / 1609.344;
  return miles < 0.1 ? "Under 0.1 mi" : `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}
