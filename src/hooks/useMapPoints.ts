import { useMemo } from "react";

import { canonicalDiscoveries as discoveries } from "../data/canonical/discoveriesCanonical";
import type { IslandCode } from "../types";
import type { MapFilter, MapPoint } from "../components/maps/IslandMap";

type UseMapPointsResult = {
  points: MapPoint[];
  loading: boolean;
  error: string | null;
};

type MapPointType = Exclude<MapFilter, "all">;

function normalizeIsland(value: unknown): IslandCode {
  const text = String(value ?? "").toLowerCase().trim();

  if (text === "stt" || text.includes("thomas")) return "st_thomas";
  if (text === "stj" || text.includes("john")) return "st_john";
  if (text === "stx" || text.includes("croix")) return "st_croix";
  if (text.includes("water")) return "water_island";

  if (
    text === "st_thomas" ||
    text === "st_john" ||
    text === "st_croix" ||
    text === "water_island"
  ) {
    return text;
  }

  return "st_thomas";
}

function normalizeCategory(value: unknown): string {
  const text = String(value ?? "").toLowerCase().trim();

  if (text === "beaches" || text === "beach") return "beach";
  if (text.includes("restaurant") || text === "food" || text === "nightlife") return "food";
  if (text === "event" || text === "events") return "event";
  if (text === "historic_sites" || text === "historic-site" || text === "history") return "history";
  if (text === "transportation" || text === "transport") return "transport";
  if (text === "ferry-terminals" || text === "ferry_terminals") return "transport";
  if (text === "cruise-ports" || text === "cruise_ports") return "transport";
  if (text === "shopping") return "attraction";
  if (text === "hiking-trails" || text === "hiking-trail") return "attraction";
  if (text === "attractions" || text === "attraction") return "attraction";
  if (text === "business" || text === "businesses") return "business" as MapPointType;

  return "attraction";
}

function getLatLng(record: (typeof discoveries)[number]) {
  const lat = record.lat;
  const lng = record.lng;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function toMapPoint(record: (typeof discoveries)[number]): MapPoint | null {
  const coords = getLatLng(record);
  if (!coords) return null;

  const rawType = normalizeCategory(record.category ?? record.type);

  if (rawType === "business") {
    return null;
  }

  const type = rawType as MapPointType;

  return {
    id: record.id,
    type,
    lat: coords.lat,
    lng: coords.lng,
    title: record.title || "Untitled Place",
    description: record.description || "",
  };
}

function dedupePoints(points: MapPoint[]) {
  const seen = new Set<string>();

  return points.filter((point) => {
    const key = `${point.type}:${point.id}:${point.lat}:${point.lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useMapPoints(selectedIsland: IslandCode): UseMapPointsResult {
  const points = useMemo(() => {
    const island = normalizeIsland(selectedIsland);

    return dedupePoints(
      discoveries
        .filter((record) => normalizeIsland(record.island) === island)
        .map(toMapPoint)
        .filter((point): point is MapPoint => Boolean(point)),
    );
  }, [selectedIsland]);

  return {
    points,
    loading: false,
    error: null,
  };
}