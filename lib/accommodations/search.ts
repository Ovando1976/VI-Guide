import { ACCOMMODATIONS } from "./loader";
import type { AccommodationRecord } from "./types";

export function getAccommodations(): readonly AccommodationRecord[] {
  return ACCOMMODATIONS;
}

export function getAccommodationBySlug(
  slug: string
): AccommodationRecord | null {
  return ACCOMMODATIONS.find((item) => item.slug === slug) ?? null;
}

export function getAccommodationsByIsland(
  island: AccommodationRecord["island"]
): AccommodationRecord[] {
  return ACCOMMODATIONS.filter((item) => item.island === island);
}

export function getAccommodationsByCategory(
  category: AccommodationRecord["category"]
): AccommodationRecord[] {
  return ACCOMMODATIONS.filter((item) => item.category === category);
}

export function getFeaturedAccommodations(): AccommodationRecord[] {
  return ACCOMMODATIONS.filter((item) => item.featured === true);
}