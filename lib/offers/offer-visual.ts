import { ALL_PUBLIC_TRAVEL_KNOWLEDGE } from "@/lib/travel-knowledge";

export type OfferVisualInput = {
  listingId: string;
  listingName: string;
  kind: "accommodation" | "tour" | "experience";
  island: "stt" | "stj" | "stx";
};

export type OfferVisual = {
  image: string;
  alt: string;
  source: "listing" | "island";
  sourceLabel: string;
};

const ISLAND_FALLBACKS: Record<OfferVisualInput["island"], { image: string; alt: string }> = {
  stt: {
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
  },
  stj: {
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay and the North Shore of St. John",
  },
  stx: {
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "St. Croix coastline at Cane Bay",
  },
};

export function getOfferVisual(input: OfferVisualInput): OfferVisual {
  const listingId = normalize(input.listingId);
  const listingName = normalize(input.listingName);
  const listing = ALL_PUBLIC_TRAVEL_KNOWLEDGE.find((item) => {
    if (item.island !== input.island) return false;
    const itemId = normalize(item.id);
    const itemSlug = normalize(item.slug);
    const itemName = normalize(item.name);
    return Boolean(
      (listingId && (itemId === listingId || itemSlug === listingId)) ||
        (listingName && itemName === listingName),
    );
  });

  if (listing?.heroImage) {
    return {
      image: listing.heroImage,
      alt: `${listing.name} in ${islandName(input.island)}`,
      source: "listing",
      sourceLabel: "Listing photo",
    };
  }

  const fallback = ISLAND_FALLBACKS[input.island];
  return {
    image: fallback.image,
    alt: fallback.alt,
    source: "island",
    sourceLabel: `${islandName(input.island)} context`,
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function islandName(island: OfferVisualInput["island"]) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}
