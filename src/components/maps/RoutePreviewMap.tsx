import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type RoutePoint = {
  lat: number;
  lng: number;
};

type Props = {
  pickup: RoutePoint;
  dropoff: RoutePoint;
};

function isValidPoint(point: RoutePoint) {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

function FitMap({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;

    map.fitBounds(L.latLngBounds(points), {
      padding: [36, 36],
      maxZoom: 14,
    });

    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(timer);
  }, [map, points]);

  return null;
}

export default function RoutePreviewMap({ pickup, dropoff }: Props) {
  const fallbackRoute = useMemo<LatLngTuple[]>(
    () => [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng],
    ],
    [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng],
  );

  const [route, setRoute] = useState<LatLngTuple[]>(fallbackRoute);

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      if (!isValidPoint(pickup) || !isValidPoint(dropoff)) {
        setRoute(fallbackRoute);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) throw new Error(`OSRM failed: ${response.status}`);

        const data = await response.json();
        const coords = data?.routes?.[0]?.geometry?.coordinates;

        if (!Array.isArray(coords)) throw new Error("No road geometry.");

        const roadRoute: LatLngTuple[] = coords
          .map((coord: unknown): LatLngTuple | null => {
            if (!Array.isArray(coord)) return null;

            const [lng, lat] = coord;

            if (typeof lat !== "number" || typeof lng !== "number") return null;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

            return [lat, lng];
          })
          .filter((point): point is LatLngTuple => point !== null);

        if (!cancelled) {
          setRoute(roadRoute.length > 1 ? roadRoute : fallbackRoute);
        }
      } catch (error) {
        console.warn("Route preview road path failed. Using fallback line.", error);

        if (!cancelled) {
          setRoute(fallbackRoute);
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff, fallbackRoute]);

  return (
    <div className="h-full w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950">
      <MapContainer
        center={[pickup.lat, pickup.lng]}
        zoom={13}
        scrollWheelZoom={false}
        dragging
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Polyline
          positions={route}
          pathOptions={{
            color: "#34d399",
            weight: 5,
            opacity: 0.92,
          }}
        />

        <Marker position={[pickup.lat, pickup.lng]} />
        <Marker position={[dropoff.lat, dropoff.lng]} />

        <FitMap points={route} />
      </MapContainer>
    </div>
  );
}