export type ParcelMobilityRow = {
  parcelId: string | null;
  sourceParcelNo?: string | null;
  estateName?: string | null;
  estateGeoid?: string | null;
  island?: string | null;
  centroid?: {
    lat: number;
    lng: number;
  } | null;
  taxiZoneId?: string | null;
  address?: string | null;
  ownerName?: string | null;
};

let parcelMobilityCache: ParcelMobilityRow[] | null = null;

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export async function loadParcelMobilityIndex(): Promise<ParcelMobilityRow[]> {
  if (parcelMobilityCache) return parcelMobilityCache;

  const response = await fetch("/data/usvi-parcels.mobility.json");

  if (!response.ok) {
    throw new Error(`Failed to load parcel mobility index: ${response.status}`);
  }

  const rows = (await response.json()) as ParcelMobilityRow[];

  parcelMobilityCache = Array.isArray(rows) ? rows : [];

  return parcelMobilityCache;
}

export async function resolveParcelMobilityById(
  parcelId: string
): Promise<ParcelMobilityRow | null> {
  const rows = await loadParcelMobilityIndex();
  const key = normalize(parcelId);

  return (
    rows.find(
      (row) =>
        normalize(row.parcelId) === key ||
        normalize(row.sourceParcelNo) === key
    ) ?? null
  );
}

export async function resolveParcelTaxiZoneId(
  parcelId: string
): Promise<string | null> {
  const parcel = await resolveParcelMobilityById(parcelId);
  return parcel?.taxiZoneId ?? null;
}

export async function searchParcelMobility(
  query: string,
  limit = 20
): Promise<ParcelMobilityRow[]> {
  const rows = await loadParcelMobilityIndex();
  const key = normalize(query);

  if (!key) return [];

  return rows
    .filter((row) => {
      return (
        normalize(row.parcelId).includes(key) ||
        normalize(row.sourceParcelNo).includes(key) ||
        normalize(row.estateName).includes(key) ||
        normalize(row.address).includes(key)
      );
    })
    .slice(0, limit);
}