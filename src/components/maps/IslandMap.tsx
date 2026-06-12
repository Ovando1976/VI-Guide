import React, { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { IslandCode } from "../../types";

export type MapFilter =
  | "all"
  | "beach"
  | "history"
  | "transport"
  | "food"
  | "event"
  | "attraction";

export type MapPoint = {
  id: string;
  title: string;
  type: Exclude<MapFilter, "all">;
  lat: number;
  lng: number;
  description: string;
};

type IslandMapProps = {
  selectedIsland: IslandCode;
  activeFilter: MapFilter;
  selectedPointId: string | null;
  points: MapPoint[];
  onSelectPoint: (point: MapPoint) => void;
};

export const MAP_FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "beach", label: "Beaches" },
  { id: "history", label: "History" },
  { id: "transport", label: "Transport" },
  { id: "food", label: "Food" },
  { id: "event", label: "Events" },
  { id: "attraction", label: "Attractions" },
];

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  "";

const ISLAND_CENTER: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  st_thomas: { center: [-64.9307, 18.3419], zoom: 12 },
  st_john: { center: [-64.7281, 18.3358], zoom: 12 },
  st_croix: { center: [-64.8348, 17.7246], zoom: 11 },
};

function getColor(type: MapPoint["type"]) {
  if (type === "beach") return "#0891b2";
  if (type === "history") return "#b45309";
  if (type === "transport") return "#059669";
  if (type === "food") return "#dc2626";
  if (type === "event") return "#7c3aed";
  return "#4f46e5";
}

function makeMarkerElement(point: MapPoint, selected: boolean) {
  const el = document.createElement("button");

  el.type = "button";
  el.setAttribute("aria-label", point.title);
  el.className =
    "grid place-items-center rounded-full border-white shadow-xl transition active:scale-95";

  el.style.width = selected ? "30px" : "22px";
  el.style.height = selected ? "30px" : "22px";
  el.style.borderWidth = selected ? "5px" : "3px";
  el.style.background = getColor(point.type);

  return el;
}

export default function IslandMap({
  selectedIsland,
  activeFilter,
  selectedPointId,
  points,
  onSelectPoint,
}: IslandMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const center =
    ISLAND_CENTER[selectedIsland as keyof typeof ISLAND_CENTER] ??
    ISLAND_CENTER.st_thomas;

  const visiblePoints = useMemo(() => {
    return activeFilter === "all"
      ? points
      : points.filter((point) => point.type === activeFilter);
  }, [activeFilter, points]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId),
    [points, selectedPointId]
  );

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      console.warn("Missing VITE_MAPBOX_TOKEN in .env.local.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center.center,
      zoom: center.zoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.once("load", () => {
      map.resize();
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(mapNodeRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: center.center,
      zoom: center.zoom,
      duration: 700,
      essential: true,
    });
  }, [center.center, center.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    visiblePoints.forEach((point) => {
      const selected = point.id === selectedPointId;
      const element = makeMarkerElement(point, selected);

      element.addEventListener("click", () => {
        onSelectPoint(point);
      });

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        className: "vi-map-popup",
      }).setHTML(
        `<strong>${point.title}</strong><br/><span>${point.description}</span>`
      );

      const marker = new mapboxgl.Marker({
        element,
        anchor: "center",
      })
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [visiblePoints, selectedPointId, onSelectPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPoint) return;

    map.flyTo({
      center: [selectedPoint.lng, selectedPoint.lat],
      zoom: 15,
      duration: 800,
      essential: true,
    });
  }, [selectedPoint]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-emerald-950 p-6 text-center text-sm font-bold text-white">
          Missing VITE_MAPBOX_TOKEN in .env.local.
        </div>
      )}

      <div ref={mapNodeRef} className="h-full w-full" />
    </div>
  );
}