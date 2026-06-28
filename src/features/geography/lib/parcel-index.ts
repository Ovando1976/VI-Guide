export type ParcelIndexRecord = {
  parcelId: string;
  label: string;
  address?: string;
  ownerName?: string;
  island?: string;
  estateName?: string;
  quarterName?: string;
  lat?: number | null;
  lng?: number | null;
  searchableText?: string[];
};

let cache: ParcelIndexRecord[] | null = null;

export async function loadParcelIndex() {
  if (cache) return cache;

  const res = await fetch("/data/usvi-parcels.index.json");

  if (!res.ok) {
    throw new Error(`Failed to load parcel index: ${res.status}`);
  }

  cache = await res.json();
  return cache;
}

export async function searchParcelIndex(query: string, limit = 25) {
  const text = query.trim().toLowerCase();
  if (!text) return [];

  const rows = await loadParcelIndex();

  return rows
    .filter((row) =>
      [
        row.parcelId,
        row.label,
        row.address,
        row.ownerName,
        row.estateName,
        row.quarterName,
        ...(row.searchableText ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(text)
    )
    .slice(0, limit);
}
