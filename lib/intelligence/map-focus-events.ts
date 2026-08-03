"use client";

import type { TripItem } from "@/components/trip-planner/trip-types";
import type {
  IntelligencePlanStop,
  IntelligenceRecommendation,
  IntelligenceResponse,
} from "@/types/intelligence";
import type {
  TerritoryMapLens,
  TerritoryMapPlaceType,
} from "@/types/territory-map";
import type { IslandCode } from "@/types/usvi";

export const VI_MAP_FOCUS_EVENT = "vi-guide:map-focus";
const PENDING_FOCUS_KEY = "vi-guide.pending-map-focus";

export type LivingMapFocusSource =
  | "concierge-response"
  | "concierge-recommendation"
  | "concierge-itinerary"
  | "saved-stop"
  | "map-workspace"
  | "external-link";

export type LivingMapFocusItem = {
  id: string;
  title: string;
  kind: string;
  island: IslandCode;
  lat?: number;
  lng?: number;
  href?: string;
  mapHref?: string;
  summary?: string;
};

export type LivingMapFocusDetail = {
  source: LivingMapFocusSource;
  items: LivingMapFocusItem[];
  primaryId: string;
  issuedAt: string;
};

type IntelligenceFocusItem =
  | IntelligenceRecommendation
  | IntelligencePlanStop;

function boundedText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function finiteCoordinate(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : undefined;
}

function validIsland(value: unknown): IslandCode | null {
  return value === "stt" || value === "stj" || value === "stx"
    ? value
    : null;
}

function normalizeFocusItem(value: unknown): LivingMapFocusItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<LivingMapFocusItem>;
  const id = boundedText(item.id, 180);
  const title = boundedText(item.title, 220);
  const kind = boundedText(item.kind, 100) ?? "place";
  const island = validIsland(item.island);
  if (!id || !title || !island) return null;

  return {
    id,
    title,
    kind,
    island,
    ...(finiteCoordinate(item.lat, -90, 90) !== undefined
      ? { lat: finiteCoordinate(item.lat, -90, 90) }
      : {}),
    ...(finiteCoordinate(item.lng, -180, 180) !== undefined
      ? { lng: finiteCoordinate(item.lng, -180, 180) }
      : {}),
    ...(boundedText(item.href, 1_200) ? { href: boundedText(item.href, 1_200) } : {}),
    ...(boundedText(item.mapHref, 1_200)
      ? { mapHref: boundedText(item.mapHref, 1_200) }
      : {}),
    ...(boundedText(item.summary, 1_000)
      ? { summary: boundedText(item.summary, 1_000) }
      : {}),
  };
}

function intelligenceItemToFocusItem(
  item: IntelligenceFocusItem,
): LivingMapFocusItem {
  const placeId = "placeId" in item ? item.placeId : undefined;
  return {
    id: placeId ?? item.id,
    title: item.title,
    kind: item.kind,
    island: item.island,
    ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
    ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
    ...(item.href ? { href: item.href } : {}),
    ...(item.mapHref ? { mapHref: item.mapHref } : {}),
    ...(item.summary ? { summary: item.summary } : {}),
  };
}

export function tripItemToMapFocusItem(item: TripItem): LivingMapFocusItem {
  return {
    id: item.id,
    title: item.name,
    kind: item.kind,
    island: item.island,
    ...(typeof item.lat === "number" ? { lat: item.lat } : {}),
    ...(typeof item.lng === "number" ? { lng: item.lng } : {}),
    ...(item.href ? { href: item.href } : {}),
    ...(item.mapHref ? { mapHref: item.mapHref } : {}),
    ...(item.description ? { summary: item.description } : {}),
  };
}

export function createLivingMapFocusDetail(
  items: LivingMapFocusItem[],
  source: LivingMapFocusSource,
  primaryId?: string,
): LivingMapFocusDetail | null {
  const normalized = items
    .map(normalizeFocusItem)
    .filter((item): item is LivingMapFocusItem => Boolean(item));
  const deduped = Array.from(
    new Map(normalized.map((item) => [`${item.island}:${item.id}`, item])).values(),
  ).slice(0, 12);
  if (!deduped.length) return null;

  return {
    source,
    items: deduped,
    primaryId:
      deduped.find((item) => item.id === primaryId)?.id ?? deduped[0].id,
    issuedAt: new Date().toISOString(),
  };
}

export function dispatchLivingMapFocus(detail: LivingMapFocusDetail) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_FOCUS_KEY, JSON.stringify(detail));
  } catch {
    // The live event still works when browser storage is unavailable.
  }
  window.dispatchEvent(
    new CustomEvent<LivingMapFocusDetail>(VI_MAP_FOCUS_EVENT, { detail }),
  );
}

export function dispatchIntelligenceMapFocus(
  item: IntelligenceFocusItem,
  source: Extract<
    LivingMapFocusSource,
    "concierge-recommendation" | "concierge-itinerary"
  >,
) {
  const detail = createLivingMapFocusDetail(
    [intelligenceItemToFocusItem(item)],
    source,
  );
  if (detail) dispatchLivingMapFocus(detail);
}

export function dispatchIntelligenceResponseMapFocus(
  response: IntelligenceResponse,
) {
  const items = [
    ...response.plan.map(intelligenceItemToFocusItem),
    ...response.recommendations.map(intelligenceItemToFocusItem),
  ];
  const detail = createLivingMapFocusDetail(items, "concierge-response");
  if (detail) dispatchLivingMapFocus(detail);
}

export function consumePendingLivingMapFocus(): LivingMapFocusDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_FOCUS_KEY);
    window.sessionStorage.removeItem(PENDING_FOCUS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LivingMapFocusDetail>;
    const source = parsed.source;
    if (
      source !== "concierge-response" &&
      source !== "concierge-recommendation" &&
      source !== "concierge-itinerary" &&
      source !== "saved-stop" &&
      source !== "map-workspace" &&
      source !== "external-link"
    ) {
      return null;
    }
    return createLivingMapFocusDetail(
      Array.isArray(parsed.items) ? parsed.items : [],
      source,
      parsed.primaryId,
    );
  } catch {
    return null;
  }
}

export function placeTypeForMapFocusItem(
  item: Pick<LivingMapFocusItem, "kind">,
): TerritoryMapPlaceType {
  const kind = item.kind.toLowerCase();
  if (/beach/.test(kind)) return "beach";
  if (/stay|hotel|resort|villa|lodging|accommodation/.test(kind)) return "stay";
  if (/historic|heritage|museum|fort|landmark|ruin/.test(kind)) {
    return "historic";
  }
  return "place";
}

export function lensForMapFocusItem(
  item: Pick<LivingMapFocusItem, "kind">,
): TerritoryMapLens {
  const type = placeTypeForMapFocusItem(item);
  if (type === "beach") return "beaches";
  if (type === "stay") return "stays";
  if (type === "historic") return "historic";
  return "places";
}
