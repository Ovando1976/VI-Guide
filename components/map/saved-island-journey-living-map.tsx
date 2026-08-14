"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LineString } from "geojson";
import { ArrowRight, CarFront, LoaderCircle, MapPinned, Ship, Sparkles } from "lucide-react";

import {
  directJourneySegment,
  isFerryWaterSegment,
  joinJourneySegments,
  positionedJourneyStops,
} from "@/lib/island-journey-map";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";
import type { EstateRecord } from "@/types/usvi";

const EstateMap = dynamic(
  () => import("@/components/estate-map").then((module) => module.EstateMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[640px] animate-pulse rounded-[28px] border border-white/10 bg-white/[0.05] md:h-[690px]" />
    ),
  },
);

type RouteState = "idle" | "loading" | "ready" | "partial" | "error";

export function SavedIslandJourneyLivingMap() {
  const searchParams = useSearchParams();
  const requestedTripId = searchParams.get("trip")?.trim() ?? "";
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [estates, setEstates] = useState<EstateRecord[]>([]);
  const [routeGeoJson, setRouteGeoJson] = useState<LineString | null>(null);
  const [routeState, setRouteState] = useState<RouteState>("idle");
  const [routeMessage, setRouteMessage] = useState("Preparing your connected journey…");
  const [routeFocusNonce, setRouteFocusNonce] = useState(0);

  useEffect(() => {
    const sync = () => setPlans(readJourneyPlans());
    sync();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/estates", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error ?? "Estate map unavailable.");
        setEstates(Array.isArray(payload?.estates) ? payload.estates : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setEstates([]);
      });
    return () => controller.abort();
  }, []);

  const plan = useMemo(
    () =>
      plans.find((candidate) => candidate.id === requestedTripId) ??
      plans[0] ??
      null,
    [plans, requestedTripId],
  );

  const stops = useMemo(
    () => (plan ? positionedJourneyStops(plan) : []),
    [plan],
  );

  useEffect(() => {
    if (!plan || stops.length < 2) {
      setRouteGeoJson(null);
      setRouteState(plan ? "error" : "idle");
      setRouteMessage(
        plan
          ? "This saved trip does not yet contain enough positioned waypoints to draw a route."
          : "Choose or save an Island Journey first.",
      );
      return;
    }

    const controller = new AbortController();
    let active = true;

    async function buildRoute() {
      setRouteState("loading");
      setRouteMessage("Routing road transfers and connecting the ferry crossing…");
      const segments: LineString[] = [];
      let usedFallback = false;

      for (let index = 0; index < stops.length - 1; index += 1) {
        if (!active) return;
        const from = stops[index];
        const to = stops[index + 1];

        if (isFerryWaterSegment(from, to)) {
          segments.push(directJourneySegment(from, to));
          continue;
        }

        try {
          const response = await fetch("/api/route", {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              from: { lat: from.lat, lng: from.lng },
              to: { lat: to.lat, lng: to.lng },
            }),
          });
          const payload = await response.json().catch(() => null);
          if (
            !response.ok ||
            payload?.geometry?.type !== "LineString" ||
            !Array.isArray(payload.geometry.coordinates)
          ) {
            throw new Error(payload?.error ?? "Road route unavailable.");
          }
          segments.push(payload.geometry as LineString);
        } catch (error) {
          if (controller.signal.aborted) return;
          usedFallback = true;
          segments.push(directJourneySegment(from, to));
        }
      }

      if (!active) return;
      const joined = joinJourneySegments(segments);
      if (!joined) {
        setRouteGeoJson(null);
        setRouteState("error");
        setRouteMessage("The complete journey could not be drawn.");
        return;
      }

      setRouteGeoJson(joined);
      setRouteFocusNonce((value) => value + 1);
      setRouteState(usedFallback ? "partial" : "ready");
      setRouteMessage(
        usedFallback
          ? "Journey shown. One or more ground segments use a straight-line fallback because roadway routing was unavailable."
          : "Complete taxi + ferry + taxi journey is mapped.",
      );
    }

    void buildRoute();
    return () => {
      active = false;
      controller.abort();
    };
  }, [plan, stops]);

  if (!plan) {
    return (
      <EmptyJourney />
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#043331] p-5 text-white shadow-[0_24px_70px_rgba(4,51,49,.18)] md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]">
              <MapPinned className="h-4 w-4" /> Living Map · Island Journey
            </div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em] md:text-4xl">
              {plan.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/68">
              {routeMessage}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/journey"
              className="rounded-full border border-white/15 bg-white/[.08] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.13em] text-white"
            >
              Edit journey
            </Link>
            <Link
              href="/trips"
              className="rounded-full bg-[#f5c451] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.13em] text-[#043331]"
            >
              My Trip
            </Link>
            <Link
              href={`/concierge?prompt=${encodeURIComponent(`Coordinate my saved Island Journey ${plan.title}. Review the mapped taxi and ferry connections, timing, and any risks before travel.`)}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.13em] text-white"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#f5c451]" /> Concierge
            </Link>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusPill state={routeState} />
          <span className="rounded-full border border-white/12 bg-white/[.07] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white/70">
            {stops.length} positioned waypoints
          </span>
          <span className="rounded-full border border-white/12 bg-white/[.07] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white/70">
            {plan.date}
          </span>
        </div>
      </section>

      <EstateMap
        island={plan.island}
        estates={estates}
        places={[]}
        activeLens="places"
        focusedPlaceId={null}
        selectedEstateGeoid={null}
        fromGeoid=""
        toGeoid=""
        routeGeoJson={routeGeoJson}
        routeFocusNonce={routeFocusNonce}
        onSelectEstate={() => undefined}
        onSelectFrom={() => undefined}
        onSelectTo={() => undefined}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stops.map((stop, index) => (
          <JourneyWaypoint
            key={stop.id}
            stop={stop}
            index={index}
            last={index === stops.length - 1}
          />
        ))}
      </section>
    </div>
  );
}

function JourneyWaypoint({
  stop,
  index,
  last,
}: {
  stop: IntelligencePlanStop;
  index: number;
  last: boolean;
}) {
  const ferry = stop.kind.includes("ferry");
  const Icon = ferry ? Ship : CarFront;
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e6f5f2] text-[#08746f]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
          Stop {index + 1}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-black text-[#043331]">{stop.title}</h3>
      <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-500">
        {stop.summary}
      </p>
      {!last ? (
        <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-[#b7861f]">
          Continue <ArrowRight className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </article>
  );
}

function StatusPill({ state }: { state: RouteState }) {
  const label =
    state === "loading"
      ? "Building route"
      : state === "ready"
        ? "Route ready"
        : state === "partial"
          ? "Route partly estimated"
          : state === "error"
            ? "Route needs attention"
            : "Route standby";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#7ce0d4]/25 bg-[#7ce0d4]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-[#a6efe7]">
      {state === "loading" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
      {label}
    </span>
  );
}

function EmptyJourney() {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-8 text-[#043331] shadow-sm">
      <MapPinned className="h-8 w-8 text-[#0b817b]" />
      <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">No saved Island Journey yet.</h2>
      <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Build an inter-island journey first. USVI Explorer will save the origin, both ferry terminals, and destination so the complete route can be drawn here.
      </p>
      <Link
        href="/journey"
        className="mt-6 inline-flex rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white"
      >
        Build Island Journey
      </Link>
    </section>
  );
}
