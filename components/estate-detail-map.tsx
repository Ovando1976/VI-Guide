"use client";

import { useEffect, useMemo } from "react";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { EstateRecord } from "@/types/usvi";

type Props = {
  estate: EstateRecord;
};

const estatePin = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #b9772b;
      border: 3px solid white;
      box-shadow: 0 8px 24px rgba(0,0,0,0.24);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export function EstateDetailMap({ estate }: Props) {
  const rings = useMemo(() => getEstatePolygonRings(estate), [estate]);
  const center = useMemo(() => getEstateCenter(estate), [estate]);
  const bounds = useMemo(() => getEstateBounds(estate), [estate]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="h-[440px] w-full">
        <MapContainer
          center={center}
          zoom={14}
          zoomControl={false}
          className="h-full w-full bg-[#edf1e6]"
          preferCanvas
          touchZoom={true}
          doubleClickZoom={false}
        >
          <ZoomControl position="topleft" />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {rings.length ? (
            <>
              <Polygon
                positions={rings}
                pathOptions={{
                  color: "#5f785d",
                  weight: 6,
                  fillColor: "#7f9b79",
                  fillOpacity: 0.12,
                  opacity: 0.9,
                }}
              />
              <Polygon
                positions={rings}
                pathOptions={{
                  color: "#5f785d",
                  weight: 3,
                  fillColor: "#b7c7b1",
                  fillOpacity: 0.34,
                  opacity: 1,
                }}
              >
                <Tooltip direction="center" permanent opacity={1}>
                  <div className="rounded-full border border-[#d9d2c1] bg-[#f8f4ea]/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#243526] shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
                    {estate.baseName}
                  </div>
                </Tooltip>

                <Popup>
                  <div className="min-w-[220px]">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Estate boundary
                    </div>
                    <div className="mt-1 text-lg font-black text-slate-900">
                      {estate.baseName}
                    </div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {estate.fullName || "Official estate geography"}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            </>
          ) : null}

          <Marker position={center} icon={estatePin}>
            <Popup>
              <div className="min-w-[220px]">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Estate center
                </div>
                <div className="mt-1 text-lg font-black text-slate-900">
                  {estate.baseName}
                </div>
              </div>
            </Popup>
          </Marker>

          <FitEstateBounds bounds={bounds} center={center} />
        </MapContainer>
      </div>
    </div>
  );
}

function FitEstateBounds({
  bounds,
  center,
}: {
  bounds: LatLngBoundsExpression | null;
  center: LatLngExpression;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, {
        padding: [28, 28],
        animate: true,
      });
      return;
    }

    map.setView(center, 14, { animate: true });
  }, [map, bounds, center]);

  return null;
}

function getEstateCenter(estate: EstateRecord): LatLngExpression {
  const point = estateInternalPoint(estate);
  if (point) return [point.lat, point.lng];

  const rings = getEstatePolygonRings(estate);
  if (rings.length && rings[0].length) {
    return centroidOfRing(rings[0]);
  }

  return [18.336, -64.93];
}

function getEstateBounds(estate: EstateRecord): LatLngBoundsExpression | null {
  const rings = getEstatePolygonRings(estate);
  if (!rings.length) {
    const center = getEstateCenter(estate);
    const [lat, lng] = toLatLngTuple(center);
    return [
      [lat - 0.01, lng - 0.01],
      [lat + 0.01, lng + 0.01],
    ];
  }

  const flat = rings.flat();
  if (!flat.length) return null;

  return L.latLngBounds(flat as LatLngExpression[]);
}

function getEstatePolygonRings(estate: EstateRecord): LatLngExpression[][] {
  const { geometry } = estate;

  switch (geometry.type) {
    case "Polygon":
      return polygonCoordinatesToLeaflet(geometry.coordinates);

    case "MultiPolygon":
      return geometry.coordinates.flatMap((polygon) =>
        polygonCoordinatesToLeaflet(polygon)
      );
  }
}

function polygonCoordinatesToLeaflet(
  coordinates: GeoJSON.Position[][]
): LatLngExpression[][] {
  return coordinates
    .map((ring) =>
      ring
        .map(([lng, lat]) => {
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
          }

          return [lat, lng] as LatLngExpression;
        })
        .filter((point): point is LatLngExpression => point !== null)
    )
    .filter((ring) => ring.length >= 3);
}

function centroidOfRing(ring: LatLngExpression[]): LatLngExpression {
  if (!ring.length) return [18.336, -64.93];

  const points = ring.map(toLatLngTuple);

  const usablePoints =
    points.length > 1 &&
    points[0][0] === points.at(-1)?.[0] &&
    points[0][1] === points.at(-1)?.[1]
      ? points.slice(0, -1)
      : points;

  if (!usablePoints.length) return [18.336, -64.93];

  const total = usablePoints.reduce(
    (acc, [lat, lng]) => ({
      lat: acc.lat + lat,
      lng: acc.lng + lng,
    }),
    { lat: 0, lng: 0 }
  );

  return [total.lat / usablePoints.length, total.lng / usablePoints.length];
}

function estateInternalPoint(
  estate: EstateRecord
): { lat: number; lng: number } | null {
  const { lat, lng } = estate.internalPoint;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return { lat, lng };
}

function toLatLngTuple(value: LatLngExpression): [number, number] {
  if (Array.isArray(value)) {
    return [value[0], value[1]];
  }

  if (value instanceof L.LatLng) {
    return [value.lat, value.lng];
  }

  return [18.336, -64.93];
}
