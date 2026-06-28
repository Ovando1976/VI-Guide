import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type EstateMiniMapProps = {
  estate: {
    geoid?: string | number;
    name: string;
    bbox?: [number, number, number, number];
    centroid?: {
      lat?: number | null;
      lng?: number | null;
    };
    geometry?: GeoJSON.Geometry | null;
  };
  height?: number;
};

const MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ||
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ||
  "";

function hasValidBbox(
  bbox: EstateMiniMapProps["estate"]["bbox"]
): bbox is [number, number, number, number] {
  return (
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    bbox.every((value) => typeof value === "number" && Number.isFinite(value))
  );
}

function getCenter(estate: EstateMiniMapProps["estate"]): [number, number] {
  const lat = estate.centroid?.lat;
  const lng = estate.centroid?.lng;

  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  ) {
    return [lng, lat];
  }

  if (hasValidBbox(estate.bbox)) {
    const [minLng, minLat, maxLng, maxLat] = estate.bbox;
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
  }

  return [-64.86, 18.08];
}

export default function EstateMiniMap({
  estate,
  height = 320,
}: EstateMiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const center = useMemo(() => getCenter(estate), [estate]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center,
      zoom: 14,
      pitch: 45,
      bearing: -12,
      antialias: true,
      interactive: true,
    });

    mapRef.current = map;

    const estateFeature: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: estate.geometry
        ? [
            {
              type: "Feature",
              properties: {
                geoid: estate.geoid,
                name: estate.name,
              },
              geometry: estate.geometry,
            },
          ]
        : [],
    };

    const marker = new mapboxgl.Marker({ color: "#10b981" })
      .setLngLat(center)
      .addTo(map);

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "bottom-right"
    );

    map.on("load", () => {
      map.addSource("estate", {
        type: "geojson",
        data: estateFeature,
      });

      map.addLayer({
        id: "estate-fill",
        type: "fill",
        source: "estate",
        paint: {
          "fill-color": "#10b981",
          "fill-opacity": 0.28,
        },
      });

      map.addLayer({
        id: "estate-outline-glow",
        type: "line",
        source: "estate",
        paint: {
          "line-color": "#ffffff",
          "line-width": 7,
          "line-opacity": 0.85,
          "line-blur": 2,
        },
      });

      map.addLayer({
        id: "estate-outline",
        type: "line",
        source: "estate",
        paint: {
          "line-color": "#34d399",
          "line-width": 3,
          "line-opacity": 1,
        },
      });

      if (hasValidBbox(estate.bbox)) {
        map.fitBounds(estate.bbox, {
          padding: 45,
          maxZoom: 15.5,
          duration: 900,
        });
      } else {
        map.flyTo({
          center,
          zoom: 14,
          duration: 700,
        });
      }

      setTimeout(() => map.resize(), 150);
    });

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [estate, center]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="grid place-items-center bg-stone-950 text-center text-sm font-bold text-emerald-300"
        style={{ height }}
      >
        Missing Mapbox token
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-b-[2rem]" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl bg-black/60 px-4 py-3 text-white shadow-xl backdrop-blur">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
          Estate Map
        </p>
        <p className="mt-1 text-sm font-black">{estate.name}</p>
      </div>

      <button
        type="button"
        onClick={() => {
          const [lng, lat] = center;
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            "_blank",
            "noopener,noreferrer"
          );
        }}
        className="absolute bottom-4 left-4 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-950 shadow-xl"
      >
        Directions
      </button>
    </div>
  );
}