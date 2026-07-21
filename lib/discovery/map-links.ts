import type { DirectoryItem } from "@/types/directory";
import type { TerritoryMapPlaceType } from "@/types/territory-map";

const MAP_PLACE_TYPES = new Set<TerritoryMapPlaceType>([
  "place",
  "beach",
  "stay",
  "historic",
]);

export type DiscoveryMapTarget = {
  id: string;
  name: string;
  slug?: string;
  island: "stt" | "stj" | "stx";
  type: TerritoryMapPlaceType;
  lat?: number | null;
  lng?: number | null;
  location?: string | null;
  description?: string | null;
  rating?: number | null;
  estateGeoid?: string | null;
};

export function buildDiscoveryMapHref(target: DiscoveryMapTarget) {
  const params = new URLSearchParams({
    island: target.island,
    lens: lensForType(target.type),
  });

  if (
    typeof target.lat === "number" &&
    Number.isFinite(target.lat) &&
    typeof target.lng === "number" &&
    Number.isFinite(target.lng)
  ) {
    params.set("place", target.id);
    params.set("placeName", target.name);
    params.set("placeType", target.type);
    params.set("placeLat", String(target.lat));
    params.set("placeLng", String(target.lng));
    setBounded(params, "placeLocation", target.location, 300);
    setBounded(params, "placeDescription", target.description, 1000);
    if (
      typeof target.rating === "number" &&
      Number.isFinite(target.rating) &&
      target.rating >= 0 &&
      target.rating <= 5
    ) {
      params.set("placeRating", String(target.rating));
    }
  } else if (target.estateGeoid) {
    params.set("estate", target.estateGeoid);
  } else {
    params.set("q", target.name);
  }

  return `/map?${params.toString()}`;
}

export function buildDirectoryMapHref(
  item: DirectoryItem,
  type: TerritoryMapPlaceType,
) {
  if (!MAP_PLACE_TYPES.has(type)) {
    throw new Error(`Unsupported discovery map type: ${type}`);
  }

  return buildDiscoveryMapHref({
    id: item.id,
    name: item.name,
    slug: item.slug,
    island: item.island,
    type,
    lat: item.lat,
    lng: item.lng,
    location: item.address,
    description: item.description,
    estateGeoid: item.estateGeoid,
  });
}

function lensForType(type: TerritoryMapPlaceType) {
  if (type === "beach") return "beaches";
  if (type === "stay") return "stays";
  if (type === "historic") return "historic";
  return "places";
}

function setBounded(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
  maxLength: number,
) {
  const normalized = value?.trim();
  if (normalized) params.set(key, normalized.slice(0, maxLength));
}
