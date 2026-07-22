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
  count?: number;
  partial?: boolean;
  error?: string;
};

export function LiveTerritoryMap(props: Props) {
  const [beaches, setBeaches] = useState<TerritoryMapPlace[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setBeaches([]);

    fetch(`/api/beaches/live?island=${props.island}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as LiveBeachResponse;
        if (!response.ok) throw new Error(payload.error ?? `Beach discovery failed (${response.status})`);
        setBeaches(Array.isArray(payload.places) ? payload.places : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBeaches([]);
      });

    return () => controller.abort();
  }, [props.island]);

  const mergedPlaces = useMemo(
    () => dedupePlaces([...props.places, ...beaches]),
    [beaches, props.places],
  );

  return <EstateMap {...props} places={mergedPlaces} />;
}

function dedupePlaces(items: TerritoryMapPlace[]) {
  const records = new Map<string, TerritoryMapPlace>();

  for (const item of items) {
    const extended = item as TerritoryMapPlace & { googlePlaceId?: string };
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
