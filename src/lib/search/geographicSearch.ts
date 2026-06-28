// src/lib/search/geographicSearch.ts
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";

export type GeographicIndexSource = GeographicIndexItem["source"];

export type GeographicSearchFilters = {
  island?: string;
  source?: GeographicIndexSource | "all";
  category?: string;
  limit?: number;
};

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function searchAllGeography(
  query: string,
  filters: GeographicSearchFilters = {},
): GeographicIndexItem[] {
  const q = normalize(query);
  const limit = filters.limit ?? 50;

  return geographicIndexItems
    .filter((item) => {
      if (filters.source && filters.source !== "all" && item.source !== filters.source) {
        return false;
      }

      if (filters.island && filters.island !== "all" && item.island !== filters.island) {
        return false;
      }

      if (filters.category && filters.category !== "all" && item.category !== filters.category) {
        return false;
      }

      if (!q) return true;

      return (
        item.searchText.includes(q) ||
        normalize(item.name).includes(q) ||
        normalize(item.description).includes(q) ||
        normalize(item.estateName).includes(q)
      );
    })
    .slice(0, limit);
}

export function getGeographyBySource(source: GeographicIndexSource, limit = 100) {
  return geographicIndexItems.filter((item) => item.source === source).slice(0, limit);
}

export function getMappableGeography(limit = 1000) {
  return geographicIndexItems.filter((item) => item.coordinates).slice(0, limit);
}