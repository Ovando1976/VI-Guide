"use client";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LineString } from "geojson";

import { ViConcierge } from "@/components/concierge/vi-concierge";
import type { ConciergeContext } from "@/types/concierge";
import { MobilityActionDock } from "@/components/explorer/mobility-action-dock";
import { TerritoryModuleDock } from "@/components/explorer/territory-module-dock";
import { TerritoryIntelligenceRail } from "@/components/explorer/territory-intelligence-rail";
import type {
  TerritoryMapLens as Lens,
  TerritoryMapSelection,
} from "@/types/territory-map";
import { TerritoryKpiBar } from "@/components/explorer/territory-kpi-bar";
import { TerritoryMapWorkspace } from "@/components/explorer/territory-map-workspace";
import {
  queryTerritoryEntities,
  queryTerritoryMapPlaces,
} from "@/lib/territory";
import { ISLAND_META, searchEstates } from "@/lib/usvi";
import { useTerritoryState } from "@/hooks/use-territory-state";
import type { RideMode } from "@/types/mobility";
import type { TerritoryEntity } from "@/types/territory";
import type { EstateRecord, IslandCode } from "@/types/usvi";
import {
  TRIP_STORAGE_KEY,
  type TripItem,
  type TripItemKind,
} from "@/components/trip-planner/trip-types";

const EstateMap = dynamic(
  () => import("@/components/estate-map").then((module) => module.EstateMap),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] w-full animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] md:min-h-[620px]" />
    ),
  },
);

type MapMode = "arrival" | "stay" | "discovery";
type RouteStatus = "idle" | "loading" | "ready" | "error";
type RouteMetrics = { distanceMeters: number; durationSeconds: number };
type DirectoryPositionFilter = "all" | "positioned" | "unpositioned";

const syntheticOperationsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SYNTHETIC_OPERATIONS === "true";

const DEFAULT_ESTATE_BY_ISLAND: Record<IslandCode, string[]> = {
  stt: ["kings quarter", "charlotte amalie", "bovoni", "airport"],
  stj: ["cruz bay", "enighed", "carolina"],
  stx: ["christiansted", "frederiksted", "kings quarter"],
};

const QUICK_ROUTE_PRESETS: Record<
  string,
  { island: IslandCode; mode: RideMode; fromMatch: string[]; toMatch: string[] }
> = {
  "Airport transfer": {
    island: "stt",
    mode: "airport",
    fromMatch: ["airport", "cyril e king"],
    toMatch: ["charlotte amalie", "red hook", "bovoni"],
  },
  "Red Hook ferry": {
    island: "stt",
    mode: "ferry-transfer",
    fromMatch: ["red hook"],
    toMatch: ["charlotte amalie", "bovoni"],
  },
  "Charlotte Amalie": {
    island: "stt",
    mode: "standard",
    fromMatch: ["charlotte amalie"],
    toMatch: ["bovoni", "red hook"],
  },
  "Cruz Bay run": {
    island: "stj",
    mode: "standard",
    fromMatch: ["cruz bay"],
    toMatch: ["carolina", "enighed"],
  },
  "Safari ride": {
    island: "stt",
    mode: "shared",
    fromMatch: ["charlotte amalie", "bovoni"],
    toMatch: ["red hook", "kings quarter"],
  },
  "Resort pickup": {
    island: "stt",
    mode: "premium",
    fromMatch: ["bovoni", "red hook"],
    toMatch: ["charlotte amalie", "airport"],
  },
};

const ISLAND_SPOTLIGHT: Record<
  IslandCode,
  { title: string; focus: string; route: string; tags: string[] }
> = {
  stt: {
    title: "St. Thomas",
    focus: "Airport, harbor, resorts, town, and hillside access",
    route: "Cyril E. King → Charlotte Amalie → Red Hook",
    tags: ["harbor-linked", "resort corridor", "east-end connector"],
  },
  stj: {
    title: "St. John",
    focus: "Ferry arrivals, villas, beaches, and Cruz Bay",
    route: "Cruz Bay → North Shore → villa pickup",
    tags: ["ferry-first", "beach corridor", "villa access"],
  },
  stx: {
    title: "St. Croix",
    focus: "Airport, Christiansted, Frederiksted, and cross-island corridors",
    route: "Airport → Christiansted → west end transfer",
    tags: ["territory-scale", "historic estates", "cross-island movement"],
  },
};

const BASE_LENS_ORDER: Record<MapMode, Lens[]> = {
  arrival: ["drivers", "places", "stays", "demand", "beaches", "historic"],
  stay: ["stays", "places", "beaches", "historic", "drivers", "demand"],
  discovery: ["places", "beaches", "historic", "stays", "drivers", "demand"],
};

function getLensOrder(mode: MapMode): Lens[] {
  return BASE_LENS_ORDER[mode].filter(
    (lens) =>
      syntheticOperationsEnabled || (lens !== "drivers" && lens !== "demand"),
  );
}

function modeDefaults(mode: MapMode): { lens: Lens; rideMode: RideMode } {
  if (mode === "arrival") return { lens: "places", rideMode: "airport" };
  if (mode === "stay") return { lens: "stays", rideMode: "premium" };
  return { lens: "places", rideMode: "standard" };
}

function validMode(value: string | null): MapMode {
  return value === "arrival" || value === "stay" ? value : "discovery";
}

function findEstateByMatchers(estates: EstateRecord[], matchers: string[]) {
  const searchable = estates.map((estate) => ({
    estate,
    text: `${estate.baseName} ${estate.fullName} ${
      estate.estateCode ?? ""
    }`.toLowerCase(),
  }));

  for (const matcher of matchers) {
    const match = searchable.find((item) =>
      item.text.includes(matcher.toLowerCase()),
    );
    if (match) return match.estate;
  }

  return null;
}

function inferEstateTags(estate: EstateRecord | null, island: IslandCode) {
  if (!estate) return ISLAND_SPOTLIGHT[island].tags;

  const text = `${estate.baseName} ${estate.fullName}`.toLowerCase();
  const tags = new Set<string>();

  if (/bay|harbor|hook|amalie/.test(text)) tags.add("harbor-linked");
  if (/airport|king|terminal/.test(text)) tags.add("airport-adjacent");
  if (/east|red hook|smith|nazareth/.test(text)) tags.add("east-end connector");
  if (/mount|hill|ridge|heights/.test(text)) tags.add("hillside access");
  if (/cruz|enighed|carolina/.test(text)) tags.add("ferry-first");
  if (/christiansted|frederiksted|company|prince/.test(text)) {
    tags.add("historic corridor");
  }

  if (!tags.size) {
    ISLAND_SPOTLIGHT[island].tags.forEach((tag) => tags.add(tag));
  }

  return [...tags];
}

function squaredDistance(a: EstateRecord, b: EstateRecord) {
  const lat = a.internalPoint.lat - b.internalPoint.lat;
  const lng = a.internalPoint.lng - b.internalPoint.lng;
  return lat * lat + lng * lng;
}

function entityMatchesLens(entity: TerritoryEntity, lens: Lens) {
  if (lens === "beaches") return entity.kind === "beach";
  if (lens === "stays") return entity.kind === "stay";
  if (lens === "historic") return entity.kind === "historic";
  if (lens === "places") return entity.kind === "place";
  return false;
}

function entitySearchText(entity: TerritoryEntity) {
  return [
    entity.title,
    entity.summary,
    entity.description,
    entity.kind,
    entity.island,
    ...(entity.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function entitySubtitle(entity: TerritoryEntity) {
  return (
    entity.summary ??
    entity.description ??
    entity.tags?.slice(0, 3).join(" · ") ??
    `${entity.kind} on ${entity.island.toUpperCase()}`
  );
}

function entityKindLabel(kind: TerritoryEntity["kind"]) {
  if (kind === "beach") return "Beach";
  if (kind === "stay") return "Stay";
  if (kind === "historic") return "Historic";
  if (kind === "place") return "Place";
  return kind;
}

function entityDetailHref(entity: TerritoryEntity) {
  const slug = entity.slug ?? entity.id.replace(/^[^:]+:/, "");
  if (entity.kind === "beach") return `/beaches/${slug}`;
  if (entity.kind === "stay") return `/accommodations/${slug}`;
  if (entity.kind === "historic") return `/historic/${slug}`;
  return `/places/${slug}`;
}

function entityTripKind(entity: TerritoryEntity): TripItemKind | null {
  return entity.kind === "place" ||
    entity.kind === "beach" ||
    entity.kind === "stay" ||
    entity.kind === "historic"
    ? entity.kind
    : null;
}

function readSavedTrip(): TripItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TRIP_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as TripItem[]) : [];
  } catch {
    return [];
  }
}

export function ExplorerMapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode");

  const [estates, setEstates] = useState<EstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<RideMode>("standard");
  const [modeContext, setModeContext] = useState<MapMode>("discovery");
  const {
    territory,
    changeIsland,
    changeLens,
    selectEstate,
    selectPlace,
    clearSelection,
    setPickup,
    setDestination,
  } = useTerritoryState({
    estates,
    modeContext,
    syntheticOperationsEnabled,
  });
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);

  const [routeGeoJson, setRouteGeoJson] = useState<LineString | null>(null);
  const [routeFocusNonce, setRouteFocusNonce] = useState(0);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);

  const [directoryPositionFilter, setDirectoryPositionFilter] =
    useState<DirectoryPositionFilter>("all");

  const [directoryExpanded, setDirectoryExpanded] = useState(false);
  const [savedTripIds, setSavedTripIds] = useState<Set<string>>(new Set());
  const island = territory.island;
  const activeLens = territory.lens;
  const selection = territory.selection;
  const fromGeoid = territory.pickupGeoid ?? "";
  const toGeoid = territory.destinationGeoid ?? "";
  const selectedEstateGeoid =
    selection?.kind === "estate" ? selection.geoid : null;

  const selectedTerritoryPlace =
    selection?.kind === "place" ? selection.place : null;

  const handleChangeIsland = useCallback(
    (nextIsland: IslandCode) => {
      changeIsland(nextIsland);
      setQuery("");
      setRouteGeoJson(null);
      setRouteStatus("idle");
      setRouteMessage(null);
      setRouteMetrics(null);
      setDirectoryPositionFilter("all");
      setDirectoryExpanded(false);
    },
    [changeIsland],
  );

  const handleSelectFrom = useCallback(
    (geoid: string) => setPickup(geoid || null),
    [setPickup],
  );

  const handleSelectTo = useCallback(
    (geoid: string) => setDestination(geoid || null),
    [setDestination],
  );

  const handleChangeLens = useCallback(
    (lens: Lens) => changeLens(lens),
    [changeLens],
  );

  const handleSelectEstate = useCallback(
    (estate: EstateRecord | null) => selectEstate(estate),
    [selectEstate],
  );

  const handleSelectEstateGeoid = useCallback(
    (geoid: string | null) => selectEstate(geoid),
    [selectEstate],
  );

  const handleSelectTerritoryPlace = useCallback(
    (place: TerritoryMapSelection | null) => selectPlace(place),
    [selectPlace],
  );

  const handleOpenConcierge = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("concierge", "open");
    router.replace(`/map?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleFocusEntity = useCallback(
    (entity: TerritoryEntity) => {
      if (!entity.position) return;
      const kind = entityTripKind(entity);
      if (!kind) return;

      selectPlace({
        id: entity.id,
        name: entity.title,
        type: kind,
        lat: entity.position.lat,
        lng: entity.position.lng,
        location:
          typeof entity.attributes.location === "string"
            ? entity.attributes.location
            : undefined,
        description: entity.summary ?? entity.description,
        rating: entity.rating,
      });
      document
        .getElementById("territory-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [selectPlace],
  );

  const handleSaveEntity = useCallback((entity: TerritoryEntity) => {
    const kind = entityTripKind(entity);
    if (!kind) return;

    const current = readSavedTrip();
    if (current.some((item) => item.id === entity.id && item.kind === kind)) {
      return;
    }

    const item: TripItem = {
      id: entity.id,
      slug: entity.slug ?? entity.id.replace(/^[^:]+:/, ""),
      name: entity.title,
      kind,
      island: entity.island,
      image: entity.media?.hero,
      description: entity.summary ?? entity.description,
      href: entityDetailHref(entity),
      day: 1,
      timeOfDay: "flexible",
      addedAt: new Date().toISOString(),
    };
    const next = [...current, item];
    window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("vi-guide-trip-updated"));
  }, []);

  useEffect(() => {
    const syncTrip = () => {
      setSavedTripIds(new Set(readSavedTrip().map((item) => item.id)));
    };
    syncTrip();
    window.addEventListener("vi-guide-trip-updated", syncTrip);
    window.addEventListener("storage", syncTrip);
    return () => {
      window.removeEventListener("vi-guide-trip-updated", syncTrip);
      window.removeEventListener("storage", syncTrip);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    async function loadEstates() {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await fetch("/api/estates", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load estates.");
        }

        const loaded = Array.isArray(payload?.estates)
          ? (payload.estates as EstateRecord[])
          : [];

        setEstates(loaded);

        if (!loaded.length) {
          setLoadError("No estate records were returned from the API.");
        }
      } catch (error) {
        if (!active) return;
        if (controller.signal.aborted) {
          setLoadError(
            "Island geography took too long to load. Check the connection and try again.",
          );
          return;
        }
        setLoadError(
          error instanceof Error ? error.message : "Failed to load estates.",
        );
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    loadEstates();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [reloadNonce]);

  useEffect(() => {
    const context = validMode(requestedMode);
    const defaults = modeDefaults(context);

    setModeContext(context);
    setMode(defaults.rideMode);
  }, [requestedMode]);

  useEffect(() => {
    window.localStorage.setItem(
      "vi-guide.trip-draft",
      JSON.stringify({
        island,
        from: fromGeoid,
        to: toGeoid,
        mode,
        passengers,
        luggage,
      }),
    );
  }, [island, fromGeoid, toGeoid, mode, passengers, luggage]);

  const islandEstates = useMemo(
    () => estates.filter((estate) => estate.island === island),
    [estates, island],
  );

  const filteredEstates = useMemo(
    () => searchEstates(estates, query, island),
    [estates, query, island],
  );

  useEffect(() => {
    if (!islandEstates.length) return;

    const selectedIsValid = islandEstates.some(
      (estate) => estate.geoid === selectedEstateGeoid,
    );

    if (!selectedIsValid && selection?.kind === "estate") {
      clearSelection();
    }

    if (modeContext === "stay" && !territory.pickupGeoid) {
      const fallback =
        findEstateByMatchers(islandEstates, DEFAULT_ESTATE_BY_ISLAND[island]) ??
        islandEstates[0];

      setPickup(fallback.geoid);
      return;
    }

    if (modeContext === "arrival" && !territory.pickupGeoid) {
      const airport = findEstateByMatchers(islandEstates, [
        "airport",
        "cyril e king",
        "rohlsen",
      ]);

      if (airport) setPickup(airport.geoid);
    }
  }, [
    islandEstates,
    selectedEstateGeoid,
    island,
    modeContext,
    selection,
    territory.pickupGeoid,
    clearSelection,
    setPickup,
  ]);

  const selectedEstate =
    estates.find((estate) => estate.geoid === selectedEstateGeoid) ?? null;
  const fromEstate =
    islandEstates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const toEstate =
    islandEstates.find((estate) => estate.geoid === toGeoid) ?? null;

  // Complete canonical directory: includes positioned and unresolved entities.
  const allIslandEntities = useMemo(
    () =>
      queryTerritoryEntities({ island }).filter(
        (entity) => entity.kind !== "estate",
      ),
    [island],
  );

  // Map markers: only entities with valid coordinates.
  const allIslandPlaces = useMemo(
    () => queryTerritoryMapPlaces({ island }),
    [island],
  );

  const islandPlaces = useMemo(() => {
    if (activeLens === "beaches") {
      return allIslandPlaces.filter((place) => place.type === "beach");
    }
    if (activeLens === "stays") {
      return allIslandPlaces.filter((place) => place.type === "stay");
    }
    if (activeLens === "historic") {
      return allIslandPlaces.filter((place) => place.type === "historic");
    }
    if (activeLens === "places") {
      return allIslandPlaces.filter((place) => place.type === "place");
    }
    return [];
  }, [allIslandPlaces, activeLens]);

  const lensEntities = useMemo(
    () =>
      allIslandEntities.filter((entity) =>
        entityMatchesLens(entity, activeLens),
      ),
    [activeLens, allIslandEntities],
  );

  const directoryEntities = useMemo(() => {
    if (activeLens === "drivers" || activeLens === "demand") return [];

    const normalizedQuery = query.trim().toLowerCase();

    return lensEntities
      .filter((entity) => {
        if (!normalizedQuery) return true;
        return entitySearchText(entity).includes(normalizedQuery);
      })
      .filter((entity) => {
        if (directoryPositionFilter === "positioned") {
          return Boolean(entity.position);
        }
        if (directoryPositionFilter === "unpositioned") {
          return !entity.position;
        }
        return true;
      })
      .sort((a, b) => {
        if (Boolean(a.position) !== Boolean(b.position)) {
          return a.position ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      });
  }, [activeLens, directoryPositionFilter, lensEntities, query]);

  const visibleDirectoryEntities = useMemo(
    () =>
      directoryExpanded ? directoryEntities : directoryEntities.slice(0, 12),
    [directoryEntities, directoryExpanded],
  );

  const catalogStats = useMemo(() => {
    const positioned = lensEntities.filter((entity) =>
      Boolean(entity.position),
    ).length;

    return {
      total: lensEntities.length,
      positioned,
      unresolved: lensEntities.length - positioned,
      visibleDirectory: directoryEntities.length,
      visibleMarkers: islandPlaces.length,
    };
  }, [directoryEntities.length, islandPlaces.length, lensEntities]);

  const moduleCounts = useMemo(() => {
    const count = (kind: "place" | "beach" | "stay" | "historic") => ({
      total: allIslandEntities.filter((entity) => entity.kind === kind).length,
      mapped: allIslandPlaces.filter((place) => place.type === kind).length,
    });
    return {
      estates: { total: islandEstates.length, mapped: islandEstates.length },
      places: count("place"),
      beaches: count("beach"),
      stays: count("stay"),
      historic: count("historic"),
    };
  }, [allIslandEntities, allIslandPlaces, islandEstates.length]);

  useEffect(() => {
    setDirectoryExpanded(false);
  }, [activeLens, directoryPositionFilter, island, query]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    console.table({
      island,
      activeLens,
      catalogTotal: catalogStats.total,
      catalogPositioned: catalogStats.positioned,
      catalogUnresolved: catalogStats.unresolved,
      directoryMatches: catalogStats.visibleDirectory,
      mapMarkers: catalogStats.visibleMarkers,
      places: allIslandEntities.filter((entity) => entity.kind === "place")
        .length,
      beaches: allIslandEntities.filter((entity) => entity.kind === "beach")
        .length,
      stays: allIslandEntities.filter((entity) => entity.kind === "stay")
        .length,
      historic: allIslandEntities.filter((entity) => entity.kind === "historic")
        .length,
    });
  }, [activeLens, allIslandEntities, catalogStats, island]);

  const selectedPlaceEstate = useMemo(() => {
    if (!selectedTerritoryPlace || !islandEstates.length) return null;

    return (
      islandEstates
        .map((estate) => ({
          estate,
          distance:
            Math.pow(estate.internalPoint.lat - selectedTerritoryPlace.lat, 2) +
            Math.pow(estate.internalPoint.lng - selectedTerritoryPlace.lng, 2),
        }))
        .sort((a, b) => a.distance - b.distance)[0]?.estate ?? null
    );
  }, [islandEstates, selectedTerritoryPlace]);

  const contextEstate = selectedEstate ?? selectedPlaceEstate;

  const neighboringEstates = useMemo(() => {
    if (!contextEstate) return [];

    return islandEstates
      .filter((estate) => estate.geoid !== contextEstate.geoid)
      .sort(
        (a, b) =>
          squaredDistance(contextEstate, a) - squaredDistance(contextEstate, b),
      )
      .slice(0, 5);
  }, [contextEstate, islandEstates]);

  useEffect(() => {
    if (!fromEstate || !toEstate) {
      setRouteGeoJson(null);
      setRouteStatus("idle");
      setRouteMessage(null);
      setRouteMetrics(null);
      return;
    }

    const controller = new AbortController();
    const routeFrom = fromEstate.internalPoint;
    const routeTo = toEstate.internalPoint;

    async function loadRoute() {
      try {
        setRouteStatus("loading");
        setRouteMessage("Calculating the roadway route");

        const response = await fetch("/api/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            from: routeFrom,
            to: routeTo,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error ?? "Roadway route unavailable.");
        }

        if (
          payload?.geometry?.type !== "LineString" ||
          !Array.isArray(payload.geometry.coordinates)
        ) {
          throw new Error("The routing provider returned an invalid route.");
        }

        setRouteGeoJson(payload.geometry as LineString);
        setRouteMetrics({
          distanceMeters:
            typeof payload.distanceMeters === "number"
              ? payload.distanceMeters
              : 0,
          durationSeconds:
            typeof payload.durationSeconds === "number"
              ? payload.durationSeconds
              : 0,
        });
        setRouteStatus("ready");
        setRouteMessage("Roadway route ready");
        setRouteFocusNonce((value) => value + 1);
      } catch (error) {
        if (controller.signal.aborted) return;

        setRouteGeoJson(null);
        setRouteMetrics(null);
        setRouteStatus("error");
        setRouteMessage(
          error instanceof Error ? error.message : "Roadway route unavailable.",
        );
      }
    }

    loadRoute();
    return () => controller.abort();
  }, [fromEstate, toEstate]);

  function continueToBooking() {
    if (!fromEstate || !toEstate || fromEstate.geoid === toEstate.geoid) return;

    const params = new URLSearchParams({
      island,
      from: fromEstate.geoid,
      to: toEstate.geoid,
      mode,
      passengers: String(passengers),
      luggage: String(luggage),
    });

    router.push(`/mobility?${params.toString()}`);
  }

  const hero = ISLAND_META[island];
  const spotlight = ISLAND_SPOTLIGHT[island];
  const routeReady = Boolean(
    fromEstate && toEstate && fromEstate.geoid !== toEstate.geoid,
  );

  const conciergeContext = useMemo<ConciergeContext>(
    () => ({
      island,
      islandName: hero.name,
      selectedEstate: selectedEstate
        ? {
            geoid: selectedEstate.geoid,
            name: selectedEstate.baseName,
          }
        : null,
      pickup: fromEstate
        ? {
            geoid: fromEstate.geoid,
            name: fromEstate.baseName,
          }
        : null,
      destination: toEstate
        ? {
            geoid: toEstate.geoid,
            name: toEstate.baseName,
          }
        : null,
      rideMode: mode,
      passengers,
      luggage,
      activeLens,
      nearbyEstates: neighboringEstates.map((estate) => ({
        geoid: estate.geoid,
        name: estate.baseName,
      })),
    }),
    [
      island,
      hero.name,
      selectedEstate,
      fromEstate,
      toEstate,
      mode,
      passengers,
      luggage,
      activeLens,
      neighboringEstates,
    ],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.12),transparent_30%),linear-gradient(180deg,#041018_0%,#07131a_45%,#09161f_100%)] text-white">
      <main className="mx-auto max-w-[1800px] space-y-4 px-3 pb-24 pt-3 md:px-6 md:pb-28 md:pt-4">
        {loading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState
            message={loadError}
            onRetry={() => setReloadNonce((value) => value + 1)}
          />
        ) : (
          <>
            <TerritoryKpiBar
              islandName={hero.name}
              visibleEstates={filteredEstates.length}
              selectedEstate={selectedEstate?.baseName ?? "None"}
              pickup={fromEstate?.baseName ?? "Not set"}
              destination={toEstate?.baseName ?? "Not set"}
              mode={mode}
              passengers={passengers}
              luggage={luggage}
            />

            <section
              id="territory-workspace"
              className="scroll-mt-40 grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_390px]"
            >
              <TerritoryMapWorkspace
                activeLens={activeLens}
                onChangeLens={handleChangeLens}
                lensOrder={getLensOrder(modeContext)}
                manifestCount={filteredEstates.length}
                estates={filteredEstates}
                selectedEstateGeoid={selectedEstateGeoid}
                fromGeoid={fromGeoid}
                toGeoid={toGeoid}
                onSelectEstate={(geoid) => handleSelectEstateGeoid(geoid)}
                routeStatus={routeStatus}
                routeMessage={routeMessage}
                manifestAction={(estate) => (
                  <>
                    <button
                      type="button"
                      disabled={toGeoid === estate.geoid}
                      onClick={() => {
                        handleSelectFrom(estate.geoid);
                        handleSelectEstateGeoid(estate.geoid);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/65 transition hover:bg-white/10 hover:text-white disabled:opacity-35"
                    >
                      Pickup
                    </button>
                    <button
                      type="button"
                      disabled={fromGeoid === estate.geoid}
                      onClick={() => {
                        handleSelectTo(estate.geoid);
                        handleSelectEstateGeoid(estate.geoid);
                      }}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/65 transition hover:bg-white/10 hover:text-white disabled:opacity-35"
                    >
                      Destination
                    </button>
                  </>
                )}
              >
                <EstateMap
                  island={island}
                  estates={filteredEstates}
                  // Give EstateMap the complete positioned catalog. EstateMap
                  // owns active-lens visibility and its per-layer counters.
                  places={allIslandPlaces}
                  activeLens={activeLens}
                  focusedPlaceId={selectedTerritoryPlace?.id ?? null}
                  selectedEstateGeoid={selectedEstateGeoid}
                  fromGeoid={fromGeoid}
                  toGeoid={toGeoid}
                  routeGeoJson={routeGeoJson}
                  routeFocusNonce={routeFocusNonce}
                  onSelectEstate={handleSelectEstate}
                  onSelectPlace={handleSelectTerritoryPlace}
                  onSelectFrom={handleSelectFrom}
                  onSelectTo={handleSelectTo}
                  onChangeLens={handleChangeLens}
                />
              </TerritoryMapWorkspace>

              <TerritoryIntelligenceRail
                islandTitle={spotlight.title}
                islandFocus={spotlight.focus}
                signatureRoute={spotlight.route}
                selectedEstate={selectedEstate}
                selectedPlace={selectedTerritoryPlace}
                selectedPlaceEstate={selectedPlaceEstate}
                fromEstate={fromEstate}
                toEstate={toEstate}
                estateTags={inferEstateTags(contextEstate, island)}
                neighboringEstates={neighboringEstates}
                onSelectNeighbor={(geoid) => handleSelectEstateGeoid(geoid)}
                onUseAsPickup={handleSelectFrom}
                onUseAsDestination={handleSelectTo}
                routeReady={routeReady}
              />
            </section>

            <TerritoryModuleDock
              island={island}
              activeLens={activeLens}
              counts={moduleCounts}
              tripCount={savedTripIds.size}
              onChangeLens={handleChangeLens}
              onOpenConcierge={handleOpenConcierge}
            />

            <TerritoryDirectory
              activeLens={activeLens}
              islandName={hero.name}
              entities={visibleDirectoryEntities}
              totalMatching={directoryEntities.length}
              totalCatalog={catalogStats.total}
              positionedCount={catalogStats.positioned}
              unresolvedCount={catalogStats.unresolved}
              markerCount={catalogStats.visibleMarkers}
              query={query}
              onChangeQuery={setQuery}
              positionFilter={directoryPositionFilter}
              onChangePositionFilter={setDirectoryPositionFilter}
              expanded={directoryExpanded}
              onToggleExpanded={() =>
                setDirectoryExpanded((current) => !current)
              }
              savedTripIds={savedTripIds}
              onFocusEntity={handleFocusEntity}
              onSaveEntity={handleSaveEntity}
            />

            <MobilityActionDock
              estates={islandEstates}
              fromGeoid={fromGeoid}
              toGeoid={toGeoid}
              fromEstate={fromEstate}
              toEstate={toEstate}
              mode={mode}
              passengers={passengers}
              luggage={luggage}
              onSelectFrom={handleSelectFrom}
              onSelectTo={handleSelectTo}
              onChangeMode={setMode}
              onChangePassengers={(value) =>
                setPassengers(Math.max(1, Math.min(12, value || 1)))
              }
              onChangeLuggage={(value) =>
                setLuggage(Math.max(0, Math.min(12, value || 0)))
              }
              onSubmit={continueToBooking}
              distanceMeters={routeMetrics?.distanceMeters}
              durationSeconds={routeMetrics?.durationSeconds}
            />
          </>
        )}
      </main>

      <ViConcierge
        context={conciergeContext}
        onSelectEstate={(geoid) => handleSelectEstateGeoid(geoid)}
        onSetPickup={handleSelectFrom}
        onSetDestination={handleSelectTo}
        placement="right"
        initiallyOpen={searchParams.get("concierge") === "open"}
      />
    </div>
  );
}

function TerritoryDirectory({
  activeLens,
  islandName,
  entities,
  totalMatching,
  totalCatalog,
  positionedCount,
  unresolvedCount,
  markerCount,
  query,
  onChangeQuery,
  positionFilter,
  onChangePositionFilter,
  expanded,
  onToggleExpanded,
  savedTripIds,
  onFocusEntity,
  onSaveEntity,
}: {
  activeLens: Lens;
  islandName: string;
  entities: TerritoryEntity[];
  totalMatching: number;
  totalCatalog: number;
  positionedCount: number;
  unresolvedCount: number;
  markerCount: number;
  query: string;
  onChangeQuery: (value: string) => void;
  positionFilter: DirectoryPositionFilter;
  onChangePositionFilter: (filter: DirectoryPositionFilter) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  savedTripIds: Set<string>;
  onFocusEntity: (entity: TerritoryEntity) => void;
  onSaveEntity: (entity: TerritoryEntity) => void;
}) {
  const hasDirectory = activeLens !== "drivers" && activeLens !== "demand";

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035]">
      <div className="border-b border-white/10 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100/55">
              Complete territory directory
            </div>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-white">
              {islandName} knowledge catalog
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/55">
              The directory includes every canonical catalog entry for the
              active lens, including records whose coordinates are still
              awaiting verification. Only positioned records become map markers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DirectoryStat label="Catalog" value={totalCatalog} />
            <DirectoryStat label="Positioned" value={positionedCount} />
            <DirectoryStat label="Unresolved" value={unresolvedCount} />
            <DirectoryStat label="Markers" value={markerCount} />
          </div>
        </div>

        {hasDirectory ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto] lg:items-center">
            <label className="block">
              <span className="sr-only">
                Search the active territory module
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => onChangeQuery(event.target.value)}
                placeholder={`Search ${activeLens} on ${islandName}`}
                className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-[#07131b] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/45 focus:ring-4 focus:ring-cyan-300/10"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <DirectoryFilterButton
                active={positionFilter === "all"}
                onClick={() => onChangePositionFilter("all")}
              >
                All entries
              </DirectoryFilterButton>
              <DirectoryFilterButton
                active={positionFilter === "positioned"}
                onClick={() => onChangePositionFilter("positioned")}
              >
                Positioned
              </DirectoryFilterButton>
              <DirectoryFilterButton
                active={positionFilter === "unpositioned"}
                onClick={() => onChangePositionFilter("unpositioned")}
              >
                Awaiting coordinates
              </DirectoryFilterButton>

              <div className="ml-auto text-xs font-semibold text-white/45">
                {totalMatching} matching{" "}
                {totalMatching === 1 ? "entry" : "entries"}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {!hasDirectory ? (
        <div className="px-4 py-10 text-center md:px-6">
          <div className="text-sm font-bold text-white">
            This lens uses a live operational overlay.
          </div>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/50">
            Driver and demand layers do not map to static territory catalog
            entries.
          </p>
        </div>
      ) : entities.length ? (
        <>
          <div className="grid gap-3 p-4 md:grid-cols-2 md:p-6 xl:grid-cols-3">
            {entities.map((entity) => (
              <TerritoryEntityCard
                key={entity.id}
                entity={entity}
                saved={savedTripIds.has(entity.id)}
                onFocus={() => onFocusEntity(entity)}
                onSave={() => onSaveEntity(entity)}
              />
            ))}
          </div>

          {totalMatching > 12 ? (
            <div className="border-t border-white/10 px-4 py-4 text-center md:px-6">
              <button
                type="button"
                onClick={onToggleExpanded}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-extrabold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                {expanded
                  ? "Show first 12 entries"
                  : `Show all ${totalMatching} entries`}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="px-4 py-10 text-center md:px-6">
          <div className="text-sm font-bold text-white">
            No catalog entries match these filters.
          </div>
          <p className="mt-2 text-sm text-white/50">
            Change the search, active lens, or coordinate-status filter.
          </p>
        </div>
      )}
    </section>
  );
}

function TerritoryEntityCard({
  entity,
  saved,
  onFocus,
  onSave,
}: {
  entity: TerritoryEntity;
  saved: boolean;
  onFocus: () => void;
  onSave: () => void;
}) {
  const detailHref = entityDetailHref(entity);
  const location =
    typeof entity.attributes.location === "string"
      ? entity.attributes.location
      : null;
  const cover = entity.media?.hero ?? entity.media?.images?.[0];

  return (
    <article className="group flex min-h-40 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/10 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.035] hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <Link
        href={detailHref}
        aria-label={`Open ${entity.title}`}
        className="relative block h-28 overflow-hidden bg-[linear-gradient(135deg,#12303b,#07131b)]"
      >
        <TerritoryCardCover
          src={cover}
          title={entity.title}
          kind={entity.kind}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#07131b] via-transparent to-transparent" />
        <span
          className={`absolute right-3 top-3 rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em] backdrop-blur ${
            entity.position
              ? "border-emerald-200/25 bg-emerald-950/70 text-emerald-100"
              : "border-amber-200/25 bg-amber-950/70 text-amber-100"
          }`}
        >
          {entity.position ? "Mapped" : "Needs coordinates"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-100/55">
              {entityKindLabel(entity.kind)}
            </div>
            <h3 className="mt-1 truncate text-base font-extrabold tracking-tight text-white">
              {entity.title}
            </h3>
          </div>
          {typeof entity.rating === "number" ? (
            <span className="shrink-0 text-xs font-extrabold text-amber-200">
              ★ {entity.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        {location ? (
          <div className="mt-1 truncate text-[10px] font-semibold text-cyan-100/45">
            {location}
          </div>
        ) : null}

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
          {entitySubtitle(entity)}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {(entity.tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold text-white/45"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
          <Link
            href={detailHref}
            className="rounded-xl bg-white px-3 py-2.5 text-center text-[10px] font-extrabold text-slate-950 transition hover:bg-cyan-50"
          >
            View
          </Link>
          <button
            type="button"
            disabled={!entity.position}
            onClick={onFocus}
            className="rounded-xl border border-cyan-200/20 bg-cyan-200/[0.07] px-3 py-2.5 text-[10px] font-extrabold text-cyan-50 transition hover:bg-cyan-200/[0.12] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {entity.position ? "Focus map" : "Not mapped"}
          </button>
          <button
            type="button"
            disabled={saved}
            onClick={onSave}
            className="col-span-2 rounded-xl border border-amber-200/20 bg-amber-200/[0.07] px-3 py-2.5 text-[10px] font-extrabold text-amber-50 transition hover:bg-amber-200/[0.12] disabled:cursor-default disabled:border-emerald-200/15 disabled:bg-emerald-200/[0.07] disabled:text-emerald-100"
          >
            {saved ? "Saved to My trip" : "Add to My trip"}
          </button>
        </div>
      </div>
    </article>
  );
}

function TerritoryCardCover({
  src,
  title,
  kind,
}: {
  src?: string;
  title: string;
  kind: TerritoryEntity["kind"];
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(62,215,230,0.18),transparent_45%),linear-gradient(135deg,#12303b,#07131b)] text-3xl font-black uppercase tracking-[0.12em] text-white/[0.12]">
        {entityKindLabel(kind)}
      </span>
    );
  }

  return (
    // Native img lets the card recover from invalid remote and local URLs.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
    />
  );
}

function DirectoryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 rounded-xl border border-white/10 bg-black/10 px-3 py-2">
      <div className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/40">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-extrabold text-white">{value}</div>
    </div>
  );
}

function DirectoryFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full border border-cyan-200/25 bg-cyan-200/[0.10] px-3 py-1.5 text-[10px] font-extrabold text-cyan-50"
          : "rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-extrabold text-white/50 transition hover:bg-white/[0.06] hover:text-white"
      }
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-3" role="status" aria-live="polite">
      <div className="flex h-16 animate-pulse items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-5">
        <span className="h-3 w-28 rounded-full bg-white/10" />
        <span className="h-3 w-16 rounded-full bg-white/10" />
      </div>
      <div className="grid min-h-[620px] place-items-center rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_35%),rgba(255,255,255,0.035)] p-6 text-center">
        <div>
          <ViBrandMark className="mx-auto h-14 w-14 animate-pulse" />
          <h1 className="mt-5 text-xl font-extrabold text-white">
            Opening the territory map
          </h1>
          <p className="mt-2 text-sm font-semibold text-white/45">
            Loading verified island geography and travel context…
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="rounded-[28px] border border-rose-300/20 bg-rose-300/[0.07] p-6 md:p-8"
      role="alert"
    >
      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-200/70">
        Estate data unavailable
      </div>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
        The map could not load its estate layer.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-rose-50/65">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#10242c] transition hover:bg-rose-50"
      >
        Try again
      </button>
    </section>
  );
}
