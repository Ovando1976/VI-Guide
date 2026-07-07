import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  CalendarDays,
  Landmark,
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

const ISLAND_CENTER: Record<string, { center: [number, number]; zoom: number }> = {
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
      background: "#2f9db7",
      foreground: "#ffffff",
    };
  }

  if (type === "history") {
    return {
      icon: Landmark,
      label: "History",
      background: "#9a5a2f",
      foreground: "#ffffff",
    };
  }

  if (type === "transport") {
    return {
      icon: Ship,
      label: "Transport",
      background: "#456fe0",
      foreground: "#ffffff",
    };
  }

  if (type === "food") {
    return {
      icon: Utensils,
      label: "Food",
      background: "#d2483b",
      foreground: "#ffffff",
    };
  }

  if (type === "event") {
    return {
      icon: CalendarDays,
      label: "Event",
      background: "#5a4de1",
      foreground: "#ffffff",
    };
  }

  return {
    icon: Sparkles,
    label: "Attraction",
    background: "#6b5af1",
    foreground: "#ffffff",
  };
}

type RenderCluster = {
  kind: "cluster";
  id: string;
  points: MapPoint[];
  lat: number;
  lng: number;
  dominantType: Exclude<MapFilter, "all">;
};

type RenderPoint = {
  kind: "point";
  point: MapPoint;
};

type RenderItem = RenderCluster | RenderPoint;

function isValidPoint(point: MapPoint) {
  return (
    Number.isFinite(Number(point.lat)) &&
    Number.isFinite(Number(point.lng)) &&
    Math.abs(Number(point.lat)) <= 90 &&
    Math.abs(Number(point.lng)) <= 180
  );
}

function getClusterCellSize(zoom: number) {
  if (zoom < 10) return 0.08;
  if (zoom < 11) return 0.045;
  if (zoom < 12) return 0.026;
  if (zoom < 13) return 0.014;
  if (zoom < 14) return 0.007;
  return 0;
}

function dominantType(points: MapPoint[]): Exclude<MapFilter, "all"> {
  const counts = points.reduce<Record<string, number>>((acc, point) => {
    acc[point.type] = (acc[point.type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as Exclude<
    MapFilter,
    "all"
  >;
}

function getRenderItems(points: MapPoint[], zoom: number): RenderItem[] {
  const valid = points.filter(isValidPoint);
  const cellSize = getClusterCellSize(zoom);

  if (cellSize === 0) {
    return valid.map((point): RenderPoint => ({ kind: "point", point }));
  }

  const buckets = new Map<string, MapPoint[]>();

  for (const point of valid) {
    const x = Math.round(point.lng / cellSize);
    const y = Math.round(point.lat / cellSize);
    const key = `${x}:${y}`;

    const bucket = buckets.get(key) || [];
    bucket.push(point);
    buckets.set(key, bucket);
  }

  const items: RenderItem[] = [];

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.length === 1) {
      items.push({
        kind: "point",
        point: bucket[0],
      });
      continue;
    }

    const lat =
      bucket.reduce((sum, point) => sum + point.lat, 0) / bucket.length;
    const lng =
      bucket.reduce((sum, point) => sum + point.lng, 0) / bucket.length;

    items.push({
      kind: "cluster",
      id: key,
      points: bucket,
      lat,
      lng,
      dominantType: dominantType(bucket),
    });
  }

  return items;
}

function makeIconSvg(type: Exclude<MapFilter, "all">, size: number) {
  const style = getMapMarkerStyle(type);
  const Icon = style.icon;

  return renderToStaticMarkup(
    <Icon size={size} strokeWidth={2.75} color={style.foreground} />
  );
}

function makePointElement(point: MapPoint, selected: boolean) {
  const style = getMapMarkerStyle(point.type);
  const outerSize = selected ? 36 : 28;
  const innerSize = selected ? 30 : 23;
  const iconSize = selected ? 16 : 13;

  const el = document.createElement("button");
  el.type = "button";
  el.title = point.title;
  el.setAttribute("aria-label", `${style.label}: ${point.title}`);

  el.style.width = `${outerSize}px`;
  el.style.height = `${outerSize}px`;
  el.style.border = "0";
  el.style.padding = "0";
  el.style.borderRadius = "999px";
  el.style.background = selected
    ? "rgba(45, 212, 191, 0.24)"
    : "rgba(255,255,255,0.82)";
  el.style.display = "grid";
  el.style.placeItems = "center";
  el.style.cursor = "pointer";
  el.style.boxShadow = selected
    ? "0 0 0 7px rgba(20,184,166,0.22), 0 14px 28px rgba(15,23,42,0.28)"
    : "0 7px 16px rgba(15,23,42,0.22)";
  el.style.transform = selected ? "scale(1.12)" : "scale(1)";
  el.style.transition = "transform 160ms ease, box-shadow 160ms ease";

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
      "
    >
      ${makeIconSvg(point.type, iconSize)}
    </span>
  `;

  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.18)";
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = selected ? "scale(1.12)" : "scale(1)";
  });

  return el;
}

function makeClusterElement(cluster: RenderCluster) {
  const style = getMapMarkerStyle(cluster.dominantType);
  const count = cluster.points.length;
  const size = count >= 50 ? 70 : count >= 25 ? 62 : count >= 10 ? 56 : 50;
  const iconSize = count >= 25 ? 20 : 18;

  const el = document.createElement("button");
  el.type = "button";
  el.title = `${count} places`;
  el.setAttribute("aria-label", `${count} places`);

  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.border = "0";
  el.style.padding = "0";
  el.style.borderRadius = "999px";
  el.style.background = "rgba(15,23,42,0.15)";
  el.style.display = "grid";
  el.style.placeItems = "center";
  el.style.cursor = "pointer";
  el.style.boxShadow =
    "0 0 0 8px rgba(15,23,42,0.12), 0 18px 34px rgba(15,23,42,0.3)";
  el.style.transition = "transform 160ms ease, box-shadow 160ms ease";

  el.innerHTML = `
    <span
      style="
        width:${size - 8}px;
        height:${size - 8}px;
        display:grid;
        place-items:center;
        border-radius:999px;
        border:4px solid white;
        background:#073f36;
        color:white;
        position:relative;
      "
    >
      <span style="position:absolute; top:8px; display:grid; place-items:center; opacity:.9;">
        ${makeIconSvg(cluster.dominantType, iconSize)}
      </span>
      <span
        style="
          position:absolute;
          bottom:8px;
          min-width:26px;
          height:20px;
          display:grid;
          place-items:center;
          border-radius:999px;
          background:${style.background};
          color:white;
          font-size:12px;
          font-weight:900;
          line-height:1;
          padding:0 7px;
        "
      >
        ${count}
      </span>
    </span>
  `;

  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.08)";
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "scale(1)";
  });

  return el;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  const pointsRef = useRef<MapPoint[]>(points);
  const selectedPointIdRef = useRef<string | null>(selectedPointId);

  pointsRef.current = points;
  selectedPointIdRef.current = selectedPointId;

  const center =
    ISLAND_CENTER[selectedIsland as keyof typeof ISLAND_CENTER] ??
    ISLAND_CENTER.st_thomas;

  const visiblePoints = useMemo(() => {
    const valid = points.filter(isValidPoint);

    return activeFilter === "all"
      ? valid
      : valid.filter((point) => point.type === activeFilter);
  }, [activeFilter, points]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId]
  );

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const zoom = map.getZoom();
    const items = getRenderItems(visiblePoints, zoom);

    for (const item of items) {
      if (item.kind === "cluster") {
        const element = makeClusterElement(item);

        element.addEventListener("click", (event) => {
          event.stopPropagation();

          const bounds = new mapboxgl.LngLatBounds();

          item.points.forEach((point) => {
            bounds.extend([point.lng, point.lat]);
          });

          map.fitBounds(bounds, {
            padding: 90,
            maxZoom: Math.max(map.getZoom() + 1.2, 13.5),
            duration: 650,
            essential: true,
          });
        });

        const marker = new mapboxgl.Marker({
          element,
          anchor: "center",
        })
          .setLngLat([item.lng, item.lat])
          .addTo(map);

        markersRef.current.push(marker);
        continue;
      }

      const point = item.point;
      const selected = point.id === selectedPointIdRef.current;
      const element = makePointElement(point, selected);

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectPoint(point);

        map.flyTo({
          center: [point.lng, point.lat],
          zoom: Math.max(map.getZoom(), 14.4),
          duration: 650,
          essential: true,
        });
      });

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: false,
        className: "vi-map-popup",
      }).setHTML(
        `<div style="max-width:220px">
          <strong>${escapeHtml(point.title)}</strong><br/>
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
    }
  }, [onSelectPoint, visiblePoints]);

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

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(mapNodeRef.current);

    map.on("load", () => {
      map.resize();
      renderMarkers();
    });

    map.on("zoomend", renderMarkers);
    map.on("moveend", renderMarkers);

    return () => {
      resizeObserver.disconnect();
      map.off("zoomend", renderMarkers);
      map.off("moveend", renderMarkers);
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
    window.setTimeout(renderMarkers, 250);
  }, [mapStyleMode, renderMarkers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo({
      center: center.center,
      zoom: center.zoom,
      duration: 700,
      essential: true,
    });

    window.setTimeout(renderMarkers, 250);
  }, [center.center, center.zoom, renderMarkers]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers, selectedPointId]);

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
