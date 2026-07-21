import { TERRITORY_TIMELINE_EVENTS } from "@/data/heritage/territory-timeline";
import { USVI_GOVERNORS } from "@/data/heritage/usvi-governors";
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
  href?: string;
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
    href: `/historic/${item.slug}`,
    ...(map ? { map } : {}),
    provenance: {
      sourceSystem: "historic-directory",
      sourceId: item.id,
      reviewStatus: "canonical",
    },
  };
}

function timelineEventToHeritageRecord(
  event: (typeof TERRITORY_TIMELINE_EVENTS)[number],
): HeritageRecord {
  return {
    id: `timeline:${event.id}`,
    slug: event.id,
    title: event.title,
    type: "event",
    summary: event.summary,
    island: event.island === "territory" ? undefined : event.island,
    category: event.era,
    dateStart: String(event.year),
    dateEnd: event.endYear ? String(event.endYear) : undefined,
    images: [],
    relatedPlaceIds: [],
    relatedRecordIds: [],
    sources: [],
    searchTerms: compact([event.dateLabel, event.era, event.island, ...event.tags]),
    href: `/heritage/timeline#${event.id}`,
    provenance: {
      sourceSystem: "heritage-import",
      sourceId: event.id,
      reviewStatus: "reviewed",
    },
  };
}

function governorToHeritageRecord(
  governor: (typeof USVI_GOVERNORS)[number],
): HeritageRecord {
  return {
    id: `governor:${governor.id}`,
    slug: governor.id,
    title: governor.name,
    type: "government",
    summary: governor.summary,
    category: governor.era,
    dateStart: governor.termStart,
    dateEnd: governor.termEnd ?? undefined,
    images: [],
    relatedPlaceIds: [],
    relatedRecordIds: [],
    sources: [],
    searchTerms: compact([
      governor.title,
      governor.termLabel,
      governor.party,
      governor.appointedBy,
      ...governor.milestones,
    ]),
    href: `/heritage/governors#${governor.id}`,
    provenance: {
      sourceSystem: "heritage-import",
      sourceId: governor.id,
      reviewStatus: "reviewed",
    },
  };
}

export function getHeritagePlaceRecords(): HeritageRecord[] {
  return getTravelKnowledge("historic").map(historicDirectoryItemToHeritageRecord);
}

export function getHeritageTimelineRecords(): HeritageRecord[] {
  return TERRITORY_TIMELINE_EVENTS.map(timelineEventToHeritageRecord);
}

export function getHeritageGovernorRecords(): HeritageRecord[] {
  return USVI_GOVERNORS.map(governorToHeritageRecord);
}

export function getAllHeritageRecords(): HeritageRecord[] {
  return [
    ...getHeritagePlaceRecords(),
    ...getHeritageTimelineRecords(),
    ...getHeritageGovernorRecords(),
  ];
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
