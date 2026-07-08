import { useEffect, useMemo } from "react";
import type { LatLngTuple } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import RoadRoutePolyline from "../maps/RoadRoutePolyline";

type PreviewLocation =
  | {
      lat?: number | string | null;
      lng?: number | string | null;
      latitude?: number | string | null;
      longitude?: number | string | null;
      name?: string;
      title?: string;
      label?: string;
      address?: string;
      island?: string;
      coordinates?: {
        lat?: number | string | null;
        lng?: number | string | null;
      };
      coords?: {
        lat?: number | string | null;
        lng?: number | string | null;
      };
      center?: [number, number];
      position?: [number, number];
    }
  | null
  | undefined;

type MobilityRoadPreviewMapProps = {
  origin?: PreviewLocation;
  destination?: PreviewLocation;
  title?: string;
  subtitle?: string;
};

const DEFAULT_ORIGIN: LatLngTuple = [18.3357, -64.9207];
const DEFAULT_DESTINATION: LatLngTuple = [18.3627, -64.9307];

function numberOrNull(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function toLatLng(location: PreviewLocation): LatLngTuple | null {
  if (!location) return null;

  if (Array.isArray(location.center) && location.center.length === 2) {
    const lat = numberOrNull(location.center[0]);
    const lng = numberOrNull(location.center[1]);
    return lat !== null && lng !== null ? [lat, lng] : null;
  }

  if (Array.isArray(location.position) && location.position.length === 2) {
    const lat = numberOrNull(location.position[0]);
    const lng = numberOrNull(location.position[1]);
    return lat !== null && lng !== null ? [lat, lng] : null;
  }

  const lat =
    numberOrNull(location.lat) ??
    numberOrNull(location.latitude) ??
    numberOrNull(location.coordinates?.lat) ??
    numberOrNull(location.coords?.lat);

  const lng =
    numberOrNull(location.lng) ??
    numberOrNull(location.longitude) ??
    numberOrNull(location.coordinates?.lng) ??
    numberOrNull(location.coords?.lng);

  return lat !== null && lng !== null ? [lat, lng] : null;
}

function labelFor(location: PreviewLocation, fallback: string) {
  return (
    location?.name ||
    location?.title ||
    location?.label ||
    location?.address ||
    fallback
  );
}

function readSavedMapDestination(): PreviewLocation {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem("viNavigatorRideDestination") || "null"
    );

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function FitPreviewRoute({ points }: { points: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    map.fitBounds(points, {
      padding: [34, 34],
      maxZoom: 14,
    });
  }, [map, points]);

  return null;
}

export default function MobilityRoadPreviewMap({
  origin,
  destination,
  title = "Road preview",
  subtitle = "Preview the ride on real roads before dispatch.",
}: MobilityRoadPreviewMapProps) {
  const savedDestination = useMemo(() => readSavedMapDestination(), []);

  const originPoint = toLatLng(origin) || DEFAULT_ORIGIN;
  const destinationPoint =
    toLatLng(destination) || toLatLng(savedDestination) || DEFAULT_DESTINATION;

  const routePoints = useMemo<LatLngTuple[]>(
    () => [originPoint, destinationPoint],
    [originPoint[0], originPoint[1], destinationPoint[0], destinationPoint[1]]
  );

  const originLabel = labelFor(origin, "Pickup / start");
  const destinationLabel = labelFor(
    destination || savedDestination,
    "Destination / dropoff"
  );

  return (
    <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Mobility route
          </p>
          <h2 className="mt-2 font-serif text-3xl">{title}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
            {subtitle}
          </p>
        </div>

        <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
          Road-following
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-stone-100">
        <MapContainer
          center={originPoint}
          zoom={12}
          scrollWheelZoom={false}
          className="h-[280px] w-full md:h-[360px]"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitPreviewRoute points={routePoints} />

          <RoadRoutePolyline
            points={routePoints}
            pathOptions={{
              color: "#007f5f",
              weight: 8,
              opacity: 0.92,
            }}
          />

          <RoadRoutePolyline
            points={routePoints}
            pathOptions={{
              color: "#40dcca",
              weight: 3,
              opacity: 0.98,
            }}
          />

          <CircleMarker
            center={originPoint}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#007f5f",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>{originLabel}</Popup>
          </CircleMarker>

          <CircleMarker
            center={destinationPoint}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              fillColor: "#ffcf32",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>{destinationLabel}</Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
            Pickup
          </p>
          <p className="mt-1 text-sm font-black">{originLabel}</p>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
            Dropoff
          </p>
          <p className="mt-1 text-sm font-black">{destinationLabel}</p>
        </div>
      </div>
    </section>
  );
}
