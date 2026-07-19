import { BEACHES } from "./loader";
import type { BeachRecord } from "./types";

export function getBeaches(): readonly BeachRecord[] {
  return BEACHES;
}

export function getBeachBySlug(slug: string): BeachRecord | null {
  return BEACHES.find((beach) => beach.slug === slug) ?? null;
}

export function getBeachesByIsland(
  island: BeachRecord["island"]
): BeachRecord[] {
  return BEACHES.filter((beach) => beach.island === island);
}

export function getFeaturedBeaches(): BeachRecord[] {
  return BEACHES.filter((beach) => beach.featured === true);
}
