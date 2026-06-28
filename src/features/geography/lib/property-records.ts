export type PropertyRecord = {
  parcelId: string;
  propertyId: string;
  label: string;
  address?: string;
  ownerName?: string;
  island?: string;
  estateName?: string;
  quarterName?: string;
  centroid?: {
    lat: number;
    lng: number;
  } | null;
  mapGeoRecordCount?: number | null;
  mapGeoSearchRank?: number | null;
  addressSource?: string;
  searchableText?: string[];
};

let cache: Record<string, PropertyRecord> | null = null;

export async function loadPropertyRecords() {
  if (cache) return cache;

  const res = await fetch("/data/usvi-property-records.json");

  if (!res.ok) {
    throw new Error(`Failed to load property records: ${res.status}`);
  }

  cache = await res.json();
  return cache;
}

export async function getPropertyRecord(parcelId: string) {
  const records = await loadPropertyRecords();
  return records[parcelId] ?? null;
}
