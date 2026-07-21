"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { feedIntelligenceContext } from "@/lib/intelligence/client";
import type {
  IntelligenceIsland,
  IntelligenceLocation,
} from "@/types/intelligence";

function islandFrom(value: string | null): IntelligenceIsland {
  const normalized = value?.trim().toLowerCase();
  return normalized === "stj" || normalized === "stx" ? normalized : "stt";
}

function coordinate(value: string | null) {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function locationFromParams(
  params: ReturnType<typeof useSearchParams>,
  island: IntelligenceIsland,
): IntelligenceLocation | undefined {
  const id = params.get("place")?.trim();
  const name = params.get("placeName")?.trim();
  if (!id || !name) return undefined;

  return {
    id,
    name,
    island,
    kind: params.get("placeType")?.trim() || undefined,
    lat: coordinate(params.get("placeLat")),
    lng: coordinate(params.get("placeLng")),
  };
}

export function MapIntelligenceBridge() {
  const params = useSearchParams();
  const serialized = params.toString();

  useEffect(() => {
    const island = islandFrom(params.get("island"));
    const selectedPlace = locationFromParams(params, island);
    const pickupName = params.get("pickupName")?.trim();
    const destinationName = params.get("destinationName")?.trim();

    feedIntelligenceContext("map", {
      island,
      selectedPlace,
      pickup: pickupName
        ? {
            id: params.get("pickup")?.trim() || undefined,
            name: pickupName,
            island,
            kind: "estate",
          }
        : undefined,
      destination: destinationName
        ? {
            id: params.get("destination")?.trim() || undefined,
            name: destinationName,
            island,
            kind: "estate",
          }
        : undefined,
      preferences: {
        interests: params.get("lens") ? [params.get("lens") as string] : [],
      },
    });
  }, [params, serialized]);

  return null;
}
