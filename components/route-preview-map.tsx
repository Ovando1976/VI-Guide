"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, MapPin, Route } from "lucide-react";

import type { EstateRecord, IslandCode } from "@/types/usvi";

type Props = {
  island: IslandCode;
  fromEstate: EstateRecord | null;
  toEstate: EstateRecord | null;
};

type RouteGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

const ISLAND_LABELS: Record<IslandCode, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

export function RoutePreviewMap({ island, fromEstate, toEstate }: Props) {
  const [geometry, setGeometry] = useState<RouteGeometry | null>(null);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    setGeometry(null);
    setDistanceMeters(0);
    setDurationSeconds(0);
    setRouteError(null);

    if (!fromEstate || !toEstate) return;

    const originPoint = fromEstate.internalPoint;
    const destinationPoint = toEstate.internalPoint;
    const controller = new AbortController();

    async function loadRoute() {
      setLoading(true);
      try {
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: originPoint,
            to: destinationPoint,
          }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.geometry?.type !== "LineString") {
          throw new Error(payload?.error ?? "Road route unavailable.");
        }
        setGeometry(payload.geometry as RouteGeometry);
        setDistanceMeters(Number(payload.distanceMeters) || 0);
        setDurationSeconds(Number(payload.durationSeconds) || 0);
      } catch (error) {
        if (controller.signal.aborted) return;
        setRouteError(
          error instanceof Error ? error.message : "Road route unavailable.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadRoute();
    return () => controller.abort();
  }, [fromEstate, toEstate]);

  const ready = Boolean(fromEstate && toEstate);
  const mapUrl = useMemo(() => {
    if (!fromEstate || !toEstate) return `/map?island=${island}`;
    const params = new URLSearchParams({
      island,
      from: fromEstate.geoid,
      to: toEstate.geoid,
    });
    return `/map?${params.toString()}`;
  }, [fromEstate, island, toEstate]);

  const routeShape = useMemo(() => {
    const coordinates = geometry?.coordinates ?? [];
    if (coordinates.length < 2) return null;

    const lngs = coordinates.map(([lng]) => lng);
    const lats = coordinates.map(([, lat]) => lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lngSpan = Math.max(maxLng - minLng, 0.0001);
    const latSpan = Math.max(maxLat - minLat, 0.0001);

    return coordinates
      .filter((_, index) => index % Math.max(1, Math.floor(coordinates.length / 80)) === 0)
      .map(([lng, lat]) => {
        const x = 8 + ((lng - minLng) / lngSpan) * 84;
        const y = 92 - ((lat - minLat) / latSpan) * 84;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [geometry]);

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[#061d24] shadow-[0_18px_44px_rgba(4,51,49,.13)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#043331] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">
            Live route preview
          </div>
          <div className="mt-1 text-lg font-black tracking-[-.025em]">
            {ready
              ? `${fromEstate?.baseName} → ${toEstate?.baseName}`
              : `Choose a route on ${ISLAND_LABELS[island]}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Metric
            icon={Route}
            label={
              distanceMeters
                ? `${(distanceMeters / 1609.344).toFixed(1)} mi`
                : ready
                  ? loading
                    ? "Routing…"
                    : "Route pending"
                  : "Route pending"
            }
          />
          <Metric
            icon={Clock3}
            label={
              durationSeconds
                ? `${Math.max(1, Math.round(durationSeconds / 60))} min`
                : "Drive time"
            }
          />
        </div>
      </div>

      <div className="relative min-h-[300px] overflow-hidden bg-[radial-gradient(circle_at_18%_25%,rgba(45,212,191,.2),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(245,196,81,.16),transparent_25%),linear-gradient(145deg,#0a2930,#113f43)] p-5 sm:p-7">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative grid min-h-[250px] place-items-center rounded-[24px] border border-white/10 bg-black/10 p-4">
          {ready ? (
            <div className="w-full max-w-2xl">
              <svg
                viewBox="0 0 100 100"
                className="h-[190px] w-full overflow-visible"
                role="img"
                aria-label={`Route preview from ${fromEstate?.baseName} to ${toEstate?.baseName}`}
              >
                <path
                  d="M 10 84 C 28 68, 35 36, 55 48 S 76 74, 90 18"
                  fill="none"
                  stroke="rgba(255,255,255,.2)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {routeShape ? (
                  <polyline
                    points={routeShape}
                    fill="none"
                    stroke={routeError ? "#f5c451" : "#5eead4"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M 10 84 C 28 68, 35 36, 55 48 S 76 74, 90 18"
                    fill="none"
                    stroke={routeError ? "#f5c451" : "#5eead4"}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={routeError ? "5 4" : undefined}
                  />
                )}
                <circle cx="10" cy="84" r="4.5" fill="#14b8a6" stroke="white" strokeWidth="2" />
                <circle cx="90" cy="18" r="4.5" fill="#f5c451" stroke="white" strokeWidth="2" />
              </svg>

              <div className="grid gap-3 sm:grid-cols-2">
                <RoutePoint label="Pickup" name={fromEstate?.baseName ?? "Pickup"} />
                <RoutePoint label="Destination" name={toEstate?.baseName ?? "Destination"} />
              </div>
            </div>
          ) : (
            <div className="max-w-md text-center text-white">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f5c451] text-[#043331] shadow-xl">
                <MapPin size={24} />
              </span>
              <h3 className="mt-5 text-xl font-black">Your route will appear here</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
                Select both estates to calculate the regulated fare, distance, and estimated drive time.
              </p>
            </div>
          )}
        </div>

        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-white/55">
            {loading
              ? "Calculating the best available road route…"
              : routeError && ready
                ? "Road routing is temporarily unavailable; the booking flow remains usable."
                : "Route details update automatically as you make selections."}
          </div>
          <a
            href={mapUrl}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em] text-white transition hover:bg-white/15"
          >
            Open territory map <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}

function RoutePoint({ label, name }: { label: string; name: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.08] p-4 text-white backdrop-blur">
      <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/45">
        {label}
      </div>
      <div className="mt-1 text-sm font-black">{name}</div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
}: {
  icon: typeof Route;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em]">
      <Icon size={14} />
      {label}
    </span>
  );
}
