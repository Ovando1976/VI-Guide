import type { GeographyIslandCode, ParcelRecord } from "../types";

export type ParcelFilterSpecification = any[];

export function buildParcelFilter(options: {
  island: "all" | GeographyIslandCode;
  estateGeoid?: string | null;
}): ParcelFilterSpecification {
  const filters: ParcelFilterSpecification = ["all"];

  if (options.island !== "all") {
    filters.push(["==", ["get", "island"], options.island]);
  }

  if (options.estateGeoid) {
    filters.push(["==", ["get", "estateGeoid"], options.estateGeoid]);
  }

  return filters;
}

export function matchesParcelFilter(
  record: ParcelRecord,
  options: { island: "all" | GeographyIslandCode; estateGeoid?: string | null }
) {
  if (options.island !== "all" && record.island !== options.island) return false;
  if (options.estateGeoid && record.estateGeoid !== options.estateGeoid) return false;
  return true;
}
