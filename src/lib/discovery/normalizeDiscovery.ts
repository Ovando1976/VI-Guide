import type { IslandCode } from "../../types";
import type { UnifiedDiscoveryItem } from "../../types/discovery";

export function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function slugify(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeIsland(value?: unknown): IslandCode | undefined {
  const text = clean(value).toLowerCase();

  if (["st_thomas", "st thomas", "stt", "saint thomas"].includes(text)) {
    return "st_thomas";
  }

  if (["st_john", "st john", "stj", "saint john"].includes(text)) {
    return "st_john";
  }

  if (["st_croix", "st croix", "stx", "saint croix"].includes(text)) {
    return "st_croix";
  }

  if (["water_island", "water island", "wat"].includes(text)) {
    return "water_island";
  }

  return undefined;
}

export function validCoords(coords: unknown): { lat: number; lng: number } | undefined {
  if (!coords || typeof coords !== "object") return undefined;

  const value = coords as { lat?: unknown; lng?: unknown };
  const lat = Number(value.lat);
  const lng = Number(value.lng);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;
}

export function makeStableKey(input: {
  island?: IslandCode;
  name: string;
  estate?: string;
  coordinates?: { lat: number; lng: number };
}) {
  const island = input.island || "unknown";
  const name = slugify(input.name);
  const estate = slugify(input.estate || "");

  if (input.coordinates) {
    const lat = input.coordinates.lat.toFixed(4);
    const lng = input.coordinates.lng.toFixed(4);
    return `${island}:${name}:${lat}:${lng}`;
  }

  return `${island}:${name}:${estate || "no-estate"}`;
}

export function buildSearchText(item: Partial<UnifiedDiscoveryItem>) {
  return [
    item.name,
    item.title,
    item.kind,
    item.type,
    item.category,
    item.island,
    item.estate,
    item.address,
    item.description,
    item.phone,
    item.email,
    item.website,
    ...(item.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function mergeUnique<T>(a: T[] = [], b: T[] = []) {
  return Array.from(new Set([...a, ...b]));
}