"use client";

import Link from "next/link";
import { AlertTriangle, Car, Loader2, Map, Navigation, Route } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { JourneyPlan } from "@/lib/journey-planner";

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
  const signature = routableStops
    .map((stop) => `${stop.id}:${stop.lat}:${stop.lng}`)
    .join("|");
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
  }, [plan.island, signature]);

  const totalMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  const totalSeconds = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
            Route sequence
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">
            Transportation between every stop
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            VI Guide calculates the driving sequence from the saved map coordinates and keeps each ride handoff attached to the itinerary.
          </p>
        </div>
        {legs.length ? (
          <div className="rounded-2xl bg-[#edf6f2] px-4 py-3 text-right">
            <div className="text-[9px] font-black uppercase tracking-[.14em] text-teal-700">
              Route total
            </div>
            <div className="mt-1 text-sm font-black">
              {formatDistance(totalMeters)} · {formatDuration(totalSeconds)}
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Calculating the complete route…
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error} The itinerary remains saved and each stop can still be opened individually.</span>
        </div>
      ) : null}

      {!loading && !error && routableStops.length < 2 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
          <Map className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-3 text-sm font-black">Add at least two mapped destinations</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Stops added from VI Guide detail pages include coordinates automatically.
          </p>
        </div>
      ) : null}

      {legs.length ? (
        <div className="mt-6 space-y-3">
          {legs.map((leg, index) => (
            <article key={`${leg.fromId}-${leg.toId}`} className="rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#043331] text-white">
                  <Car className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
                    Transfer {index + 1}
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {leg.fromTitle} <span className="text-slate-300">→</span> {leg.toTitle}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-500">
                    {formatDistance(leg.distanceMeters)} · about {formatDuration(leg.durationSeconds)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={leg.rideHref} className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]">
                      <Navigation className="h-3.5 w-3.5" /> Plan this ride
                    </Link>
                    <Link href={`/map?island=${plan.island}&trip=${plan.id}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-[.14em]">
                      <Route className="h-3.5 w-3.5" /> Open trip map
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
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
