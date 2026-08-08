import { ALL_PUBLIC_TRAVEL_KNOWLEDGE } from "@/lib/travel-knowledge";
import type { JourneyPlace } from "@/lib/smart-island-journey";

export function getJourneyCatalogPlaces(): JourneyPlace[] {
  const seen = new Set<string>();

  return ALL_PUBLIC_TRAVEL_KNOWLEDGE
    .filter(
      (item) =>
        typeof item.lat === "number" &&
        Number.isFinite(item.lat) &&
        typeof item.lng === "number" &&
        Number.isFinite(item.lng),
    )
    .map((item) => ({
      id: `catalog:${item.id}`,
      label: item.name,
      island: item.island,
      kind: item.category.toLowerCase().includes("beach")
        ? "beach"
        : item.category.toLowerCase().includes("airport")
          ? "airport"
          : "destination",
      terminalTransfers: {},
      lat: item.lat,
      lng: item.lng,
      sourceHref: directoryHref(item.category, item.slug),
    }) satisfies JourneyPlace)
    .filter((place) => {
      const key = `${place.island}:${place.label.trim().toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

function directoryHref(category: string, slug: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("beach")) return `/beaches/${slug}`;
  if (normalized.includes("stay") || normalized.includes("hotel") || normalized.includes("resort")) {
    return `/accommodations/${slug}`;
  }
  if (normalized.includes("historic") || normalized.includes("heritage")) {
    return `/historic/${slug}`;
  }
  return `/places/${slug}`;
}
