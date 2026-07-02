// src/components/maps/IslandMap.tsx

import mapboxgl, {
  type AnyLayer,
  type AnySourceData,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import * as turf from "@turf/turf";

export type MapFilter = "all" | "estates" | "places" | "parcels";

export const MAP_FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "estates", label: "Estates" },
  { id: "places", label: "Places" },
  { id: "parcels", label: "Parcels" },
];

export type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

export type LngLatTuple = [number, number];

export type MapPoint = {
  id: string;
  title?: string;
  name?: string;
  displayName?: string;
  label?: string;
  description?: string;
  type?: string;
  island?: IslandCode;
  lat?: number;
  lng?: number;
};

export type AtlasSelection = {
  displayName?: string;
  id?: string | number;
  geoid?: string;
  title: string;
  name?: string;
  description?: string;
  estate?: string;
  quarter?: string;
  quarterGroup?: string;
  island?: IslandCode;
  lat: number;
  lng: number;
  coords: LngLatTuple;
  type?: string;
  source?: string;
  isEstate?: boolean;
  isParcel?: boolean;
  isPoint?: boolean;
  properties?: Record<string, unknown>;
};

export type FocusTarget = {
  center?: LngLatTuple | number[];
  coords?: LngLatTuple | number[];
  lat?: number;
  lng?: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  type?: string;
  title?: string;
  name?: string;
};

export type RoutePoint = {
  coords?: LngLatTuple | number[];
  center?: LngLatTuple | number[];
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  label?: string;
  title?: string;
  name?: string;
};

export type RouteLineInput =
  | GeoJSON.Feature<GeoJSON.LineString>
  | GeoJSON.LineString
  | {
      type?: string;
      coordinates?: Array<LngLatTuple | number[]>;
      geometry?: {
        type?: string;
        coordinates?: Array<LngLatTuple | number[]>;
      };
    }
  | Array<LngLatTuple | number[]>
  | null
  | undefined;

type Props = {
  selectedIsland?: IslandCode;
  activeFilter?: MapFilter;
  selectedPointId?: string | null;
  points?: MapPoint[];
  onSelectPoint?: (point: MapPoint) => void;
  onSelectFeature?: (selection: AtlasSelection) => void;
  onParcelClick?: (selection: AtlasSelection) => void;

  focusTarget?: FocusTarget | null;

  showParcels?: boolean;
  showHeat?: boolean;

  pickup?: RoutePoint | null;
  dropoff?: RoutePoint | null;
  routeLine?: RouteLineInput;

  highlightEstate?: string | null;
  onLoaded?: () => void;

  embedded?: boolean;
  embeddedMapHeight?: string;
  interactive?: boolean;
  className?: string;

  showControls?: boolean;
  showEstateLabels?: boolean;
  showEstateBoundaries?: boolean;
  showParcelLabels?: boolean;
};

const INITIAL_VIEW_STATE = {
  longitude: -64.86,
  latitude: 18.08,
  zoom: 8.8,
  pitch: 45,
  bearing: -10,
};

const ISLAND_CENTERS: Record<IslandCode, { center: LngLatTuple; zoom: number }> = {
  st_thomas: { center: [-64.93, 18.34], zoom: 11.2 },
  st_john: { center: [-64.75, 18.34], zoom: 11.4 },
  st_croix: { center: [-64.75, 17.73], zoom: 10.2 },
  water_island: { center: [-64.95, 18.32], zoom: 13 },
};

const ESTATE_GREEN = "#10b981";
const ESTATE_GREEN_GLOW = "#34d399";
const PARCEL_YELLOW = "#facc15";
const PARCEL_YELLOW_TEXT = "#fff7c2";

const rawToken =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ||
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ||
  "";

const MAPBOX_TOKEN =
  rawToken && rawToken.startsWith("pk.") && rawToken.length > 30 ? rawToken : "";

const ESTATES_URL = "/geo/usvi-estates.geojson";
const PARCELS_URL = "/geo/usvi-parcels.geojson";

function mapHasLayer(map: mapboxgl.Map, layerId: string) {
  try {
    return Boolean(map.getLayer(layerId));
  } catch {
    return false;
  }
}

function isValidLngLatCenter(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number" &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function safeQueryRenderedFeatures(
  map: mapboxgl.Map,
  options: { layers?: string[] } = {},
) {
  try {
    const layers = options.layers ?? [];
    const existingLayers = layers.filter((layerId) => mapHasLayer(map, layerId));

    if (layers.length > 0 && existingLayers.length === 0) {
      return [];
    }

    return map.queryRenderedFeatures({
      ...options,
      layers: existingLayers.length > 0 ? existingLayers : layers,
    });
  } catch (error) {
    console.warn("[IslandMap] queryRenderedFeatures skipped", error);
    return [];
  }
}

const HEAT_URL = "/geo/usvi-heat.geojson";

const emptyRoute: GeoJSON.Feature<GeoJSON.LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [],
  },
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\bestate\b/g, "")
    .replace(/[_-]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIsland(value: unknown): IslandCode {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("croix") || raw.includes("stx")) return "st_croix";
  if (raw.includes("john") || raw.includes("stj")) return "st_john";
  if (raw.includes("water") || raw.includes("wat")) return "water_island";
  return "st_thomas";
}

function toLngLatTuple(value: unknown): LngLatTuple | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const lng = Number(value[0]);
  const lat = Number(value[1]);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  return [lng, lat];
}

function getRoutePointCoords(point?: RoutePoint | null): LngLatTuple | null {
  if (!point) return null;

  const fromCoords = toLngLatTuple(point.coords);
  if (fromCoords) return fromCoords;

  const fromCenter = toLngLatTuple(point.center);
  if (fromCenter) return fromCenter;

  const lng =
    typeof point.lng === "number"
      ? point.lng
      : typeof point.longitude === "number"
        ? point.longitude
        : null;

  const lat =
    typeof point.lat === "number"
      ? point.lat
      : typeof point.latitude === "number"
        ? point.latitude
        : null;

  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  return [lng, lat];
}

function routeLineToFeature(routeLine: RouteLineInput): GeoJSON.Feature<GeoJSON.LineString> | null {
  if (!routeLine) return null;

  let rawCoordinates: unknown;

  if (Array.isArray(routeLine)) {
    rawCoordinates = routeLine;
  } else if (routeLine.type === "Feature" && routeLine.geometry?.type === "LineString") {
    rawCoordinates = routeLine.geometry.coordinates;
  } else if (routeLine.type === "LineString") {
    rawCoordinates = routeLine.coordinates;
  } else if ("coordinates" in routeLine) {
    rawCoordinates = routeLine.coordinates;
  } else if ("geometry" in routeLine && routeLine.geometry?.type === "LineString") {
    rawCoordinates = routeLine.geometry.coordinates;
  }

  if (!Array.isArray(rawCoordinates)) return null;

  const coordinates = rawCoordinates
    .map((coord) => toLngLatTuple(coord))
    .filter((coord): coord is LngLatTuple => Boolean(coord));

  if (coordinates.length < 2) return null;

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

function getFeatureTitle(feature: mapboxgl.MapboxGeoJSONFeature): string {
  const props = feature.properties || {};
  return String(
    props.title ||
      props.name ||
      props.baseName ||
      props.fullName ||
      props.estate ||
      props.ESTATE ||
      props.label ||
      "Selected Location",
  );
}

function safeAddSource(map: mapboxgl.Map, id: string, source: AnySourceData) {
  try {
    if (!map.getSource(id)) map.addSource(id, source);
  } catch (error) {
    console.warn(`Failed to add source "${id}":`, error);
  }
}

function safeAddLayer(map: mapboxgl.Map, layer: AnyLayer, beforeId?: string) {
  try {
    if (map.getLayer(layer.id)) return;
    if (beforeId && map.getLayer(beforeId)) map.addLayer(layer, beforeId);
    else map.addLayer(layer);
  } catch (error) {
    console.warn(`Failed to add layer "${layer.id}":`, error);
  }
}

function safeSetLayoutVisibility(map: mapboxgl.Map, layerId: string, visible: boolean) {
  try {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
  } catch (error) {
    console.warn(`Failed to update visibility for "${layerId}":`, error);
  }
}

function safeSetFilter(
  map: mapboxgl.Map,
  layerId: string,
  filter: mapboxgl.FilterSpecification | null,
) {
  try {
    if (map.getLayer(layerId)) map.setFilter(layerId, filter);
  } catch (error) {
    console.warn(`Failed to set filter for "${layerId}":`, error);
  }
}

function makeHighlightFilter(highlightEstate?: string | number | null): mapboxgl.FilterSpecification {
  if (
    highlightEstate === null ||
    highlightEstate === undefined ||
    String(highlightEstate).trim() === ""
  ) {
    return ["==", ["get", "name"], "__none__"];
  }

  const rawTarget = String(highlightEstate).trim();
  const lowerTarget = rawTarget.toLowerCase();
  const compactTarget = normalizeText(rawTarget);

  const fields = [
    "id",
    "geoid",
    "GEOID",
    "estateId",
    "name",
    "title",
    "baseName",
    "fullName",
    "estate",
    "ESTATE",
    "label",
  ];

  const tests = fields.flatMap((key) => {
    const expr = ["downcase", ["to-string", ["coalesce", ["get", key], ""]]];

    return [
      ["==", expr, lowerTarget],
      ["in", lowerTarget, expr],
      ["in", compactTarget, expr],
    ];
  });

  return ["any", ...tests] as mapboxgl.FilterSpecification;
}

function featureMatchesEstate(
  feature: mapboxgl.MapboxGeoJSONFeature,
  targetEstate?: string | null,
): boolean {
  if (!targetEstate) return false;
  const target = normalizeText(targetEstate);
  const name = normalizeText(getFeatureTitle(feature));
  return Boolean(target && name && (name === target || name.includes(target) || target.includes(name)));
}

function pointToFeature(point: MapPoint): GeoJSON.Feature<GeoJSON.Point> | null {
  if (typeof point.lat !== "number" || typeof point.lng !== "number") return null;
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;

  return {
    type: "Feature",
    properties: {
      id: point.id,
      title: point.title || point.name || point.label || "Location",
      description: point.description || "",
      type: point.type || "place",
      island: point.island || "st_thomas",
    },
    geometry: {
      type: "Point",
      coordinates: [point.lng, point.lat],
    },
  };
}

function pointsToGeoJson(points: MapPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: points
      .map(pointToFeature)
      .filter((item): item is GeoJSON.Feature<GeoJSON.Point> => Boolean(item)),
  };
}

function makeSelectionFromFeature(
  feature: mapboxgl.MapboxGeoJSONFeature,
  coords: LngLatTuple,
  source: string,
): AtlasSelection {
  const props = (feature.properties || {}) as Record<string, unknown>;
  const title = getFeatureTitle(feature);

  const officialId =
    props.geoid ||
    props.GEOID ||
    props.estateId ||
    props.ESTATE_ID ||
    props.EstateID ||
    props.sourceObjectId ||
    props.SOURCE_OBJECT_ID ||
    props.parcelId ||
    props.PARCEL_ID ||
    props.id ||
    props.ID ||
    "";

  /*
    Do not use Mapbox feature.id for estate routing.
    With generateId: true, feature.id is only a render-time index.
    Bovoni is map feature index 87, but its real estate geoid is 1998.
  */
  const stableId =
    officialId ||
    (source === "point-marker" ? feature.id : undefined) ||
    title;

  return {
    ...props,
    id: stableId as string | number | undefined,
    geoid: String(officialId || ""),
    title,
    name: title,
    estate: String(props.estate || props.ESTATE || props.name || props.Name || title),
    displayName: String(props.displayName || props.DISPLAY_NAME || title),
    quarter: String(props.quarter || props.QUARTER || props.quarterGroup || ""),
    quarterGroup: String(props.quarterGroup || props.QUARTER_GROUP || props.quarter || ""),
    type: String(props.type || source),
    source,
    island: normalizeIsland(props.island || props.ISLAND || props.county),
    lat: coords[1],
    lng: coords[0],
    coords,
    isEstate: source === "estate",
    isParcel: source === "parcel",
    isPoint: source === "point-marker",
    properties: {
      ...props,
      officialId: String(officialId || ""),
      mapboxGeneratedFeatureId: feature.id,
    },
  };
}

function getFocusCenter(focusTarget?: FocusTarget | null): LngLatTuple | null {
  if (!focusTarget) return null;

  const fromCenter = toLngLatTuple(focusTarget.center);
  if (fromCenter) return fromCenter;

  const fromCoords = toLngLatTuple(focusTarget.coords);
  if (fromCoords) return fromCoords;

  if (typeof focusTarget.lng === "number" && typeof focusTarget.lat === "number") {
    return [focusTarget.lng, focusTarget.lat];
  }

  return null;
}

function createMarkerElement(kind: "pickup" | "dropoff") {
  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.transform = "translateY(-16px)";
  el.style.width = "42px";
  el.style.height = "42px";
  el.style.pointerEvents = "none";

  const glow = document.createElement("div");
  glow.style.position = "absolute";
  glow.style.width = kind === "pickup" ? "42px" : "34px";
  glow.style.height = kind === "pickup" ? "42px" : "34px";
  glow.style.borderRadius = "999px";
  glow.style.background =
    kind === "pickup" ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.22)";
  glow.style.boxShadow =
    kind === "pickup"
      ? "0 0 24px rgba(59,130,246,0.7)"
      : "0 0 22px rgba(255,255,255,0.45)";

  const dot = document.createElement("div");
  dot.style.position = "relative";
  dot.style.width = kind === "pickup" ? "18px" : "22px";
  dot.style.height = kind === "pickup" ? "18px" : "22px";
  dot.style.borderRadius = "999px";
  dot.style.border = "3px solid white";
  dot.style.background = kind === "pickup" ? "#3b82f6" : "#111827";

  el.appendChild(glow);
  el.appendChild(dot);
  return el;
}

export default function IslandMap({
  selectedIsland = "st_thomas",
  points = [],
  onSelectPoint,
  onSelectFeature,
  onParcelClick,
  focusTarget = null,
  showParcels = false,
  showHeat = false,
  pickup = null,
  dropoff = null,
  routeLine = null,
  highlightEstate = null,
  onLoaded,
  embedded = false,
  embeddedMapHeight,
  interactive = true,
  className = "",
  showControls = true,
  showEstateLabels = true,
  showEstateBoundaries = true,
  showParcelLabels = true,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const didCallLoadedRef = useRef(false);
  const parcelsLoadedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [internalHighlightEstate, setInternalHighlightEstate] = useState<string | null>(null);

  const effectiveHighlightEstate = highlightEstate ?? internalHighlightEstate;

  const hasToken = useMemo(() => Boolean(MAPBOX_TOKEN), []);
  const pointGeoJson = useMemo(() => pointsToGeoJson(points), [points]);

  const callLoadedOnce = () => {
    if (didCallLoadedRef.current) return;
    didCallLoadedRef.current = true;
    onLoaded?.();
  };

  function emitSelection(selection: AtlasSelection) {
    onSelectFeature?.(selection);
    onParcelClick?.(selection);
  }

  function attachParcelLayers(map: mapboxgl.Map) {
    if (parcelsLoadedRef.current) {
      safeSetLayoutVisibility(map, "parcels-fill", showParcels);
      safeSetLayoutVisibility(map, "parcels-boundaries", showParcels);
      safeSetLayoutVisibility(map, "parcels-labels", showParcels && showParcelLabels);
      return;
    }

    parcelsLoadedRef.current = true;

    safeAddSource(map, "parcels", {
      type: "geojson",
      data: PARCELS_URL,
      generateId: true,
    });

    safeAddLayer(map, {
      id: "parcels-fill",
      source: "parcels",
      type: "fill",
      minzoom: 13,
      layout: { visibility: showParcels ? "visible" : "none" },
      paint: {
        "fill-color": PARCEL_YELLOW,
        "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.34, 0.1],
      },
    });

    safeAddLayer(map, {
      id: "parcels-boundaries",
      source: "parcels",
      type: "line",
      minzoom: 13,
      layout: { visibility: showParcels ? "visible" : "none" },
      paint: {
        "line-color": PARCEL_YELLOW,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.2, 14, 0.75, 16, 1.6, 20, 3],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 14, 0.52, 16, 0.88, 20, 1],
      },
    });

    safeAddLayer(map, {
      id: "parcels-labels",
      source: "parcels",
      type: "symbol",
      minzoom: 17,
      layout: {
        visibility: showParcels && showParcelLabels ? "visible" : "none",
        "text-field": [
          "coalesce",
          ["get", "ADDRESS"],
          ["get", "address"],
          ["get", "displayAddress"],
          ["get", "SITUSADDR"],
          ["concat", "Parcel ", ["coalesce", ["get", "PARCEL_NO"], ["get", "parcelNumber"], ""]],
        ],
        "text-size": 10,
        "text-variable-anchor": ["center"],
        "text-justify": "center",
        "symbol-placement": "point",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": PARCEL_YELLOW_TEXT,
        "text-halo-color": "#000000",
        "text-halo-width": 1.2,
      },
    });

    let hoveredStateId: string | number | null = null;

    map.on("click", "parcels-fill", (event: MapLayerMouseEvent) => {
      if (!interactive) return;
      const feature = event.features?.[0];
      if (!feature) return;
      emitSelection(makeSelectionFromFeature(feature, [event.lngLat.lng, event.lngLat.lat], "parcel"));
    });

    map.on("mousemove", "parcels-fill", (event: MapLayerMouseEvent) => {
      if (!interactive) return;
      const feature = event.features?.[0];
      if (!feature) return;

      if (hoveredStateId !== null) {
        map.setFeatureState({ source: "parcels", id: hoveredStateId }, { hover: false });
      }

      hoveredStateId = feature.id ?? null;
      if (hoveredStateId !== null) {
        map.setFeatureState({ source: "parcels", id: hoveredStateId }, { hover: true });
      }
    });

    map.on("mouseenter", "parcels-fill", () => {
      if (interactive) map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "parcels-fill", () => {
      map.getCanvas().style.cursor = "";
      if (hoveredStateId !== null) {
        map.setFeatureState({ source: "parcels", id: hoveredStateId }, { hover: false });
      }
      hoveredStateId = null;
    });
  }

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!MAPBOX_TOKEN) {
      setMapError("Missing VITE_MAPBOX_ACCESS_TOKEN.");
      callLoadedOnce();
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    let mounted = true;

    const islandView = ISLAND_CENTERS[selectedIsland] ?? ISLAND_CENTERS.st_thomas;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: islandView.center,
      zoom: islandView.zoom,
      pitch: INITIAL_VIEW_STATE.pitch,
      bearing: INITIAL_VIEW_STATE.bearing,
      antialias: true,
      projection: { name: "mercator" },
      attributionControl: true,
      logoPosition: "bottom-right",
      interactive,
      dragPan: interactive,
      scrollZoom: interactive,
      boxZoom: interactive,
      dragRotate: interactive,
      keyboard: interactive,
      doubleClickZoom: interactive,
      touchZoomRotate: interactive,
    });

    mapRef.current = map;

    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");
    }

    map.on("error", (event) => {
      const message = (event.error as Error | undefined)?.message || "Mapbox runtime error.";
      console.warn("Mapbox error:", event.error);
      setMapError(message);
    });

    map.on("load", () => {
      if (!mounted) return;

      try {
        safeAddSource(map, "mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        if (map.getSource("mapbox-dem")) {
          map.setTerrain({ source: "mapbox-dem", exaggeration: 1.45 });
        }

        safeAddSource(map, "estates", {
          type: "geojson",
          data: ESTATES_URL,
          generateId: true,
        });

        safeAddSource(map, "heat", {
          type: "geojson",
          data: HEAT_URL,
        });

        safeAddSource(map, "route", {
          type: "geojson",
          data: emptyRoute,
        });

        safeAddSource(map, "island-points", {
          type: "geojson",
          data: pointGeoJson,
        });

        safeAddLayer(map, {
        id: "estates-fill",
  source: "estates",
  type: "fill",
  filter: makeHighlightFilter(effectiveHighlightEstate),
  paint: {
    "fill-color": ESTATE_GREEN,
    "fill-opacity": effectiveHighlightEstate ? 0.28 : 0,
  },
});

        safeAddLayer(map, {
          id: "estates-boundaries",
          source: "estates",
          type: "line",
          layout: { visibility: showEstateBoundaries ? "visible" : "none" },
          paint: {
            "line-color": ESTATE_GREEN,
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.75, 11, 1.4, 15, 2.4, 18, 3.2],
            "line-opacity": 0.9,
          },
        });

        safeAddLayer(map, {
          id: "estates-boundaries-glow",
          source: "estates",
          type: "line",
          filter: makeHighlightFilter(effectiveHighlightEstate),
          layout: { visibility: showEstateBoundaries ? "visible" : "none" },
          paint: {
          "line-color": ESTATE_GREEN_GLOW,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 2.5, 12, 4.5, 16, 6.5],
          "line-opacity": 0.95,
          "line-blur": 2,
         },
        });

        safeAddLayer(map, {
          id: "estates-labels",
          type: "symbol",
          source: "estates",
          minzoom: 10,
          layout: {
            visibility: showEstateLabels ? "visible" : "none",
            "text-field": ["coalesce", ["get", "name"], ["get", "baseName"], ["get", "fullName"], ["get", "estate"]],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10, 9, 14, 12],
            "text-variable-anchor": ["center"],
            "text-justify": "center",
            "symbol-placement": "point",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#000000",
            "text-halo-width": 1.3,
            "text-opacity": 0.92,
          },
        });

        safeAddLayer(map, {
          id: "world-heat",
          type: "heatmap",
          source: "heat",
          maxzoom: 15,
          layout: { visibility: showHeat ? "visible" : "none" },
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["coalesce", ["get", "intensity"], 0], 0, 0, 1, 1],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 2, 15, 40],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 15, 0],
          },
        });

        safeAddLayer(map, {
          id: "route-line-glow",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0ea5e9",
            "line-width": 12,
            "line-opacity": 0.3,
            "line-blur": 4,
          },
        });

        safeAddLayer(map, {
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#38bdf8",
            "line-width": 6,
            "line-opacity": 0.92,
          },
        });

        safeAddLayer(map, {
          id: "island-points-circle",
          type: "circle",
          source: "island-points",
          paint: {
            "circle-radius": ["case", ["==", ["get", "id"], ""], 5, 6],
            "circle-color": "#34d399",
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": 0.95,
          },
        });

        safeAddLayer(map, {
          id: "island-points-labels",
          type: "symbol",
          source: "island-points",
          minzoom: 10,
          layout: {
            "text-field": ["coalesce", ["get", "title"], ["get", "name"], ["get", "label"]],
            "text-size": 11,
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#000000",
            "text-halo-width": 1.2,
          },
        });
        safeAddSource(map, "estates", {
          type: "geojson",
          data: ESTATES_URL,
          generateId: true,
        });
        safeAddLayer(map, {
          id: "estates-hitbox",
          source: "estates",
          type: "fill",
          paint: {
          "fill-color": "#ffffff",
          "fill-opacity": 0.01,
          },
        });

        const handleEstateClick = (event: MapLayerMouseEvent) => {
  if (!interactive) return;

  const feature = event.features?.[0];
  if (!feature) return;

  const selection = makeSelectionFromFeature(
    feature,
    [event.lngLat.lng, event.lngLat.lat],
    "estate",
  );

  const highlightKey =
    selection.geoid ||
    selection.name ||
    selection.title ||
    String(selection.id ?? "");

  setInternalHighlightEstate(highlightKey);
  emitSelection(selection);
};

map.on("click", "estates-hitbox", handleEstateClick);
map.on("click", "estates-fill", handleEstateClick);
map.on("click", "estates-boundaries", handleEstateClick);

map.on("mouseenter", "estates-hitbox", () => {
  if (interactive) map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "estates-hitbox", () => {
  map.getCanvas().style.cursor = "";
});

        map.on("click", "island-points-circle", (event: MapLayerMouseEvent) => {
          if (!interactive) return;
          const feature = event.features?.[0];
          if (!feature) return;

          const props = feature.properties || {};
          const match = points.find((point) => point.id === props.id);

          if (match) onSelectPoint?.(match);
          emitSelection(makeSelectionFromFeature(feature, [event.lngLat.lng, event.lngLat.lat], "point-marker"));
        });

        for (const layerId of ["estates-boundaries", "island-points-circle"]) {
          map.on("mouseenter", layerId, () => {
            if (interactive) map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
        }

        if (showParcels) attachParcelLayers(map);

        requestAnimationFrame(() => {
          if (!mounted) return;
          map.resize();
        });

        callLoadedOnce();
      } catch (error) {
        console.error("IslandMap setup failed:", error);
        setMapError(error instanceof Error ? error.message : "IslandMap setup failed.");
        callLoadedOnce();
      }
    });

    if (mapContainerRef.current && "ResizeObserver" in window) {
      resizeObserverRef.current = new ResizeObserver(() => {
        const currentMap = mapRef.current;
        if (!currentMap) return;
        window.requestAnimationFrame(() => {
          try {
            currentMap.resize();
          } catch {
            // ignore resize race
          }
        });
      });
      resizeObserverRef.current.observe(mapContainerRef.current);
    }

    return () => {
      mounted = false;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;

      try {
        map.remove();
      } catch {
        // ignore cleanup race
      }

      mapRef.current = null;
      parcelsLoadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("island-points") as GeoJSONSource | undefined;
    source?.setData(pointGeoJson);
  }, [pointGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const islandView = ISLAND_CENTERS[selectedIsland] ?? ISLAND_CENTERS.st_thomas;
    map.flyTo({
      center: islandView.center,
      zoom: islandView.zoom,
      pitch: 45,
      bearing: -10,
      duration: embedded ? 600 : 1100,
      essential: true,
    });
  }, [selectedIsland, embedded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    safeSetLayoutVisibility(map, "world-heat", showHeat);

    if (showParcels) attachParcelLayers(map);
    else {
      safeSetLayoutVisibility(map, "parcels-boundaries", false);
      safeSetLayoutVisibility(map, "parcels-fill", false);
      safeSetLayoutVisibility(map, "parcels-labels", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showParcels, showHeat, showParcelLabels]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    safeSetLayoutVisibility(map, "estates-labels", showEstateLabels);
    safeSetLayoutVisibility(map, "estates-boundaries", showEstateBoundaries);
    safeSetLayoutVisibility(map, "estates-boundaries-glow", showEstateBoundaries);
  }, [showEstateLabels, showEstateBoundaries]);

  useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const filter = makeHighlightFilter(effectiveHighlightEstate);
  safeSetFilter(map, "estates-fill", filter);
  safeSetFilter(map, "estates-boundaries-glow", filter);

  try {
    if (map.getLayer("estates-fill")) {
      map.setPaintProperty(
        "estates-fill",
        "fill-opacity",
        effectiveHighlightEstate ? 0.32 : 0,
      );
    }
  } catch {
    // ignore paint race
  }

  if (!effectiveHighlightEstate?.trim()) return;

  const timeoutId = window.setTimeout(() => {
    try {
      const renderedFeatures = safeQueryRenderedFeatures(map, {
        layers: ["estates-hitbox", "estates-boundaries", "estates-fill"],
      });

      const match = renderedFeatures.find((feature) =>
        featureMatchesEstate(feature, effectiveHighlightEstate),
      );

      if (match?.geometry) {
        const bbox = turf.bbox(match as unknown as GeoJSON.Feature) as [
          number,
          number,
          number,
          number,
        ];

        map.fitBounds(bbox, {
          padding: embedded ? 42 : 90,
          duration: embedded ? 750 : 1400,
          pitch: 50,
          bearing: -8,
          essential: true,
        });
      }
    } catch {
      // ignore missing feature
    }
  }, 180);

  return () => window.clearTimeout(timeoutId);
}, [effectiveHighlightEstate, embedded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const routeSource = map.getSource("route") as GeoJSONSource | undefined;
    if (!routeSource) return;

    pickupMarkerRef.current?.remove();
    dropoffMarkerRef.current?.remove();
    pickupMarkerRef.current = null;
    dropoffMarkerRef.current = null;

    const pickupCoords = getRoutePointCoords(pickup);
    const dropoffCoords = getRoutePointCoords(dropoff);
    const providedRoute = routeLineToFeature(routeLine);

    if (pickupCoords) {
      pickupMarkerRef.current = new mapboxgl.Marker({
        element: createMarkerElement("pickup"),
        anchor: "bottom",
      })
        .setLngLat(pickupCoords)
        .addTo(map);
    }

    if (dropoffCoords) {
      dropoffMarkerRef.current = new mapboxgl.Marker({
        element: createMarkerElement("dropoff"),
        anchor: "bottom",
      })
        .setLngLat(dropoffCoords)
        .addTo(map);
    }

    if (providedRoute) {
      routeSource.setData(providedRoute);

      try {
        const bbox = turf.bbox(providedRoute) as [number, number, number, number];
        map.fitBounds(bbox, {
          padding: embedded ? 42 : 90,
          duration: embedded ? 700 : 1200,
          pitch: 45,
        });
      } catch {
        // ignore bbox race
      }

      return;
    }

    if (!pickupCoords || !dropoffCoords) {
      routeSource.setData(emptyRoute);
      return;
    }

    const midpoint = turf.midpoint(turf.point(pickupCoords), turf.point(dropoffCoords));
    const distance = turf.distance(turf.point(pickupCoords), turf.point(dropoffCoords));
    const bearing = turf.bearing(turf.point(pickupCoords), turf.point(dropoffCoords));
    const offsetMidpoint = turf.destination(midpoint, distance * 0.18, bearing + 90);

    const curved = turf.bezierSpline(
      turf.lineString([
        pickupCoords,
        offsetMidpoint.geometry.coordinates as LngLatTuple,
        dropoffCoords,
      ]),
    ) as GeoJSON.Feature<GeoJSON.LineString>;

    routeSource.setData(curved);

    try {
      const bbox = turf.bbox(curved) as [number, number, number, number];
      map.fitBounds(bbox, {
        padding: embedded ? 42 : 90,
        duration: embedded ? 700 : 1200,
        pitch: 45,
      });
    } catch {
      // ignore bbox race
    }
  }, [pickup, dropoff, routeLine, embedded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;

    const center = getFocusCenter(focusTarget);
    if (!center) return;

    map.flyTo({
      center,
      zoom: focusTarget.zoom ?? 15,
      pitch: focusTarget.pitch ?? 60,
      bearing: focusTarget.bearing ?? -10,
      duration: embedded ? 750 : 1500,
      essential: true,
    });
  }, [focusTarget, embedded]);

  const wrapperClassName = embedded
    ? `relative w-full overflow-hidden bg-[#020617] ${className}`
    : `relative h-full min-h-[100dvh] w-full overflow-hidden bg-[#020617] ${className}`;

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isValidLngLatCenter(focusTarget?.center)) return;

    const runFocus = () => {
      if (!isValidLngLatCenter(focusTarget?.center)) return;

      map.resize();

      map.easeTo({
        center: focusTarget.center,
        zoom: focusTarget.zoom ?? 15.25,
        pitch: focusTarget.pitch ?? 66,
        bearing: focusTarget.bearing ?? -18,
        duration: 900,
        essential: true,
      });
    };

    if (map.loaded()) {
      window.setTimeout(runFocus, 150);
    } else {
      map.once("load", () => {
        window.setTimeout(runFocus, 150);
      });
    }
  }, [
    focusTarget?.center?.[0],
    focusTarget?.center?.[1],
    focusTarget?.zoom,
    focusTarget?.pitch,
    focusTarget?.bearing,
  ]);

  return (
    <div
      className={wrapperClassName}
      style={{
        width: "100%",
        height: embedded ? embeddedMapHeight ?? "100%" : "100dvh",
        minHeight: embedded ? embeddedMapHeight ?? "320px" : "100dvh",
        overflow: "hidden",
      }}
    >
      {!hasToken && (
        <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-[#020617] px-8 text-center font-mono text-emerald-300">
          <div className="text-xl font-bold uppercase tracking-wide text-white">
            System Configuration Required
          </div>
          <p className="max-w-lg text-sm text-gray-400">
            Please configure VITE_MAPBOX_ACCESS_TOKEN in your environment.
          </p>
        </div>
      )}

      {mapError && (
        <div className="absolute left-4 top-4 z-[9998] max-w-md rounded-2xl border border-yellow-500/30 bg-yellow-950/80 p-4 text-sm text-yellow-100 shadow-2xl backdrop-blur">
          <div className="font-bold text-yellow-200">Map warning</div>
          <div className="mt-1 opacity-90">{mapError}</div>
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="absolute inset-0 z-0 h-full w-full"
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: interactive ? "auto" : "none",
        }}
      />
    </div>
  );
}