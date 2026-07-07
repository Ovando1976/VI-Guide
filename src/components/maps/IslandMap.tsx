import React, { useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  CalendarDays,
  Landmark,
  MapPin,
  Ship,
  Sparkles,
  Umbrella,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { IslandCode } from "../../types";

export type MapFilter =
  | "all"
  | "beach"
  | "history"
  | "transport"
  | "food"
  | "event"
  | "attraction";

export type MapStyleMode = "streets" | "outdoors" | "satellite";

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
  mapStyleMode?: MapStyleMode;
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

const MAPBOX_TOKEN = String(
  import.meta.env.VITE_MAPBOX_TOKEN ||
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    ""
)
  .replace(/^["']|["']$/g, "")
  .trim();

const ISLAND_CENTER: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  st_thomas: { center: [-64.9307, 18.3419], zoom: 12 },
  st_john: { center: [-64.7281, 18.3358], zoom: 12 },
  st_croix: { center: [-64.8348, 17.7246], zoom: 11 },
  water_island: { center: [-64.95, 18.319], zoom: 13 },
};

const MAP_STYLES: Record<MapStyleMode, string> = {
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

type MarkerStyle = {
  icon: LucideIcon;
  label: string;
  background: string;
  foreground: string;
};

export function getMapMarkerStyle(
  type: Exclude<MapFilter, "all">
): MarkerStyle {
  if (type === "beach") {
    return {
      icon: Umbrella,
      label: "Beach",
      background: "#0891b2",
      foreground: "#ffffff",
    };
  }

  if (type === "history") {
    return {
      icon: Landmark,
      label: "History",
      background: "#92400e",
      foreground: "#ffffff",
    };
  }

  if (type === "transport") {
    return {
      icon: Ship,
      label: "Transport",
      background: "#2563eb",
      foreground: "#ffffff",
    };
  }

  if (type === "food") {
    return {
      icon: Utensils,
      label: "Food",
      background: "#dc2626",
      foreground: "#ffffff",
    };
  }

  if (type === "event") {
    return {
      icon: CalendarDays,
      label: "Event",
      background: "#7c3aed",
      foreground: "#ffffff",
    };
  }

  return {
    icon: Sparkles,
    label: "Attraction",
    background: "#4f46e5",
    foreground: "#ffffff",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeMarkerElement(point: MapPoint, selected: boolean) {
  const style = getMapMarkerStyle(point.type);
  const Icon = style.icon;

  const el = document.createElement("button");
  const outerSize = selected ? 52 : 40;
  const innerSize = selected ? 42 : 32;

  const iconSvg = renderToStaticMarkup(
    <Icon size={selected ? 20 : 17} strokeWidth={2.8} aria-hidden="true" />
  );

  el.type = "button";
  el.setAttribute("aria-label", `${style.label}: ${point.title}`);
  el.title = point.title;
  el.style.width = `${outerSize}px`;
  el.style.height = `${outerSize}px`;
  el.style.border = "0";
  el.style.padding = "0";
  el.style.borderRadius = "999px";
  el.style.background = selected
    ? "rgba(45, 212, 191, 0.22)"
    : "rgba(255,255,255,0.82)";
  el.style.display = "grid";
  el.style.placeItems = "center";
  el.style.cursor = "pointer";
  el.style.boxShadow = selected
    ? "0 0 0 8px rgba(20,184,166,0.24), 0 18px 34px rgba(15,23,42,0.32)"
    : "0 10px 24px rgba(15,23,42,0.26)";
  el.style.transform = selected ? "scale(1.08)" : "scale(1)";
  el.style.transition = "transform 160ms ease, box-shadow 160ms ease";
  el.style.zIndex = selected ? "30" : "1";

  el.innerHTML = `
    <span
      style="
        width:${innerSize}px;
        height:${innerSize}px;
        display:grid;
        place-items:center;
        border-radius:999px;
        border:${selected ? "3px" : "2px"} solid white;
        background:${style.background};
        color:${style.foreground};
        box-shadow:0 8px 18px rgba(15,23,42,0.22);
      "
    >
      ${iconSvg}
    </span>
  `;

  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.16)";
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = selected ? "scale(1.08)" : "scale(1)";
  });

  return el;
}

function isValidPoint(point: MapPoint) {
  return (
    Number.isFinite(Number(point.lat)) &&
    Number.isFinite(Number(point.lng)) &&
    Math.abs(Number(point.lat)) <= 90 &&
    Math.abs(Number(point.lng)) <= 180
  );
}

export default function IslandMap({
  selectedIsland,
  activeFilter,
  selectedPointId,
  points,
  mapStyleMode = "streets",
  onSelectPoint,
}: IslandMapProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const center =
    ISLAND_CENTER[selectedIsland as keyof typeof ISLAND_CENTER] ??
    ISLAND_CENTER.st_thomas;

  const visiblePoints = useMemo(() => {
    const validPoints = points.filter(isValidPoint);

    return activeFilter === "all"
      ? validPoints
      : validPoints.filter((point) => point.type === activeFilter);
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
      style: MAP_STYLES[mapStyleMode],
      center: center.center,
      zoom: center.zoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

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

    map.setStyle(MAP_STYLES[mapStyleMode]);
  }, [mapStyleMode]);

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

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectPoint(point);

        map.flyTo({
          center: [point.lng, point.lat],
          zoom: Math.max(map.getZoom(), 14),
          duration: 650,
          essential: true,
        });
      });

      const popup = new mapboxgl.Popup({
        offset: 26,
        closeButton: false,
        className: "vi-map-popup",
      }).setHTML(
        `<div style="max-width:220px">
          <strong>${escapeHtml(point.title)}</strong>
          <br/>
          <span>${escapeHtml(point.description)}</span>
        </div>`
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
    if (!map || !selectedPoint || !isValidPoint(selectedPoint)) return;

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
