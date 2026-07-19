"use client";

import { useEffect, useMemo, useState } from "react";
import type { LineString } from "geojson";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import L from "leaflet";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Clock3, MapPin, Route } from "lucide-react";
import type { EstateRecord, IslandCode } from "@/types/usvi";

type Props = {
  island: IslandCode;
  fromEstate: EstateRecord | null;
  toEstate: EstateRecord | null;
};

const ISLAND_VIEW: Record<IslandCode, { center: LatLngExpression; zoom: number }> = {
  stt: { center: [18.336, -64.93], zoom: 12 },
  stj: { center: [18.34, -64.75], zoom: 12 },
  stx: { center: [17.746, -64.747], zoom: 11 },
};

export function RoutePreviewMap({ island, fromEstate, toEstate }: Props) {
  const [geometry, setGeometry] = useState<LineString | null>(null);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    setGeometry(null); setDistanceMeters(0); setDurationSeconds(0); setRouteError(null);
    if (!fromEstate || !toEstate) return;
    const controller = new AbortController();
    async function loadRoute() {
      setLoading(true);
      try {
        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: fromEstate!.internalPoint, to: toEstate!.internalPoint }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.geometry?.type !== "LineString") throw new Error(payload?.error ?? "Road route unavailable.");
        setGeometry(payload.geometry as LineString);
        setDistanceMeters(Number(payload.distanceMeters) || 0);
        setDurationSeconds(Number(payload.durationSeconds) || 0);
      } catch (error) {
        if (controller.signal.aborted) return;
        setRouteError(error instanceof Error ? error.message : "Road route unavailable.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    loadRoute();
    return () => controller.abort();
  }, [fromEstate, toEstate]);

  const routePoints = useMemo<LatLngExpression[]>(() => {
    if (geometry) return geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    if (fromEstate && toEstate) return [[fromEstate.internalPoint.lat, fromEstate.internalPoint.lng], [toEstate.internalPoint.lat, toEstate.internalPoint.lng]];
    return [];
  }, [geometry, fromEstate, toEstate]);

  const view = ISLAND_VIEW[island] ?? ISLAND_VIEW.stt;
  const ready = Boolean(fromEstate && toEstate);

  return <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-[#061d24] shadow-[0_18px_44px_rgba(4,51,49,.13)]">
    <div className="flex flex-col gap-3 border-b border-white/10 bg-[#043331] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
      <div><div className="text-[10px] font-black uppercase tracking-[.24em] text-amber-300">Live route preview</div><div className="mt-1 text-lg font-black tracking-[-.025em]">{ready ? `${fromEstate!.baseName} → ${toEstate!.baseName}` : "Choose pickup and destination"}</div></div>
      <div className="flex flex-wrap gap-2">
        <Metric icon={Route} label={distanceMeters ? `${(distanceMeters / 1609.344).toFixed(1)} mi` : ready ? "Routing…" : "Route pending"} />
        <Metric icon={Clock3} label={durationSeconds ? `${Math.max(1, Math.round(durationSeconds / 60))} min` : "Drive time"} />
      </div>
    </div>
    <div className="relative h-[280px] w-full sm:h-[330px] lg:h-[360px]">
      <MapContainer center={view.center} zoom={view.zoom} zoomControl={false} className="h-full w-full bg-[#dbe9e4]" preferCanvas touchZoom doubleClickZoom={false}>
        <ZoomControl position="bottomright" />
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {fromEstate ? <EstatePoint estate={fromEstate} label="Pickup" color="#0f766e" /> : null}
        {toEstate ? <EstatePoint estate={toEstate} label="Destination" color="#f59e0b" /> : null}
        {routePoints.length > 1 ? <><Polyline positions={routePoints} pathOptions={{ color: "#ffffff", weight: 9, opacity: .88 }} /><Polyline positions={routePoints} pathOptions={{ color: routeError ? "#f59e0b" : "#0f766e", weight: 5, opacity: 1, dashArray: routeError ? "10 8" : undefined }} /></> : null}
        <FitRoute points={routePoints} fallbackCenter={view.center} fallbackZoom={view.zoom} />
      </MapContainer>
      {!ready ? <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] rounded-2xl border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-[#043331]"><MapPin size={18} /></div><div><div className="text-sm font-black text-[#043331]">Your route will appear here</div><div className="text-xs font-semibold text-slate-500">Select both estates to draw the road route and estimate drive time.</div></div></div></div> : null}
      {loading ? <div className="absolute left-4 top-4 z-[500] rounded-full bg-[#043331] px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white shadow-lg">Finding best road route…</div> : null}
      {routeError && ready ? <div className="absolute left-4 top-4 z-[500] rounded-full bg-amber-100 px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-amber-900 shadow-lg">Direct preview · road route unavailable</div> : null}
    </div>
  </section>;
}

function EstatePoint({ estate, label, color }: { estate: EstateRecord; label: string; color: string }) {
  const point: LatLngExpression = [estate.internalPoint.lat, estate.internalPoint.lng];
  return <CircleMarker center={point} radius={10} pathOptions={{ color: "white", weight: 4, fillColor: color, fillOpacity: 1 }}><Popup><div className="min-w-[150px]"><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div><div className="mt-1 text-base font-black text-[#043331]">{estate.baseName}</div></div></Popup></CircleMarker>;
}

function FitRoute({ points, fallbackCenter, fallbackZoom }: { points: LatLngExpression[]; fallbackCenter: LatLngExpression; fallbackZoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds: LatLngBoundsExpression = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
    } else map.setView(fallbackCenter, fallbackZoom, { animate: true });
  }, [map, points, fallbackCenter, fallbackZoom]);
  return null;
}

function Metric({ icon: Icon, label }: { icon: typeof Route; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.14em]"><Icon size={14} />{label}</span>;
}
