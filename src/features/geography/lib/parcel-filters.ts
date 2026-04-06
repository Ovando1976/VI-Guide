import type { ParcelIslandCode, ParcelRecord } from "../types";

export function filterParcelsByIsland(
  records: ParcelRecord[],
  island: ParcelIslandCode | "all"
): ParcelRecord[] {
  if (island === "all") return records;
  return records.filter((record) => record.island === island);
}

export function filterParcelsByEstate(
  records: ParcelRecord[],
  estateGeoid: string | null
): ParcelRecord[] {
  if (!estateGeoid) return records;
  return records.filter((record) => record.estateGeoid === estateGeoid);
}
