"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type {
  TerritoryMapLens,
  TerritoryMapPlaceType,
  TerritoryMapSelection,
  TerritorySelection,
  TerritoryState,
} from "@/types/territory-map";
import type { EstateRecord, IslandCode } from "@/types/usvi";

type TerritoryMode = "arrival" | "stay" | "discovery";

type UseTerritoryStateOptions = {
  estates: EstateRecord[];
  modeContext: TerritoryMode;
  syntheticOperationsEnabled?: boolean;
};

const DEFAULT_STATE: TerritoryState = {
  island: "stt",
  lens: "places",
  selection: null,
  pickupGeoid: null,
  destinationGeoid: null,
};

const TERRITORY_QUERY_KEYS = [
  "island",
  "lens",
  "filter",
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
  "pickup",
  "destination",
] as const;

function defaultLensForMode(value: string | null): TerritoryMapLens {
  if (value === "stay") return "stays";
  return "places";
}

function validIsland(value: string | null): IslandCode | null {
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

function legacyFilterLens(value: string | null): TerritoryMapLens | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "history" || normalized === "heritage" || normalized === "historic") {
    return "historic";
  }
  if (normalized === "beach" || normalized === "beaches") return "beaches";
  if (normalized === "stay" || normalized === "stays" || normalized === "hotel") return "stays";
  if (normalized === "place" || normalized === "places") return "places";
  return null;
}

function validPlaceType(value: string | null): TerritoryMapPlaceType | null {
  return value === "beach" ||
    value === "place" ||
    value === "stay" ||
    value === "historic"
    ? value
    : null;
}

function boundedText(value: string | null, maxLength: number) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function validCoordinate(
  value: string | null,
  minimum: number,
  maximum: number,
) {
  if (value === null) return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) &&
    coordinate >= minimum &&
    coordinate <= maximum
    ? coordinate
    : null;
}

function normalizeLens(
  lens: TerritoryMapLens,
  syntheticOperationsEnabled: boolean,
): TerritoryMapLens {
  if (
    !syntheticOperationsEnabled &&
    (lens === "drivers" || lens === "demand")
  ) {
    return "places";
  }

  return lens;
}

function parseSelection(params: URLSearchParams): TerritorySelection | null {
  const id = boundedText(params.get("place"), 160);
  const name = boundedText(params.get("placeName"), 200);
  const type = validPlaceType(params.get("placeType"));
  const lat = validCoordinate(params.get("placeLat"), -90, 90);
  const lng = validCoordinate(params.get("placeLng"), -180, 180);

  if (!id || !name || !type || lat === null || lng === null) {
    const estate = boundedText(params.get("estate"), 180);
    return estate ? { kind: "estate", geoid: estate } : null;
  }

  const location = boundedText(params.get("placeLocation"), 300);
  const description = boundedText(params.get("placeDescription"), 1_000);
  const rawRating = params.get("placeRating");
  const ratingValue = rawRating === null ? Number.NaN : Number(rawRating);
  const rating =
    Number.isFinite(ratingValue) && ratingValue >= 0 && ratingValue <= 5
      ? ratingValue
      : undefined;

  return {
    kind: "place",
    place: {
      id,
      name,
      type,
      lat,
      lng,
      location,
      description,
      rating,
    },
  };
}

function safeInternalPath(value: string | null) {
  const path = boundedText(value, 800);
  return path?.startsWith("/") && !path.startsWith("//") ? path : undefined;
}

function territoryStateEqual(a: TerritoryState, b: TerritoryState) {
  if (
    a.island !== b.island ||
    a.lens !== b.lens ||
    a.pickupGeoid !== b.pickupGeoid ||
    a.destinationGeoid !== b.destinationGeoid ||
    a.selection?.kind !== b.selection?.kind
  ) {
    return false;
  }

  if (!a.selection || !b.selection) return a.selection === b.selection;
  if (a.selection.kind === "estate" && b.selection.kind === "estate") {
    return a.selection.geoid === b.selection.geoid;
  }
  if (a.selection.kind === "place" && b.selection.kind === "place") {
    const left = a.selection.place;
    const right = b.selection.place;
    return (
      left.id === right.id &&
      left.name === right.name &&
      left.type === right.type &&
      left.lat === right.lat &&
      left.lng === right.lng &&
      left.location === right.location &&
      left.description === right.description &&
      left.rating === right.rating
    );
  }

  return false;
}

function setOrDelete(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value) params.set(key, value);
  else params.delete(key);
}

export function useTerritoryState({
  estates,
  modeContext,
  syntheticOperationsEnabled = false,
}: UseTerritoryStateOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const applyingUrlRef = useRef(false);

  const [territory, setTerritory] = useState<TerritoryState>(DEFAULT_STATE);

  useEffect(() => {
    applyingUrlRef.current = true;
    const params = new URLSearchParams(searchParams.toString());
    const requestedIsland = validIsland(params.get("island"));
    const rememberedIsland = validIsland(
      window.localStorage.getItem("vi-guide.active-island"),
    );
    const requestedLens =
      validLens(params.get("lens")) ?? legacyFilterLens(params.get("filter"));
    const selection = parseSelection(params);
    const pickupGeoid = params.get("pickup")?.trim() || null;
    const requestedDestination = params.get("destination")?.trim() || null;
    const destinationGeoid =
      requestedDestination && requestedDestination !== pickupGeoid
        ? requestedDestination
        : null;

    setTerritory((current) => {
      const next: TerritoryState = {
        island: requestedIsland ?? rememberedIsland ?? current.island,
        lens: normalizeLens(
          requestedLens ?? defaultLensForMode(params.get("mode")),
          syntheticOperationsEnabled,
        ),
        selection,
        pickupGeoid,
        destinationGeoid,
      };

      return territoryStateEqual(current, next) ? current : next;
    });

    initializedRef.current = true;
  }, [searchParams, syntheticOperationsEnabled]);

  useEffect(() => {
    if (!initializedRef.current || !estates.length) return;

    setTerritory((current) => {
      const currentSelection = current.selection;

      const selectedEstate =
        currentSelection?.kind === "estate"
          ? (estates.find(
              (estate) => estate.geoid === currentSelection.geoid,
            ) ?? null)
          : null;

      const island = selectedEstate?.island ?? current.island;

      const islandGeoids = new Set(
        estates
          .filter((estate) => estate.island === island)
          .map((estate) => estate.geoid),
      );

      const selection =
        currentSelection?.kind === "estate" && !selectedEstate
          ? null
          : currentSelection;

      const requestedPickup =
        current.pickupGeoid && islandGeoids.has(current.pickupGeoid)
          ? current.pickupGeoid
          : null;

      const pickupGeoid =
        modeContext === "stay" && !requestedPickup && selectedEstate
          ? selectedEstate.geoid
          : requestedPickup;

      const destinationGeoid =
        current.destinationGeoid &&
        islandGeoids.has(current.destinationGeoid) &&
        current.destinationGeoid !== pickupGeoid
          ? current.destinationGeoid
          : null;

      const next: TerritoryState = {
        ...current,
        island,
        selection,
        pickupGeoid,
        destinationGeoid,
      };

      return territoryStateEqual(current, next) ? current : next;
    });
  }, [estates, modeContext]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (applyingUrlRef.current) {
      applyingUrlRef.current = false;
      return;
    }

    window.localStorage.setItem("vi-guide.active-island", territory.island);

    const params = new URLSearchParams(searchParams.toString());
    const sourcePlaceId = boundedText(params.get("place"), 160);
    const contextEstate = boundedText(params.get("estate"), 180);
    const contextPlaceSlug = boundedText(params.get("placeSlug"), 220);
    const contextPlaceHref = safeInternalPath(params.get("placeHref"));
    TERRITORY_QUERY_KEYS.forEach((key) => params.delete(key));

    params.set("island", territory.island);
    params.set("lens", territory.lens);
    setOrDelete(params, "pickup", territory.pickupGeoid);
    setOrDelete(params, "destination", territory.destinationGeoid);

    if (territory.selection?.kind === "estate") {
      params.set("estate", territory.selection.geoid);
    } else if (territory.selection?.kind === "place") {
      const place = territory.selection.place;
      const preservesIncomingContext = sourcePlaceId === place.id;
      params.set("place", place.id);
      params.set("placeName", place.name);
      params.set("placeType", place.type);
      params.set("placeLat", String(place.lat));
      params.set("placeLng", String(place.lng));
      setOrDelete(params, "placeLocation", place.location ?? null);
      setOrDelete(params, "placeDescription", place.description ?? null);
      setOrDelete(
        params,
        "placeRating",
        typeof place.rating === "number" ? String(place.rating) : null,
      );
      setOrDelete(
        params,
        "estate",
        preservesIncomingContext ? (contextEstate ?? null) : null,
      );
      setOrDelete(
        params,
        "placeSlug",
        preservesIncomingContext ? (contextPlaceSlug ?? null) : null,
      );
      setOrDelete(
        params,
        "placeHref",
        preservesIncomingContext ? (contextPlaceHref ?? null) : null,
      );
    }

    const nextQuery = params.toString();
    if (nextQuery === searchParams.toString()) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams, territory]);

  const changeIsland = useCallback((island: IslandCode) => {
    setTerritory((current) => ({
      ...current,
      island,
      selection: null,
      pickupGeoid: null,
      destinationGeoid: null,
    }));
  }, []);

  const changeLens = useCallback(
    (lens: TerritoryMapLens) => {
      const nextLens = normalizeLens(lens, syntheticOperationsEnabled);
      setTerritory((current) => ({
        ...current,
        lens: nextLens,
        selection:
          current.selection?.kind === "place" ? null : current.selection,
      }));
    },
    [syntheticOperationsEnabled],
  );

  const selectEstate = useCallback((estate: EstateRecord | string | null) => {
    const geoid = typeof estate === "string" ? estate : (estate?.geoid ?? null);
    setTerritory((current) => ({
      ...current,
      selection: geoid ? { kind: "estate", geoid } : null,
    }));
  }, []);

  const selectPlace = useCallback((place: TerritoryMapSelection | null) => {
    setTerritory((current) => ({
      ...current,
      selection: place ? { kind: "place", place } : null,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setTerritory((current) =>
      current.selection ? { ...current, selection: null } : current,
    );
  }, []);

  const setPickup = useCallback((geoid: string | null) => {
    setTerritory((current) => ({
      ...current,
      pickupGeoid: geoid,
      destinationGeoid:
        geoid && geoid === current.destinationGeoid
          ? null
          : current.destinationGeoid,
    }));
  }, []);

  const setDestination = useCallback((geoid: string | null) => {
    setTerritory((current) => ({
      ...current,
      destinationGeoid: geoid,
      pickupGeoid:
        geoid && geoid === current.pickupGeoid ? null : current.pickupGeoid,
    }));
  }, []);

  return useMemo(
    () => ({
      territory,
      changeIsland,
      changeLens,
      selectEstate,
      selectPlace,
      clearSelection,
      setPickup,
      setDestination,
    }),
    [
      territory,
      changeIsland,
      changeLens,
      selectEstate,
      selectPlace,
      clearSelection,
      setPickup,
      setDestination,
    ],
  );
}
