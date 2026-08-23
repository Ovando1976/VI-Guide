import type { DirectoryRecord } from "./types";

const VERIFIED_AT = "2026-08-23";

const STT_SOURCE =
  "https://www.visitusvi.com/experience/st-thomas-restaurants/";
const STJ_SOURCE =
  "https://www.visitusvi.com/experience/st-john-restaurants/";
const STX_SOURCE =
  "https://www.visitusvi.com/experience/top-restaurants-on-st-croix/";

/**
 * Current, destination-authority dining records that are absent from the
 * imported place snapshot. The snapshot stays untouched for auditability;
 * these records are merged into the canonical public place catalog by the
 * directory loader.
 *
 * Exact-location imagery is intentionally not claimed here. Each restored
 * record uses a purpose-built island Dining fallback until a venue-specific
 * image is reviewed.
 */
export const RESTORED_DINING_RECORDS: readonly DirectoryRecord[] = Object.freeze([
  {
    id: "stt-the-shack-at-the-hideaway",
    slug: "the-shack-at-the-hideaway",
    name: "The Shack at The Hideaway",
    island: "stt",
    category: "food",
    description:
      "The Shack at The Hideaway is a St. Thomas dining stop at The Hideaway at Hull Bay, highlighted in the current Visit USVI St. Thomas restaurant guide.",
    heroImage: "/images/places/fallbacks/dining-stt.svg",
    tags: ["food", "stt", "Hull Bay", "Visit USVI"],
    featured: true,
    bestFor: ["island dining", "Hull Bay"],
    hours: [],
    amenities: [],
    accessNotes: ["Confirm current hours and reservations with the venue before traveling."],
    safetyNotes: [],
    sourceLabel: "Visit USVI · St. Thomas restaurants",
    sourceUrl: STT_SOURCE,
    sourceUrls: [STT_SOURCE],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "stt-island-view-steakhouse",
    slug: "island-view-steakhouse",
    name: "Island View Steakhouse",
    island: "stt",
    category: "food",
    description:
      "Island View Steakhouse is a St. Thomas restaurant included in the current Visit USVI destination dining guide.",
    heroImage: "/images/places/fallbacks/dining-stt.svg",
    tags: ["food", "stt", "steakhouse", "Visit USVI"],
    featured: false,
    bestFor: ["dinner", "steakhouse"],
    hours: [],
    amenities: [],
    accessNotes: ["Confirm current hours and reservations with the venue before traveling."],
    safetyNotes: [],
    sourceLabel: "Visit USVI · St. Thomas restaurants",
    sourceUrl: STT_SOURCE,
    sourceUrls: [STT_SOURCE],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "stj-lime-out",
    slug: "lime-out",
    name: "Lime Out",
    island: "stj",
    category: "food",
    description:
      "Lime Out is a floating taco restaurant in Coral Bay Harbor on St. John, highlighted by Visit USVI and reached by boat rather than by road.",
    heroImage: "/images/places/fallbacks/dining-stj.svg",
    tags: ["food", "stj", "Coral Bay", "boat access", "Visit USVI"],
    featured: true,
    bestFor: ["boat day", "lunch", "Coral Bay"],
    hours: [],
    amenities: [],
    accessNotes: [
      "Boat access is required; confirm current operating details and transportation before departure.",
    ],
    safetyNotes: [],
    sourceLabel: "Visit USVI · St. John restaurants",
    sourceUrl: STJ_SOURCE,
    sourceUrls: [STJ_SOURCE],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "stj-zozos-at-caneel-bay",
    slug: "zozos-at-caneel-bay",
    name: "ZoZo's at Caneel Bay",
    island: "stj",
    category: "food",
    description:
      "ZoZo's at Caneel Bay is a St. John dining destination at Caneel Bay included in the current Visit USVI restaurant guide.",
    heroImage: "/images/places/fallbacks/dining-stj.svg",
    tags: ["food", "stj", "Caneel Bay", "Visit USVI"],
    featured: false,
    bestFor: ["dinner", "Caneel Bay"],
    hours: [],
    amenities: [],
    accessNotes: ["Confirm current hours, access, and reservations with the venue before traveling."],
    safetyNotes: [],
    sourceLabel: "Visit USVI · St. John restaurants",
    sourceUrl: STJ_SOURCE,
    sourceUrls: [STJ_SOURCE],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "stx-ama-at-cane-bay",
    slug: "ama-at-cane-bay",
    name: "AMA at Cane Bay",
    island: "stx",
    category: "food",
    description:
      "AMA at Cane Bay is an oceanfront St. Croix restaurant at Cane Bay highlighted by Visit USVI for seafood-focused dining.",
    heroImage: "/images/places/fallbacks/dining-stx.svg",
    tags: ["food", "stx", "Cane Bay", "seafood", "Visit USVI"],
    featured: true,
    bestFor: ["oceanfront dining", "seafood", "Cane Bay"],
    hours: [],
    amenities: [],
    accessNotes: ["Confirm current hours and reservations with the venue before traveling."],
    safetyNotes: [],
    sourceLabel: "Visit USVI · St. Croix restaurants",
    sourceUrl: STX_SOURCE,
    sourceUrls: [STX_SOURCE],
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "stx-the-landing-beach-bar",
    slug: "the-landing-beach-bar",
    name: "The Landing Beach Bar",
    island: "stx",
    category: "food",
    description:
      "The Landing Beach Bar is a casual open-air restaurant at Cane Bay Beach on St. Croix included in the current Visit USVI dining guide.",
    heroImage: "/images/places/fallbacks/dining-stx.svg",
    tags: ["food", "stx", "Cane Bay", "beachfront", "Visit USVI"],
    featured: false,
    bestFor: ["beach day", "casual dining", "Cane Bay"],
    hours: [],
    amenities: [],
    accessNotes: ["Confirm current hours and any live-music schedule with the venue before traveling."],
    safetyNotes: [],
    sourceLabel: "Visit USVI · St. Croix restaurants",
    sourceUrl: STX_SOURCE,
    sourceUrls: [STX_SOURCE],
    verifiedAt: VERIFIED_AT,
  },
]);

export const RESTORED_DINING_NAMES = Object.freeze(
  RESTORED_DINING_RECORDS.map((record) => record.name),
);

const ids = new Set<string>();
const slugs = new Set<string>();
for (const record of RESTORED_DINING_RECORDS) {
  if (ids.has(record.id)) {
    throw new TypeError(`Duplicate restored dining id: ${record.id}`);
  }
  if (slugs.has(record.slug)) {
    throw new TypeError(`Duplicate restored dining slug: ${record.slug}`);
  }
  if (record.category !== "food") {
    throw new TypeError(`${record.id} must use the canonical restored dining category: food`);
  }
  if (!record.sourceUrl?.startsWith("https://www.visitusvi.com/")) {
    throw new TypeError(`${record.id} must retain Visit USVI provenance`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.verifiedAt ?? "")) {
    throw new TypeError(`${record.id} must include a valid verifiedAt date`);
  }
  if (record.heroImage !== `/images/places/fallbacks/dining-${record.island}.svg`) {
    throw new TypeError(`${record.id} must use the truthful island Dining fallback`);
  }
  ids.add(record.id);
  slugs.add(record.slug);
}
