"use client";

import { useEffect, useMemo, useState } from "react";
import type { LineString } from "geojson";

import { EstateMap } from "@/components/estate-map";
import type { EstateRecord, IslandCode } from "@/types/usvi";
import type {
  TerritoryMapLens,
  TerritoryMapPlace,
  TerritoryMapSelection,
} from "@/types/territory-map";

type Props = {
  island: IslandCode;
  estates: EstateRecord[];
  places: TerritoryMapPlace[];
  activeLens: TerritoryMapLens;
  focusedPlaceId?: string | null;
  selectedEstateGeoid: string | null;
  fromGeoid: string;
  toGeoid: string;
  routeGeoJson: LineString | null;
  routeFocusNonce: number;
  onSelectEstate: (estate: EstateRecord) => void;
  onSelectFrom: (geoid: string) => void;
  onSelectTo: (geoid: string) => void;
  onSelectPlace?: (place: TerritoryMapSelection | null) => void;
  onChangeLens?: (lens: TerritoryMapLens) => void;
};

type LiveBeachResponse = {
  places?: TerritoryMapPlace[];
  supportPlaces?: TerritoryMapPlace[];
  count?: number;
  partial?: boolean;
  error?: string;
};

type ExtendedMapPlace = TerritoryMapPlace & {
  subtype?: string;
  googlePlaceId?: string;
};

type BeachFeedStatus = "loading" | "ready" | "error";

export function LiveTerritoryMap(props: Props) {
  const [beaches, setBeaches] = useState<TerritoryMapPlace[]>([]);
  const [beachSupport, setBeachSupport] = useState<TerritoryMapPlace[]>([]);
  const [beachStatus, setBeachStatus] = useState<BeachFeedStatus>("loading");

  useEffect(() => {
    const controller = new AbortController();
    setBeaches([]);
    setBeachSupport([]);
    setBeachStatus("loading");

    fetch(`/api/beaches/live?island=${props.island}&catalogVersion=3`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = (await response.json()) as LiveBeachResponse;
        if (!response.ok) {
          throw new Error(payload.error ?? `Beach discovery failed (${response.status})`);
        }

        const normalized = classifyBeachFeed([
          ...(Array.isArray(payload.places) ? payload.places : []),
          ...(Array.isArray(payload.supportPlaces) ? payload.supportPlaces : []),
        ]);

        setBeaches(normalized.beaches);
        setBeachSupport(normalized.support);
        setBeachStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBeaches([]);
        setBeachSupport([]);
        setBeachStatus("error");
      });

    return () => controller.abort();
  }, [props.island]);

  const mergedPlaces = useMemo(() => {
    const staticNonBeaches = props.places.filter((place) => !isBeachRecord(place));
    const staticBeachFallback = beachStatus === "error"
      ? props.places.filter(isUsableStaticBeach)
      : [];

    return dedupePlaces([
      ...staticNonBeaches,
      ...staticBeachFallback,
      ...beaches,
      ...beachSupport,
    ]);
  }, [beaches, beachStatus, beachSupport, props.places]);

  return <EstateMap {...props} places={mergedPlaces} />;
}

function classifyBeachFeed(items: TerritoryMapPlace[]) {
  const beaches: TerritoryMapPlace[] = [];
  const support: TerritoryMapPlace[] = [];

  for (const item of items) {
    const text = placeText(item);
    const name = String(item.name ?? item.title ?? "").toLowerCase();

    if (/\bparking\b|parking for|parking lot|car park/.test(text)) {
      support.push(asSupportPlace(item, "parking", "transport", "Beach parking"));
      continue;
    }

    if (/\bmarina\b|yacht harbor|yacht harbour|boat dock|boat ramp/.test(text)) {
      support.push(asSupportPlace(item, "marina", "transport", "Marina and boating access"));
      continue;
    }

    if (/snorkel|watersport|water sport|dive shop|scuba|kayak|paddle|sailing|charter|adventure|excursion|tour operator/.test(text)) {
      support.push(asSupportPlace(item, "watersports", "attraction", "Beach activity and watersports provider"));
      continue;
    }

    if (/restaurant|bar|grill|cafe|food|kitchen/.test(text)) {
      support.push(asSupportPlace(item, "beach-food", "food", "Food and drink near the beach"));
      continue;
    }

    if (/hotel|resort|villa|condo|apartment|lodging/.test(text)) {
      support.push(asSupportPlace(item, "beach-stay", "hotel", "Stay near the beach"));
      continue;
    }

    const explicitBeach = /\bbeach\b|\bstrand\b/.test(name)
      || String((item as ExtendedMapPlace).subtype ?? "") === "beach";
    if (!explicitBeach) continue;

    beaches.push({
      ...item,
      type: "beach",
      category: "Beach",
    });
  }

  return {
    beaches: dedupeBeaches(beaches),
    support: dedupePlaces(support),
  };
}

function asSupportPlace(
  item: TerritoryMapPlace,
  subtype: string,
  category: string,
  fallbackDescription: string,
): TerritoryMapPlace {
  return {
    ...item,
    id: String(item.id ?? "").replace(/^live-beach:/, `live-beach-support:${subtype}:`),
    type: "place",
    category,
    description: item.description || fallbackDescription,
    ...({ subtype } as Partial<ExtendedMapPlace>),
  };
}

function isBeachRecord(place: TerritoryMapPlace) {
  const explicitType = String(place.type ?? "").toLowerCase();
  const category = String(place.category ?? "").toLowerCase();
  return explicitType === "beach" || category === "beach";
}

function isUsableStaticBeach(place: TerritoryMapPlace) {
  return isBeachRecord(place)
    && typeof place.lat === "number"
    && Number.isFinite(place.lat)
    && typeof place.lng === "number"
    && Number.isFinite(place.lng);
}

function dedupeBeaches(items: TerritoryMapPlace[]) {
  const ranked = [...items].sort((a, b) => beachScore(b) - beachScore(a));
  const accepted: TerritoryMapPlace[] = [];

  for (const item of ranked) {
    if (typeof item.lat !== "number" || typeof item.lng !== "number") continue;
    const normalizedName = normalizeBeachName(String(item.name ?? item.title ?? ""));
    const duplicate = accepted.some((existing) => {
      if (typeof existing.lat !== "number" || typeof existing.lng !== "number") return false;
      const sameName = normalizeBeachName(String(existing.name ?? existing.title ?? "")) === normalizedName;
      const close = distanceMeters(existing.lat, existing.lng, item.lat, item.lng) <= 180;
      return sameName || (close && namesOverlap(existing, item));
    });
    if (!duplicate) accepted.push(item);
  }

  return accepted;
}

function beachScore(place: TerritoryMapPlace) {
  return (place.image ? 8 : 0) + (place.rating ?? 0);
}

function namesOverlap(a: TerritoryMapPlace, b: TerritoryMapPlace) {
  const left = new Set(normalizeBeachName(String(a.name ?? a.title ?? "")).split(/\s+/).filter(Boolean));
  const right = new Set(normalizeBeachName(String(b.name ?? b.title ?? "")).split(/\s+/).filter(Boolean));
  if (!left.size || !right.size) return false;
  const shared = [...left].filter((token) => right.has(token)).length;
  return shared / Math.min(left.size, right.size) >= 0.6;
}

function normalizeBeachName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(public|park|st\.?\s*thomas|st\.?\s*john|st\.?\s*croix|usvi|u\.?s\.?v\.?i\.?)\b/g, " ")
    .replace(/\bbeach\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function placeText(item: TerritoryMapPlace) {
  return `${item.name ?? ""} ${item.title ?? ""} ${item.category ?? ""} ${item.type ?? ""} ${item.description ?? ""}`.toLowerCase();
}

function dedupePlaces(items: TerritoryMapPlace[]) {
  const records = new Map<string, TerritoryMapPlace>();

  for (const item of items) {
    const extended = item as ExtendedMapPlace;
    const googleId = extended.googlePlaceId?.trim();
    const name = String(item.name ?? item.title ?? "place")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const coordinate = `${Number(item.lat).toFixed(5)}:${Number(item.lng).toFixed(5)}`;
    const key = googleId || `${name}:${coordinate}`;

    if (!records.has(key) || String(item.id ?? "").startsWith("live-beach:")) {
      records.set(key, item);
    }
  }

  return [...records.values()];
}
