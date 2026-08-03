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
  TerritoryMapPlace,
  TerritoryMapPlaceType,
  TerritoryMapSelection,
} from "@/types/territory-map";

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
] as const;

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

function validPlaceType(value: string | null): TerritoryMapPlaceType | null {
  return value === "beach" ||
    value === "place" ||
    value === "stay" ||
    value === "historic"
    ? value
    : null;
}

function focusFromMapHref(item: LivingMapFocusItem) {
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
    } satisfies TerritoryMapSelection;
  } catch {
    return null;
  }
}

function placeIdentity(place: TerritoryMapPlace) {
  return normalizedText(place.id ?? place.name ?? place.title);
}

function focusFromCatalog(item: LivingMapFocusItem) {
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
  } satisfies TerritoryMapSelection;
}

function resolveFocusItem(item: LivingMapFocusItem) {
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
    } satisfies TerritoryMapSelection;
  }

  return focusFromCatalog(item);
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | number | undefined,
) {
  if (value === undefined || value === "") params.delete(key);
  else params.set(key, String(value));
}

export function LivingMapBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serialized = searchParams.toString();
  const { state, patch } = useUnifiedWorkspace();
  const lastApplied = useRef<string | null>(null);

  const primary = useMemo(() => {
    const focus = state.liveFocus;
    if (!focus) return null;
    return (
      focus.items.find((item) => item.id === focus.primaryId) ?? focus.items[0] ?? null
    );
  }, [state.liveFocus]);

  useEffect(() => {
    const focus = state.liveFocus;
    if (!focus || !primary || lastApplied.current === focus.issuedAt) return;

    const selection = resolveFocusItem(primary);
    const lens = lensForMapFocusItem(primary);
    const params = new URLSearchParams(serialized);
    SELECTION_KEYS.forEach((key) => params.delete(key));
    params.set("island", primary.island);
    params.set("lens", lens);
    params.delete("filter");

    if (selection) {
      params.set("place", selection.id);
      params.set("placeName", selection.name);
      params.set("placeType", selection.type);
      params.set("placeLat", String(selection.lat));
      params.set("placeLng", String(selection.lng));
      setOrDelete(params, "placeLocation", selection.location);
      setOrDelete(params, "placeDescription", selection.description);
      setOrDelete(params, "placeRating", selection.rating);
    }

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

  return null;
}
