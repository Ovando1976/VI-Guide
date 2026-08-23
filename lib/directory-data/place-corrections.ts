import type { DirectoryRecord } from "./types";

type PlaceCorrection = Partial<
  Pick<
    DirectoryRecord,
    | "name"
    | "description"
    | "sourceLabel"
    | "sourceUrl"
    | "sourceUrls"
    | "verifiedAt"
  >
>;

const VERIFIED_AT = "2026-08-23";

/**
 * Small, explicit corrections for imported place records whose display names
 * were damaged by source normalization. The source snapshot stays untouched so
 * provenance remains inspectable while every public directory surface receives
 * the governed record.
 */
export const PLACE_CORRECTIONS: Readonly<Record<string, PlaceCorrection>> =
  Object.freeze({
    "stt-arian-s": {
      name: "Arian's",
      description:
        "Arian's is a St. Thomas restaurant serving Caribbean and seafood dishes in the Sub Base area of Charlotte Amalie.",
      sourceLabel: "Current St. Thomas public directory cross-check",
      sourceUrl:
        "https://www.usvirealestate.com/real-estate-guides/st-thomas/",
      sourceUrls: [
        "https://www.usvirealestate.com/real-estate-guides/st-thomas/",
      ],
      verifiedAt: VERIFIED_AT,
    },
    "stt-bernie-s-bar-grill": {
      name: "Bernie's Bar & Grill",
      description:
        "Bernie's Bar & Grill is a casual Red Hook restaurant and sports bar at American Yacht Harbor.",
      sourceLabel: "St. Thomas Visitors Guide",
      sourceUrl: "https://www.stthomasvisitorsguide.com/casual-dining",
      sourceUrls: [
        "https://www.stthomasvisitorsguide.com/casual-dining",
        "https://www.igymarinas.com/directory-local-business/",
      ],
      verifiedAt: VERIFIED_AT,
    },
  });

/**
 * Known synthetic ingestion collisions that should never be presented as real
 * local businesses. The underlying imported snapshot is preserved for audit,
 * but these IDs are excluded from public place discovery.
 */
export const EXCLUDED_PLACE_IDS: ReadonlySet<string> = new Set([
  "stt-bluebeard-s-castle-hilltop-villas-marriott-s-frenchman-s-cove-timeshares",
]);

export const PLACE_CORRECTION_IDS = Object.freeze(Object.keys(PLACE_CORRECTIONS));

export function applyPlaceCorrection(record: DirectoryRecord): DirectoryRecord {
  const correction = PLACE_CORRECTIONS[record.id];
  return correction ? { ...record, ...correction } : record;
}

export function shouldPublishPlace(record: DirectoryRecord): boolean {
  return !EXCLUDED_PLACE_IDS.has(record.id);
}
