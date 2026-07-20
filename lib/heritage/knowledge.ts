import { getTravelKnowledge } from "@/lib/travel-knowledge";
import type { DirectoryIsland, DirectoryItem } from "@/types/directory";

export type HeritageRecordType =
  | "place"
  | "person"
  | "event"
  | "government"
  | "law"
  | "ship"
  | "company"
  | "industry"
  | "occupation"
  | "document"
  | "map"
  | "collection";

export type HeritageSource = {
  id: string;
  title: string;
  publisher?: string;
  date?: string;
  pages?: string;
  url?: string;
  archiveReference?: string;
};

export type HeritageRecord = {
  id: string;
  slug: string;
  title: string;
  type: HeritageRecordType;
  summary: string;
  significance?: string;
  island?: DirectoryIsland;
  category?: string;
  dateStart?: string;
  dateEnd?: string;
  heroImage?: string;
  images: string[];
  relatedPlaceIds: string[];
  relatedRecordIds: string[];
  sources: HeritageSource[];
  searchTerms: string[];
  map?: {
    lat: number;
    lng: number;
    estateGeoid?: string;
  };
  provenance: {
    sourceSystem: "historic-directory" | "heritage-import";
    sourceId: string;
    reviewStatus: "canonical" | "reviewed" | "needs-review";
  };
};

function compact(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

export function historicDirectoryItemToHeritageRecord(
  item: DirectoryItem,
): HeritageRecord {
  const images = compact([item.heroImage, ...(item.images ?? [])]);
  const map =
    typeof item.lat === "number" && typeof item.lng === "number"
      ? {
          lat: item.lat,
          lng: item.lng,
          ...(item.estateGeoid ? { estateGeoid: item.estateGeoid } : {}),
        }
      : undefined;

  return {
    id: item.id,
    slug: item.slug,
    title: item.name,
    type: "place",
    summary: item.description,
    island: item.island,
    category: item.category,
    heroImage: item.heroImage,
    images,
    relatedPlaceIds: [],
    relatedRecordIds: [],
    sources: [],
    searchTerms: compact([
      item.name,
      item.category,
      item.address,
      ...item.tags,
      ...(item.bestFor ?? []),
    ]),
    ...(map ? { map } : {}),
    provenance: {
      sourceSystem: "historic-directory",
      sourceId: item.id,
      reviewStatus: "canonical",
    },
  };
}

export function getHeritagePlaceRecords(): HeritageRecord[] {
  return getTravelKnowledge("historic").map(historicDirectoryItemToHeritageRecord);
}

export function searchHeritageRecords(
  records: readonly HeritageRecord[],
  query: string,
): HeritageRecord[] {
  const term = query.trim().toLowerCase();
  if (!term) return [...records];

  return records.filter((record) =>
    [
      record.title,
      record.type,
      record.category,
      record.summary,
      record.significance,
      record.dateStart,
      record.dateEnd,
      ...record.searchTerms,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}
