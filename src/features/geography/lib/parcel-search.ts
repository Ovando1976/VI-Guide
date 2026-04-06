import type { ParcelIslandCode, ParcelRecord } from "../types";

export function normalizeParcelSearch(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s\-./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchParcels(
  records: ParcelRecord[],
  query: string,
  island?: ParcelIslandCode | "all"
): ParcelRecord[] {
  const q = normalizeParcelSearch(query);
  if (!q) return [];

  return records
    .filter((record) => {
      if (island && island !== "all" && record.island !== island) return false;
      return record.searchText.includes(q);
    })
    .slice(0, 20);
}
