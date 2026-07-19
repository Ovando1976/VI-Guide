import coordinateRegistry from "@/data/territory-coordinates.json";
import type { IslandCode, LngLat } from "@/types/usvi";

export type CoordinateRecord = {
  lat: number;
  lng: number;
  provider: "google-places" | "manual" | "source-data" | "nps-nrhp";
  placeId?: string;
  formattedAddress?: string;
  matchedName?: string;
  confidence: number;
  resolvedAt: string;
};

const REGISTRY = coordinateRegistry as Record<string, CoordinateRecord>;

export function coordinateKey(island: IslandCode, slugOrId: string) {
  return `${island}:${normalize(slugOrId)}`;
}

export function getRegisteredCoordinate(
  island: IslandCode,
  slugOrId: string,
): CoordinateRecord | null {
  const value = REGISTRY[coordinateKey(island, slugOrId)];
  if (!value || !validCoordinate(value)) return null;
  return value;
}

export function resolveCoordinate(
  island: IslandCode,
  slugOrId: string,
  source?: { lat?: unknown; lng?: unknown },
): { position?: LngLat; record?: CoordinateRecord } {
  if (typeof source?.lat === "number" && typeof source?.lng === "number") {
    return {
      position: { lat: source.lat, lng: source.lng },
      record: {
        lat: source.lat,
        lng: source.lng,
        provider: "source-data",
        confidence: 1,
        resolvedAt: "source-data",
      },
    };
  }

  const record = getRegisteredCoordinate(island, slugOrId);
  return record ? { position: { lat: record.lat, lng: record.lng }, record } : {};
}

function validCoordinate(value: CoordinateRecord) {
  return (
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  );
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
