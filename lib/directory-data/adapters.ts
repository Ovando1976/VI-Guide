import type { TravelKnowledgeRecord } from "@/lib/territory/adapters";
import type { DirectoryItem } from "@/types/directory";
import { isActionable } from "@/lib/catalog-status";

import { getBeaches, getPlaces } from "./loader";
import type { DirectoryRecord } from "./types";

export function directoryRecordToDirectoryItem(
  record: DirectoryRecord
): DirectoryItem {
  return {
    ...record,
    tags: [...record.tags],
    bestFor: [...record.bestFor],
    hours: [...record.hours],
    amenities: [...record.amenities],
    accessibility: [...record.accessibility],
    aliases: [...record.aliases],
  };
}

export function directoryRecordToTravelKnowledgeRecord(
  record: DirectoryRecord
): TravelKnowledgeRecord {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    island: record.island,
    category: record.category,
    description: record.description,
    heroImage: record.heroImage,
    tags: [...record.tags],
    featured: record.featured,
    bestFor: [...record.bestFor],
  };
}

export function getPlaceDirectoryItems(): DirectoryItem[] {
  return getPlaces().map(directoryRecordToDirectoryItem);
}

export function getBeachDirectoryItems(): DirectoryItem[] {
  return getBeaches().map(directoryRecordToDirectoryItem);
}

export function getPlaceTravelKnowledgeRecords(): TravelKnowledgeRecord[] {
  return getPlaces()
    .filter((record) => isActionable(directoryRecordToDirectoryItem(record)))
    .map(directoryRecordToTravelKnowledgeRecord);
}

export function getBeachTravelKnowledgeRecords(): TravelKnowledgeRecord[] {
  return getBeaches().map(directoryRecordToTravelKnowledgeRecord);
}
