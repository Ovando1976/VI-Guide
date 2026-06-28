// src/components/maps/EstateMiniMap.tsx
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type EstateMiniMapProps = {
  estate: {
    geoid?: string | number;
    name: string;
    bbox?: [number, number, number, number];
    centroid?: { lat?: number | null; lng?: number | null };
    geometry?: GeoJSON.Geometry | null;
  };
  height?: number;
  interactive?: boolean;
  showControls?: boolean;
};

type LngLatTuple = [number, number];

function hasValidBbox(
  bbox: EstateMiniMapProps["estate"]["bbox"]
): bbox is [number, number, number, number] {
  return (
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    bbox.every((value) => typeof value === "number" && Number.isFinite(value))
  );
}

function getCenter(estate: EstateMiniMapProps["estate"]): LngLatTuple {
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

function bboxToLeafletBounds(bbox: [number, number, number, number]) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
}

function makeEstateFeature(
  estate: EstateMiniMapProps["estate"]
): GeoJSON.FeatureCollection {
  return {
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
}

export default function EstateMiniMap({
  estate,
  height = 220,
  interactive = false,
  showControls = false,
}: EstateMiniMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const estateLayerRef = useRef<L.GeoJSON | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const center = useMemo(() => getCenter(estate), [estate]);
  const estateFeature = useMemo(() => makeEstateFeature(estate), [estate]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const [lng, lat] = center;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      zoomControl: showControls,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      touchZoom: interactive,
    });

    mapRef.current = map;

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
      }
    ).addTo(map);

    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        opacity: 0.85,
      }
    ).addTo(map);

    estateLayerRef.current = L.geoJSON(estateFeature, {
      style: {
        color: "#34d399",
        weight: 3,
        opacity: 1,
        fillColor: "#10b981",
        fillOpacity: 0.24,
      },
    }).addTo(map);

    markerRef.current = L.circleMarker([lat, lng], {
      radius: 6,
      color: "#ffffff",
      weight: 2,
      fillColor: "#10b981",
      fillOpacity: 1,
    }).addTo(map);

    setTimeout(() => {
      map.invalidateSize();

      if (hasValidBbox(estate.bbox)) {
        map.fitBounds(bboxToLeafletBounds(estate.bbox), {
          padding: [28, 28],
          maxZoom: 16,
          animate: false,
        });
      } else if (estateLayerRef.current?.getBounds().isValid()) {
        map.fitBounds(estateLayerRef.current.getBounds(), {
          padding: [28, 28],
          maxZoom: 16,
          animate: false,
        });
      } else {
        map.setView([lat, lng], 14);
      }
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      estateLayerRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const [lng, lat] = center;

    estateLayerRef.current?.clearLayers();
    estateLayerRef.current?.addData(estateFeature);

    markerRef.current?.setLatLng([lat, lng]);

    setTimeout(() => {
      map.invalidateSize();

      if (hasValidBbox(estate.bbox)) {
        map.fitBounds(bboxToLeafletBounds(estate.bbox), {
          padding: [28, 28],
          maxZoom: 16,
          animate: true,
        });
      } else if (estateLayerRef.current?.getBounds().isValid()) {
        map.fitBounds(estateLayerRef.current.getBounds(), {
          padding: [28, 28],
          maxZoom: 16,
          animate: true,
        });
      } else {
        map.setView([lat, lng], 14);
      }
    }, 80);
  }, [center, estateFeature, estate.bbox]);

  return (
    <div className="relative overflow-hidden rounded-b-[2rem]" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.08),transparent_35%),linear-gradient(to_bottom,rgba(2,6,23,0.02),rgba(2,6,23,0.42))]" />

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-white shadow-xl backdrop-blur">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300">
          Estate Map
        </p>
        <p className="mt-1 text-sm font-black">Estate {estate.name}</p>
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
        className="absolute bottom-4 left-4 z-20 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-stone-950 shadow-xl"
      >
        Directions
      </button>
    </div>
  );
}