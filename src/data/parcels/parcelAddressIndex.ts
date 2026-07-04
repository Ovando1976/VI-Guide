import type { IslandCode } from "../../types";

export type ParcelAddressQuality =
  | "direct"
  | "parcel_estate"
  | "estate_parcel"
  | "parcel_only"
  | "mapgeo_physical_address";

export type ParcelAddressRecord = {
  parcelId: string;
  sourceParcelNo?: string;
  normalizedParcelId?: string;
  normalizedSearchKey?: string;

  address?: string;
  displayLabel: string;
  mapGeoPhysicalAddress?: string;
  mapGeoMatched?: boolean;

  island: IslandCode;
  estateName?: string;
  estateGeoid?: string;
  ownerName?: string;

  lat?: number;
  lng?: number;
  taxiZoneId?: string;

  addressQuality?: ParcelAddressQuality;
  confidence?: number;
  needsAddressReview?: boolean;
  needsZoneReview?: boolean;
  zoneFilledByNearest?: boolean;
  nearestZoneMiles?: number;
};

export function parcelRuntimeUrlForIsland(island: IslandCode) {
  return `/data/parcels/${island}.json`;
}

export async function loadParcelAddressIndexForIsland(
  island: IslandCode,
): Promise<ParcelAddressRecord[]> {
  const response = await fetch(parcelRuntimeUrlForIsland(island));

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export function normalizeParcelAddressId(value: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^PARCEL[:#\s-]*/i, "")
    .replace(/^PID[:#\s-]*/i, "")
    .replace(/^PIN[:#\s-]*/i, "")
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^A-Z0-9.-]/g, "");
}

export function parcelAddressSearchKey(value: string) {
  return normalizeParcelAddressId(value).replace(/[^A-Z0-9]/g, "");
}

export function parcelAddressToMobilityLabel(record: ParcelAddressRecord) {
  return (
    record.mapGeoPhysicalAddress ||
    record.address ||
    record.displayLabel ||
    record.parcelId
  );
}

export function searchParcelAddresses(
  records: ParcelAddressRecord[],
  query: string,
  island?: IslandCode,
  limit = 25,
) {
  const rawQuery = query.trim();

  if (!rawQuery) {
    return [];
  }

  const textQuery = rawQuery.toLowerCase();
  const keyQuery = parcelAddressSearchKey(rawQuery).toLowerCase();

  return records
    .filter((record) => {
      if (island && record.island !== island) {
        return false;
      }

      const textFields = [
        record.parcelId,
        record.sourceParcelNo,
        record.normalizedParcelId,
        record.normalizedSearchKey,
        record.displayLabel,
        record.address,
        record.mapGeoPhysicalAddress,
        record.estateName,
        record.ownerName,
        record.taxiZoneId,
      ]
        .filter(Boolean)
        .map((value) => String(value));

      const textMatch = textFields.some((value) =>
        value.toLowerCase().includes(textQuery),
      );

      const keyMatch = textFields.some((value) =>
        parcelAddressSearchKey(value).toLowerCase().includes(keyQuery),
      );

      return textMatch || keyMatch;
    })
    .slice(0, limit);
}

export function getParcelAddressById(
  records: ParcelAddressRecord[],
  parcelId: string,
) {
  const key = parcelAddressSearchKey(parcelId);

  return (
    records.find((record) => {
      return [
        record.parcelId,
        record.sourceParcelNo,
        record.normalizedParcelId,
        record.normalizedSearchKey,
      ]
        .filter(Boolean)
        .some((value) => parcelAddressSearchKey(String(value)) === key);
    }) || null
  );
}
