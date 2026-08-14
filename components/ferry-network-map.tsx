"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import {
  CAR_BARGE_ROUTES,
  FERRY_PORT_COORDINATES,
  FERRY_PORTS,
  FERRY_ROUTES,
  type FerryMode,
  type FerryRoute,
} from "@/lib/ferry-planner";

type FerryNetworkMapProps = {
  mode: FerryMode;
  selectedRouteId: string | null;
  onSelect: (route: FerryRoute) => void;
};

function routePairKey(route: FerryRoute) {
  return [route.from, route.to].sort().join(":");
}

function RouteViewport({ route }: { route: FerryRoute | null }) {
  const map = useMap();

  useEffect(() => {
    if (!route) return;
    const from = FERRY_PORT_COORDINATES[route.from];
    const to = FERRY_PORT_COORDINATES[route.to];
    map.fitBounds(
      [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      { animate: true, padding: [54, 54], maxZoom: 12 },
    );
  }, [map, route]);

  return null;
}

export function FerryNetworkMap({
  mode,
  selectedRouteId,
  onSelect,
}: FerryNetworkMapProps) {
  const routes = mode === "car-barge" ? CAR_BARGE_ROUTES : FERRY_ROUTES;
  const selectedRoute =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0] ?? null;

  const visibleRoutes = useMemo(() => {
    const pairs = new Map<string, FerryRoute>();
    for (const route of routes) {
      const key = routePairKey(route);
      const current = pairs.get(key);
      if (!current || route.id === selectedRouteId) pairs.set(key, route);
    }
    return [...pairs.values()].sort((left, right) => {
      if (left.id === selectedRouteId) return 1;
      if (right.id === selectedRouteId) return -1;
      return left.durationMinutes - right.durationMinutes;
    });
  }, [routes, selectedRouteId]);

  const visiblePortIds = useMemo(
    () => new Set(routes.flatMap((route) => [route.from, route.to])),
    [routes],
  );

  return (
    <div className="relative h-[280px] overflow-hidden bg-[#dcefeb] sm:h-[340px]">
      <MapContainer
        center={[18.36, -64.72]}
        zoom={9}
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

        {visibleRoutes.map((route) => {
          const from = FERRY_PORT_COORDINATES[route.from];
          const to = FERRY_PORT_COORDINATES[route.to];
          const selected = routePairKey(route) === routePairKey(selectedRoute ?? route);
          const color = selected
            ? "#f5c451"
            : route.requiresPassport
              ? "#f97316"
              : "#0b817b";
          return (
            <Polyline
              key={routePairKey(route)}
              positions={[
                [from.lat, from.lng],
                [to.lat, to.lng],
              ]}
              pathOptions={{
                color,
                weight: selected ? 6 : 4,
                opacity: selected ? 1 : 0.72,
                dashArray: route.requiresPassport ? "8 7" : undefined,
                lineCap: "round",
              }}
              eventHandlers={{ click: () => onSelect(route) }}
            >
              <Tooltip sticky>
                {route.fromLabel} → {route.toLabel}
              </Tooltip>
            </Polyline>
          );
        })}

        {FERRY_PORTS.filter((port) => visiblePortIds.has(port.id)).map((port) => {
          const point = FERRY_PORT_COORDINATES[port.id];
          const active =
            selectedRoute?.from === port.id || selectedRoute?.to === port.id;
          return (
            <CircleMarker
              key={port.id}
              center={[point.lat, point.lng]}
              radius={active ? 8 : 5}
              pathOptions={{
                color: active ? "#043331" : "#0b817b",
                fillColor: active ? "#f5c451" : "#ffffff",
                fillOpacity: 1,
                weight: active ? 3 : 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -7]}>
                <strong>{port.label}</strong>
                <br />
                {port.island}
              </Tooltip>
            </CircleMarker>
          );
        })}

        <RouteViewport route={selectedRoute} />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-2 bg-[linear-gradient(180deg,rgba(4,51,49,.82),rgba(4,51,49,.12),transparent)] px-3 pb-12 pt-3 text-white sm:px-4 sm:pt-4">
        <span className="rounded-full border border-white/20 bg-[#043331]/82 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] backdrop-blur">
          Live geographic map
        </span>
        <span className="rounded-full border border-white/20 bg-[#043331]/82 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] backdrop-blur">
          Tap a route line
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-[.1em] text-[#043331]">
        <span className="rounded-full bg-white/90 px-2.5 py-1.5 shadow">USVI route</span>
        {mode === "passenger" ? (
          <span className="rounded-full bg-white/90 px-2.5 py-1.5 shadow">
            Orange = passport route
          </span>
        ) : null}
      </div>
    </div>
  );
}
