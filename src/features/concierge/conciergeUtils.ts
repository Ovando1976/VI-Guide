import type { IslandCode } from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import type { Listing } from "./conciergeTypes";

export const ISLAND_LABELS: Partial<Record<IslandCode, string>> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

export function normalizeIsland(value?: string | null): IslandCode {
  if (value === "stt" || value === "st_thomas") return "st_thomas";
  if (value === "stj" || value === "st_john") return "st_john";
  if (value === "stx" || value === "st_croix") return "st_croix";
  if (value === "wat" || value === "water_island") return "water_island";
  return "st_thomas";
}

export function islandLabel(value?: string | null): string {
  return ISLAND_LABELS[normalizeIsland(value)] || "USVI";
}

export function getTitle(item: Listing): string {
  return String(
    ("title" in item && item.title) ||
      ("name" in item && item.name) ||
      item.id ||
      "Untitled",
  );
}

export function getImage(item: Listing): string {
  const loose = item as Listing & {
    imageUrl?: string;
    coverImage?: string;
    image?: string;
    photoUrl?: string;
    thumbnailUrl?: string;
  };

  return (
    loose.coverImage ||
    loose.imageUrl ||
    loose.image ||
    loose.photoUrl ||
    loose.thumbnailUrl ||
    "/images/placeholder-island.jpg"
  );
}

export function getSourceLabel(item: GeographicIndexItem): string {
  if (item.source === "estate") return "Estate";
  if (item.source === "historicSite") return "Historic Site";
  if (item.source === "archive") return "Archive";
  if (item.source === "dictionary") return "Dictionary";
  if (item.source === "beach") return "Beach";
  return item.category || item.type || "Place";
}

export function resultPath(item: GeographicIndexItem, island: IslandCode) {
  if (item.source === "beach") {
    return `/explore?island=${item.island ?? island}&q=${encodeURIComponent(item.name)}`;
  }

  if (item.source === "estate") {
    return `/estates/${encodeURIComponent(item.estateId || item.id)}?island=${
      item.island ?? island
    }`;
  }

  if (item.source === "historicSite") {
    return `/historic-sites/${encodeURIComponent(item.id)}?island=${
      item.island ?? island
    }`;
  }

  return `/dictionary?q=${encodeURIComponent(item.name)}`;
}
