import type { IslandCode } from "../../types";

export const ISLAND_META: Record<
  IslandCode,
  { label: string; short: string }
> = {
  st_thomas: { label: "St. Thomas", short: "STT" },
  st_john: { label: "St. John", short: "STJ" },
  st_croix: { label: "St. Croix", short: "STX" },
  water_island: { label: "Water Island", short: "WAT" },
};

export const DEFAULT_ISLAND: IslandCode = "st_thomas";

export const ISLAND_CENTERS: Record<IslandCode, { lat: number; lng: number }> = {
  st_thomas: { lat: 18.3434, lng: -64.9313 },
  st_john: { lat: 18.3333, lng: -64.7333 },
  st_croix: { lat: 17.7246, lng: -64.8348 },
  water_island: { lat: 18.3189, lng: -64.9533 },
};

export const ISLAND_OPTIONS = Object.entries(ISLAND_META).map(([value, meta]) => ({
  value: value as IslandCode,
  label: meta.label,
  short: meta.short,
}));
