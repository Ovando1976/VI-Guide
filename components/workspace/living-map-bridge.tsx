"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { useUnifiedWorkspace } from "@/components/workspace/unified-workspace-controller";
import {
  lensForMapFocusItem,
  placeTypeForMapFocusItem,
  type LivingMapFocusItem,
} from "@/lib/intelligence/map-focus-events";
import { queryTerritoryMapPlaces } from "@/lib/territory";
import type {
  TerritoryMapLens,
  TerritoryMapPlaceType,
  TerritoryMapSelection,
} from "@/types/territory-map";
import type { IslandCode } from "@/types/usvi";

const SELECTION_KEYS = [
  "estate",
  "place",
  "placeName",
  "placeType",
  "placeLat",
  "placeLng",
  "placeLocation",
  "placeDescription",
  "placeRating",
  "placeSlug",
  "placeHref",
] as const;

type CatalogMapPlace = ReturnType<typeof queryTerritoryMapPlaces>[number];

type SearchFocus = {
  island: IslandCode;
  lens: TerritoryMapLens;
  selection: TerritoryMapSelection;
};

function normalizedText(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function finiteCoordinate(
  value: string | number | null | undefined,
  minimum: number,
  maximum: number,
) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : undefined;
}

function validIsland(value: string | null | undefined): IslandCode | null {
  const normalized = value?.trim().toLowerCase();
  return normalized === "stt" || normalized === "stj" || normalized === "stx"
    ? normalized
    : null;
}

function validLens(value: string | null): TerritoryMapLens | null {
  return value === "beaches" ||
    value === "places" ||
    value === "stays" ||
    value === "historic" ||
    value === "drivers" ||
    value === "demand"
    ? value
    : null;
}

function validPlaceType(value: string | null): TerritoryMapPlaceType | null {
  return value === "beach" ||
    value === "place" ||
    value === "stay" ||
    value === "historic"
    ? value
    : null;
}

function focusFromMapHref(
  item: LivingMapFocusItem,
): TerritoryMapSelection | null {
  if (!item.mapHref) return null;
  try {
    const url = new URL(item.mapHref, window.location.origin);
    if (url.pathname !== "/map") return null;
    const lat = finiteCoordinate(url.searchParams.get("placeLat"), -90, 90);
    const lng = finiteCoordinate(url.searchParams.get("placeLng"), -180, 180);
    if (lat === undefined || lng === undefined) return null;
    return {
      id: url.searchParams.get("place")?.trim() || item.id,
      name: url.searchParams.get("placeName")?.trim() || item.title,
      type:
        validPlaceType(url.searchParams.get("placeType")) ??
        placeTypeForMapFocusItem(item),
      lat,
      lng,
      location: url.searchParams.get("placeLocation")?.trim() || undefined,
      description:
        url.searchParams.get("placeDescription")?.trim() || item.summary,
      rating: finiteCoordinate(url.searchParams.get("placeRating"), 0, 5),
    };
  } catch {
    return null;
  }
}

function focusFromCatalog(
  item: LivingMapFocusItem,
): TerritoryMapSelection | null {
  const requestedId = normalizedText(item.id);
  const requestedTitle = normalizedText(item.title);
  const catalog = queryTerritoryMapPlaces({ island: item.island });
  const match = catalog.find((place) => {
    const id = normalizedText(place.id ?? place.name);
    const title = normalizedText(place.name);
    return (
      id === requestedId ||
      id.endsWith(`-${requestedId}`) ||
      requestedId.endsWith(`-${id}`) ||
      title === requestedTitle
    );
  });
  if (!match) return null;

  const lat = finiteCoordinate(match.lat, -90, 90);
  const lng = finiteCoordinate(match.lng, -180, 180);
  if (lat === undefined || lng === undefined) return null;

  return {
    id: match.id ?? item.id,
    name: match.name ?? item.title,
    type: placeTypeForMapFocusItem({ kind: match.type ?? item.kind }),
    lat,
    lng,
    location: match.location,
    description: match.description ?? item.summary,
    rating: match.rating,
  };
}

function resolveFocusItem(
  item: LivingMapFocusItem,
): TerritoryMapSelection | null {
  const hrefFocus = focusFromMapHref(item);
  if (hrefFocus) return hrefFocus;

  const lat = finiteCoordinate(item.lat, -90, 90);
  const lng = finiteCoordinate(item.lng, -180, 180);
  if (lat !== undefined && lng !== undefined) {
    return {
      id: item.id,
      name: item.title,
      type: placeTypeForMapFocusItem(item),
      lat,
      lng,
      description: item.summary,
    };
  }

  return focusFromCatalog(item);
}

function placeMatchesLens(place: CatalogMapPlace, lens: TerritoryMapLens | null) {
  if (!lens || lens === "drivers" || lens === "demand") return lens === null;
  if (lens === "beaches") return place.type === "beach";
  if (lens === "stays") return place.type === "stay";
  if (lens === "historic") return place.type === "historic";
  return place.type === "place";
}

function searchTerms(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreSearchPlace(place: CatalogMapPlace, query: string) {
  const terms = searchTerms(query);
  if (!terms.length) return -1;

  const title = place.name.toLowerCase();
  const haystack = [
    place.name,
    place.category,
    place.location,
    place.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!terms.every((term) => haystack.includes(term))) return -1;

  let score = normalizedText(place.name) === normalizedText(query) ? 100 : 0;
  for (const term of terms) {
    if (title.includes(term)) score += 14;
    else score += 3;
  }
  return score;
}

function lensForPlaceType(type: TerritoryMapPlaceType): TerritoryMapLens {
  if (type === "beach") return "beaches";
  if (type === "stay") return "stays";
  if (type === "historic") return "historic";
  return "places";
}

function focusFromSearchQuery(params: URLSearchParams): SearchFocus | null {
  if (SELECTION_KEYS.some((key) => params.get(key))) return null;

  const query = params.get("q")?.trim().slice(0, 180) ?? "";
  if (!query) return null;

  const requestedIsland = validIsland(params.get("island"));
  const requestedLens = validLens(params.get("lens") ?? params.get("filter"));
  if (requestedLens === "drivers" || requestedLens === "demand") return null;

  const candidates = queryTerritoryMapPlaces(
    requestedIsland ? { island: requestedIsland } : {},
  )
    .filter((place) => placeMatchesLens(place, requestedLens))
    .map((place) => ({ place, score: scoreSearchPlace(place, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((left, right) => right.score - left.score);

  const match = candidates[0]?.place;
  if (!match) return null;

  const island = validIsland(match.island) ?? requestedIsland;
  const type = validPlaceType(match.type ?? null);
  const lat = finiteCoordinate(match.lat, -90, 90);
  const lng = finiteCoordinate(match.lng, -180, 180);
  if (!island || !type || lat === undefined || lng === undefined) return null;

  return {
    island,
    lens: requestedLens ?? lensForPlaceType(type),
    selection: {
      id: match.id ?? `${type}:${normalizedText(match.name)}`,
      name: match.name,
      type,
      lat,
      lng,
      location: match.location,
      description: match.description,
      rating: match.rating,
    },
  };
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === "") params.delete(key);
  else params.set(key, String(value));
}

function writeSelection(params: URLSearchParams, selection: TerritoryMapSelection) {
  SELECTION_KEYS.forEach((key) => params.delete(key));
  params.set("place", selection.id);
  params.set("placeName", selection.name);
  params.set("placeType", selection.type);
  params.set("placeLat", String(selection.lat));
  params.set("placeLng", String(selection.lng));
  setOrDelete(params, "placeLocation", selection.location);
  setOrDelete(params, "placeDescription", selection.description);
  setOrDelete(params, "placeRating", selection.rating);
}

export function LivingMapBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serialized = searchParams.toString();
  const { state, patch } = useUnifiedWorkspace();
  const lastApplied = useRef<string | null>(null);
  const lastSearchApplied = useRef<string | null>(null);

  const primary = useMemo(() => {
    const focus = state.liveFocus;
    if (!focus) return null;
    return (
      focus.items.find((item) => item.id === focus.primaryId) ?? focus.items[0] ?? null
    );
  }, [state.liveFocus]);

  const searchFocus = useMemo(
    () => focusFromSearchQuery(new URLSearchParams(serialized)),
    [serialized],
  );

  useEffect(() => {
    const focus = state.liveFocus;
    if (!focus || !primary || lastApplied.current === focus.issuedAt) return;

    const currentParams = new URLSearchParams(serialized);
    const hasExplicitSelection = SELECTION_KEYS.some((key) =>
      currentParams.get(key),
    );
    if (lastApplied.current === null && hasExplicitSelection) {
      // A direct Living Map link is more current than a focus restored from
      // workspace storage. Mark that restored focus as seen without allowing it
      // to erase the explicit place and reviewed tariff-estate context.
      lastApplied.current = focus.issuedAt;
      return;
    }

    const selection = resolveFocusItem(primary);
    const lens = lensForMapFocusItem(primary);
    const params = currentParams;
    SELECTION_KEYS.forEach((key) => params.delete(key));
    params.set("island", primary.island);
    params.set("lens", lens);
    params.delete("filter");

    if (selection) writeSelection(params, selection);

    lastApplied.current = focus.issuedAt;
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    patch({
      island: primary.island,
      lens,
      selection,
      activePanel: "map",
      lastAction: `map.focus.applied.${focus.source}`,
    });

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("territory-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [patch, pathname, primary, router, serialized, state.liveFocus]);

  useEffect(() => {
    if (!searchFocus || state.liveFocus) return;
    const signature = `${serialized}:${searchFocus.selection.id}`;
    if (lastSearchApplied.current === signature) return;

    const params = new URLSearchParams(serialized);
    params.set("island", searchFocus.island);
    params.set("lens", searchFocus.lens);
    params.delete("filter");
    writeSelection(params, searchFocus.selection);

    lastSearchApplied.current = signature;
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
    patch({
      island: searchFocus.island,
      lens: searchFocus.lens,
      selection: searchFocus.selection,
      activePanel: "map",
      lastAction: "map.search.focused",
    });

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById("territory-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [patch, pathname, router, searchFocus, serialized, state.liveFocus]);

  return null;
}
