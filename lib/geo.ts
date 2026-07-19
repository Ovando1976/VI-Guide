import type { EstateRecord, RouteQuote } from "@/types/usvi";
import { ISLAND_META } from "@/lib/usvi";

export type NearbyPlaceInput = {
  id: string;
  name: string;
  category: string;
  location?: string;
  lat?: number;
  lng?: number;
};

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const dLat = degToRad(b.lat - a.lat);
  const dLng = degToRad(b.lng - a.lng);

  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(a.lat)) *
      Math.cos(degToRad(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

export function buildQuote(
  from: EstateRecord,
  to: EstateRecord,
  vehicle: "executive" | "sprinter"
): RouteQuote {
  const distanceKm = haversineKm(from.internalPoint, to.internalPoint);
  const baseFare = 10 + distanceKm * 3.25;
  const vehicleMultiplier = vehicle === "executive" ? 1.45 : 1.9;
  const islandMultiplier = ISLAND_META[from.island].pricingMultiplier;
  const total = Math.round(baseFare * vehicleMultiplier * islandMultiplier);

  return {
    from,
    to,
    distanceKm: Number(distanceKm.toFixed(2)),
    baseFare: Number(baseFare.toFixed(2)),
    vehicleMultiplier,
    islandMultiplier,
    total,
  };
}

export function getNearbyPlaces(
  estate: EstateRecord,
  places: NearbyPlaceInput[],
  limit = 6
) {
  const origin = estate.internalPoint;

  return places
    .filter(
      (
        place
      ): place is NearbyPlaceInput & {
        lat: number;
        lng: number;
      } =>
        typeof place.lat === "number" &&
        Number.isFinite(place.lat) &&
        typeof place.lng === "number" &&
        Number.isFinite(place.lng)
    )
    .map((place) => ({
      ...place,
      distanceKm: haversineKm(origin, {
        lat: place.lat,
        lng: place.lng,
      }),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function getNearbyEstates(
  estate: EstateRecord,
  estates: EstateRecord[],
  limit = 6
) {
  return estates
    .filter(
      (item) => item.geoid !== estate.geoid && item.island === estate.island
    )
    .map((item) => ({
      ...item,
      distanceKm: haversineKm(estate.internalPoint, item.internalPoint),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export function haversineMiles(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);

  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
