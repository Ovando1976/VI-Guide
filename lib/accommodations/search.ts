import { ACCOMMODATIONS } from "./catalog";
import type { AccommodationRecord } from "./types";
import { verifiedAccommodationEstateGeoid } from "./verified-estate-geoids";

function withVerifiedEstate(item: AccommodationRecord): AccommodationRecord {
  const estateGeoid = verifiedAccommodationEstateGeoid(item.name, item.island);
  return estateGeoid ? { ...item, estateGeoid } : item;
}

export function getAccommodations(): readonly AccommodationRecord[] {
  return ACCOMMODATIONS.map(withVerifiedEstate);
}

export function getAccommodationBySlug(
  slug: string
): AccommodationRecord | null {
  const item = ACCOMMODATIONS.find((candidate) => candidate.slug === slug) ?? null;
  return item ? withVerifiedEstate(item) : null;
}

export function getAccommodationsByIsland(
  island: AccommodationRecord["island"]
): AccommodationRecord[] {
  return ACCOMMODATIONS.filter((item) => item.island === island).map(withVerifiedEstate);
}

export function getAccommodationsByCategory(
  category: AccommodationRecord["category"]
): AccommodationRecord[] {
  return ACCOMMODATIONS.filter((item) => item.category === category).map(withVerifiedEstate);
}

export function getFeaturedAccommodations(): AccommodationRecord[] {
  return ACCOMMODATIONS.filter((item) => item.featured === true).map(withVerifiedEstate);
}
