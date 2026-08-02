import type {
  IntelligenceIsland,
  IntelligencePlanStop,
  IntelligenceRecommendation,
} from "@/types/intelligence";

export const VI_MAP_FOCUS_EVENT = "vi-guide:map-focus";

export type IntelligenceMapFocusDetail = {
  id: string;
  title: string;
  kind: string;
  island: IntelligenceIsland;
  lat?: number;
  lng?: number;
  href?: string;
  source: "concierge-recommendation" | "concierge-itinerary";
};

export function dispatchIntelligenceMapFocus(
  item: IntelligenceRecommendation | IntelligencePlanStop,
  source: IntelligenceMapFocusDetail["source"],
) {
  if (typeof window === "undefined") return;

  const placeId = "placeId" in item ? item.placeId : undefined;
  const detail: IntelligenceMapFocusDetail = {
    id: placeId ?? item.id,
    title: item.title,
    kind: item.kind,
    island: item.island,
    ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
    ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
    ...(item.mapHref ? { href: item.mapHref } : {}),
    source,
  };

  window.dispatchEvent(
    new CustomEvent<IntelligenceMapFocusDetail>(VI_MAP_FOCUS_EVENT, {
      detail,
    }),
  );
}
