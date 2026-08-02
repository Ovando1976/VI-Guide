"use client";

import { useEffect, useMemo, useState } from "react";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { Clock3, ExternalLink, MapPin, Route } from "lucide-react";

import "leaflet/dist/leaflet.css";

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

type IslandView = {
  center: LatLngExpression;
  zoom: number;
};

const ISLAND_LABELS: Record<IslandCode, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const ISLAND_VIEW: Record<IslandCode, IslandView> = {
  stt: { center: [18.336, -64.93], zoom: 12 },
  stj: { center: [18.34, -64.75], zoom: 12 },
  stx: { center: [17.746, -64.747], zoom: 11 },
};

const PICKUP_ICON = makeEndpointIcon("#0f766e", "P");
const DESTINATION_ICON = makeEndpointIcon("#e9ad32", "D");

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

  const routedLatLngs = useMemo<LatLngExpression[]>(() => {
    if (!geometry?.coordinates?.length) return [];
    return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }, [geometry]);

  const endpointLatLngs = useMemo<LatLngExpression[]>(() => {
    if (!fromEstate || !toEstate) return [];
    return [
      [fromEstate.internalPoint.lat, fromEstate.internalPoint.lng],
      [toEstate.internalPoint.lat, toEstate.internalPoint.lng],
    ];
  }, [fromEstate, toEstate]);

  const visibleRoute = routedLatLngs.length > 1 ? routedLatLngs : endpointLatLngs;
  const hasRoadRoute = routedLatLngs.length > 1;

  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[#061d24] shadow-[0_18px_44px_rgba(4,51,49,.13)]">
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#043331] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">
            Live road map
          </div>
          <div className="mt-1 truncate text-lg font-black tracking-[-.025em]">
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
                : ready && loading
                  ? "Calculating…"
                  : "Drive time"
            }
          />
        </div>
      </div>

      <div className="relative h-[320px] overflow-hidden bg-[#dcefeb] sm:h-[360px]">
        <MapContainer
          key={island}
          center={ISLAND_VIEW[island].center}
          zoom={ISLAND_VIEW[island].zoom}
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          className="h-full w-full"
          preferCanvas
        >
          <TileLayer
            attribution="© OpenStreetMap contributors © CARTO"
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
            keepBuffer={4}
          />
          <ZoomControl position="bottomright" />

          {visibleRoute.length > 1 ? (
            <>
              <Polyline
                positions={visibleRoute}
                pathOptions={{
                  color: "#ffffff",
                  weight: 10,
                  opacity: 0.88,
                  lineCap: "round",
                  lineJoin: "round",
                  dashArray: hasRoadRoute ? undefined : "8 8",
                }}
              />
              <Polyline
                positions={visibleRoute}
                pathOptions={{
                  color: routeError ? "#e9ad32" : "#0f766e",
                  weight: 5,
                  opacity: 1,
                  lineCap: "round",
                  lineJoin: "round",
                  dashArray: hasRoadRoute ? undefined : "8 8",
                }}
              />
            </>
          ) : null}

          {fromEstate ? (
            <Marker
              position={[
                fromEstate.internalPoint.lat,
                fromEstate.internalPoint.lng,
              ]}
              icon={PICKUP_ICON}
            />
          ) : null}
          {toEstate ? (
            <Marker
              position={[
                toEstate.internalPoint.lat,
                toEstate.internalPoint.lng,
              ]}
              icon={DESTINATION_ICON}
            />
          ) : null}

          <RouteViewport
            island={island}
            routeLatLngs={visibleRoute}
            ready={ready}
          />
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-3 bg-[linear-gradient(180deg,rgba(4,51,49,.78),rgba(4,51,49,.18),transparent)] px-4 pb-10 pt-4 text-white">
          <div className="rounded-full border border-white/20 bg-[#043331]/72 px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] backdrop-blur">
            {loading
              ? "Calculating road route"
              : hasRoadRoute
                ? "Road route ready"
                : ready
                  ? "Direct fallback shown"
                  : "Territory overview"}
          </div>
        </div>

        {!ready ? (
          <div className="pointer-events-none absolute inset-0 z-[450] grid place-items-center bg-[#043331]/18 p-5">
            <div className="max-w-sm rounded-[24px] border border-white/80 bg-white/94 p-5 text-center text-[#043331] shadow-[0_20px_60px_rgba(4,51,49,.22)] backdrop-blur">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f5c451] text-[#043331] shadow-lg">
                <MapPin size={22} />
              </span>
              <h3 className="mt-4 text-lg font-black">Build your island route</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Select pickup and destination estates to draw the real road route and calculate drive time.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-[linear-gradient(145deg,#0a2930,#113f43)] p-4 sm:p-5">
        {ready ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <RoutePoint label="Pickup" name={fromEstate?.baseName ?? "Pickup"} tone="pickup" />
            <RoutePoint
              label="Destination"
              name={toEstate?.baseName ?? "Destination"}
              tone="destination"
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-2xl text-xs font-semibold leading-5 text-white/60">
            {loading
              ? "Calculating the best available road route…"
              : routeError && ready
                ? `${routeError} A direct location line is shown so you can continue reviewing the trip.`
                : hasRoadRoute
                  ? "Distance and drive time come from the current road-routing service."
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

function RouteViewport({
  island,
  routeLatLngs,
  ready,
}: {
  island: IslandCode;
  routeLatLngs: LatLngExpression[];
  ready: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => map.invalidateSize(false), 80);

    if (ready && routeLatLngs.length > 1) {
      map.fitBounds(L.latLngBounds(routeLatLngs), {
        animate: true,
        padding: [42, 42],
        maxZoom: 15,
      });
    } else {
      map.setView(ISLAND_VIEW[island].center, ISLAND_VIEW[island].zoom, {
        animate: true,
      });
    }

    return () => window.clearTimeout(resizeTimer);
  }, [island, map, ready, routeLatLngs]);

  return null;
}

function RoutePoint({
  label,
  name,
  tone,
}: {
  label: string;
  name: string;
  tone: "pickup" | "destination";
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.08] p-4 text-white backdrop-blur">
      <span
        className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white/10 ${
          tone === "pickup" ? "bg-teal-400" : "bg-amber-300"
        }`}
      />
      <div className="min-w-0">
        <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/45">
          {label}
        </div>
        <div className="mt-1 truncate text-sm font-black">{name}</div>
      </div>
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

function makeEndpointIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:40px;height:40px;border-radius:16px 16px 16px 4px;transform:rotate(-45deg);display:grid;place-items:center;background:${color};border:3px solid white;box-shadow:0 10px 24px rgba(4,51,49,.3)"><span style="transform:rotate(45deg);font:900 12px/1 system-ui;color:white">${label}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 35],
  });
}
