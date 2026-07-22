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

export function LiveTerritoryMap(props: Props) {
  const [beaches, setBeaches] = useState<TerritoryMapPlace[]>([]);
  const [beachSupport, setBeachSupport] = useState<TerritoryMapPlace[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setBeaches([]);
    setBeachSupport([]);

    fetch(`/api/beaches/live?island=${props.island}&catalogVersion=2`, {
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
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBeaches([]);
        setBeachSupport([]);
      });

    return () => controller.abort();
  }, [props.island]);

  const mergedPlaces = useMemo(
    () => dedupePlaces([...props.places, ...beaches, ...beachSupport]),
    [beaches, beachSupport, props.places],
  );

  return <EstateMap {...props} places={mergedPlaces} />;
}

function classifyBeachFeed(items: TerritoryMapPlace[]) {
  const beaches: TerritoryMapPlace[] = [];
  const support: TerritoryMapPlace[] = [];

  for (const item of items) {
    const text = `${item.name ?? ""} ${item.title ?? ""} ${item.category ?? ""} ${item.type ?? ""} ${item.description ?? ""}`.toLowerCase();
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

    const explicitBeach = /\bbeach\b|\bstrand\b/.test(name) || String((item as ExtendedMapPlace).subtype ?? "") === "beach";
    if (!explicitBeach) continue;

    beaches.push({
      ...item,
      type: "beach",
      category: "Beach",
    });
  }

  return { beaches, support };
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
    ...( { subtype } as Partial<ExtendedMapPlace> ),
  };
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
