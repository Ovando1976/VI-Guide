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

const SOURCE_ID = "vi-points-source";
const CLUSTER_LAYER_ID = "vi-point-clusters";
const CLUSTER_COUNT_LAYER_ID = "vi-point-cluster-count";
const SELECTED_HALO_LAYER_ID = "vi-point-selected-halo";
const UNCLUSTERED_LAYER_ID = "vi-point-unclustered";

type MarkerStyle = {
  icon: LucideIcon;
  label: string;
  background: string;
  foreground: string;
};

export function getMapMarkerStyle(type: Exclude<MapFilter, "all">): MarkerStyle {
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidPoint(point: MapPoint) {
  return (
    Number.isFinite(Number(point.lat)) &&
    Number.isFinite(Number(point.lng)) &&
    Math.abs(Number(point.lat)) <= 90 &&
    Math.abs(Number(point.lng)) <= 180
  );
}

function buildGeoJson(points: MapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.filter(isValidPoint).map((point) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [Number(point.lng), Number(point.lat)],
      },
      properties: {
        id: point.id,
        title: point.title,
        type: point.type,
        description: point.description,
      },
    })),
  };
}

function getImageId(type: Exclude<MapFilter, "all">) {
  return `vi-marker-${type}`;
}

function buildMarkerSvg(type: Exclude<MapFilter, "all">) {
  const style = getMapMarkerStyle(type);
  const Icon = style.icon;

  const iconMarkup = renderToStaticMarkup(
    <Icon
      size={18}
      strokeWidth={2.7}
      color={style.foreground}
      stroke={style.foreground}
    />
  ).replace(
    "<svg",
    '<svg x="15" y="15" width="18" height="18" viewBox="0 0 24 24"'
  );

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <defs>
        <filter id="shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.28"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="17" fill="${style.background}" stroke="#ffffff" stroke-width="3" filter="url(#shadow)" />
      ${iconMarkup}
    </svg>
  `.trim();
}

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function ensureMarkerImages(map: mapboxgl.Map) {
  const types: Array<Exclude<MapFilter, "all">> = [
    "beach",
    "history",
    "transport",
    "food",
    "event",
    "attraction",
  ];

  for (const type of types) {
    const imageId = getImageId(type);

    if (map.hasImage(imageId)) continue;

    const image = await loadImage(svgToDataUrl(buildMarkerSvg(type)));
    map.addImage(imageId, image, { pixelRatio: 2 });
  }
}

function ensureSourceAndLayers(map: mapboxgl.Map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
      cluster: true,
      clusterRadius: 64,
      clusterMaxZoom: 13,
    });
  }

  if (!map.getLayer(CLUSTER_LAYER_ID)) {
    map.addLayer({
      id: CLUSTER_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#0f4f45",
          10,
          "#12695b",
          25,
          "#13806e",
          50,
          "#17a38d",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          26,
          10,
          32,
          25,
          38,
          50,
          44,
        ],
        "circle-stroke-width": 5,
        "circle-stroke-color": "#ffffff",
        "circle-opacity": 0.97,
      },
    });
  }

  if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": [
          "step",
          ["get", "point_count"],
          14,
          10,
          16,
          25,
          18,
        ],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }

  if (!map.getLayer(SELECTED_HALO_LAYER_ID)) {
    map.addLayer({
      id: SELECTED_HALO_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "id"], "__none__"],
      ],
      paint: {
        "circle-radius": 23,
        "circle-color": "#2dd4bf",
        "circle-opacity": 0.24,
        "circle-stroke-color": "#2dd4bf",
        "circle-stroke-width": 3,
        "circle-stroke-opacity": 0.6,
      },
    });
  }

  if (!map.getLayer(UNCLUSTERED_LAYER_ID)) {
    map.addLayer({
      id: UNCLUSTERED_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "icon-image": [
          "match",
          ["get", "type"],
          "beach",
          getImageId("beach"),
          "history",
          getImageId("history"),
          "transport",
          getImageId("transport"),
          "food",
          getImageId("food"),
          "event",
          getImageId("event"),
          "attraction",
          getImageId("attraction"),
          getImageId("attraction"),
        ],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          0.46,
          12,
          0.56,
          14,
          0.72,
          16,
          0.88,
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });
  }
}

function setSourceData(map: mapboxgl.Map, data: ReturnType<typeof buildGeoJson>) {
  const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!source) return;

  source.setData(data as GeoJSON.FeatureCollection);
}

function setSelectedFilter(map: mapboxgl.Map, selectedPointId: string | null) {
  if (!map.getLayer(SELECTED_HALO_LAYER_ID)) return;

  map.setFilter(SELECTED_HALO_LAYER_ID, [
    "all",
    ["!", ["has", "point_count"]],
    ["==", ["get", "id"], selectedPointId ?? "__none__"],
  ]);
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
  const latestGeoJsonRef = useRef(buildGeoJson([]));
  const latestSelectedIdRef = useRef<string | null>(selectedPointId);
  const latestPointsRef = useRef<MapPoint[]>(points);
  const onSelectPointRef = useRef(onSelectPoint);
  const syncRetryRef = useRef<number | null>(null);

  latestPointsRef.current = points;
  latestSelectedIdRef.current = selectedPointId;
  onSelectPointRef.current = onSelectPoint;

  const center =
    ISLAND_CENTER[selectedIsland as keyof typeof ISLAND_CENTER] ??
    ISLAND_CENTER.st_thomas;

  const visiblePoints = useMemo(() => {
    const valid = points.filter(isValidPoint);

    return activeFilter === "all"
      ? valid
      : valid.filter((point) => point.type === activeFilter);
  }, [activeFilter, points]);

  const geoJson = useMemo(() => buildGeoJson(visiblePoints), [visiblePoints]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) ?? null,
    [points, selectedPointId]
  );

  latestGeoJsonRef.current = geoJson;

  const syncMapVisuals = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    if (!map.loaded() || !map.isStyleLoaded()) {
      if (syncRetryRef.current) {
        window.clearTimeout(syncRetryRef.current);
      }

      syncRetryRef.current = window.setTimeout(() => {
        void syncMapVisuals();
      }, 120);

      return;
    }

    await ensureMarkerImages(map);
    ensureSourceAndLayers(map);
    setSourceData(map, latestGeoJsonRef.current);
    setSelectedFilter(map, latestSelectedIdRef.current);
  }, []);

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

    const handleClick = (event: mapboxgl.MapMouseEvent) => {
      const clusterFeatures = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTER_LAYER_ID],
      });

      if (clusterFeatures.length > 0) {
        const clusterFeature = clusterFeatures[0];
        const clusterId = clusterFeature.properties?.cluster_id;
        const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;

        if (!source || clusterId == null) return;

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return;

          const coordinates = (clusterFeature.geometry as GeoJSON.Point)
            .coordinates as [number, number];

          map.easeTo({
            center: coordinates,
            zoom,
            duration: 550,
          });
        });

        return;
      }

      const pointFeatures = map.queryRenderedFeatures(event.point, {
        layers: [UNCLUSTERED_LAYER_ID],
      });

      if (pointFeatures.length > 0) {
        const pointId = String(pointFeatures[0].properties?.id || "");
        const point = latestPointsRef.current.find((item) => item.id === pointId);

        if (point) {
          onSelectPointRef.current(point);
        }
      }
    };

    const handleMouseMove = (event: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID],
      });

      map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";
    };

    map.on("load", () => {
      void syncMapVisuals();
      map.resize();
    });

    map.on("style.load", () => {
      void syncMapVisuals();
    });

    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);

    return () => {
      if (syncRetryRef.current) {
        window.clearTimeout(syncRetryRef.current);
      }

      resizeObserver.disconnect();
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
      map.remove();
      mapRef.current = null;
    };
  }, [center.center, center.zoom, mapStyleMode, syncMapVisuals]);

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
    void syncMapVisuals();
  }, [geoJson, selectedPointId, syncMapVisuals]);

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
