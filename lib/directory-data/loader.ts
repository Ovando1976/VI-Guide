import beachesData from "@/data/travel-knowledge/beaches.json";
import placesData from "@/data/travel-knowledge/places.json";

import {
  asRecord,
  optionalBoolean,
  optionalString,
  requiredString,
  stringArray,
} from "@/lib/data-utils/parsing";

import { RESTORED_BEACH_RECORDS } from "./beach-restoration";
import type {
  DirectoryDataset,
  DirectoryIsland,
  DirectoryRecord,
  DirectoryRecordFilters,
} from "./types";

const ISLANDS = new Set<DirectoryIsland>(["stt", "stj", "stx"]);

const cache = new Map<DirectoryDataset, readonly DirectoryRecord[]>();

export function getDirectoryRecords(
  dataset: DirectoryDataset,
  filters: DirectoryRecordFilters = {}
): readonly DirectoryRecord[] {
  return loadDataset(dataset).filter((record) => {
    if (filters.island && record.island !== filters.island) return false;

    if (
      filters.category &&
      record.category.toLowerCase() !== filters.category.toLowerCase()
    ) {
      return false;
    }

    if (
      typeof filters.featured === "boolean" &&
      record.featured !== filters.featured
    ) {
      return false;
    }

    return true;
  });
}

export function getPlaces(
  filters: DirectoryRecordFilters = {}
): readonly DirectoryRecord[] {
  return getDirectoryRecords("places", filters);
}

export function getBeaches(
  filters: DirectoryRecordFilters = {}
): readonly DirectoryRecord[] {
  return getDirectoryRecords("beaches", filters);
}

export function getDirectoryRecordBySlug(
  dataset: DirectoryDataset,
  slug: string
): DirectoryRecord | undefined {
  const normalized = normalizeSlug(slug);

  return loadDataset(dataset).find(
    (record) =>
      normalizeSlug(record.slug) === normalized ||
      normalizeSlug(record.id) === normalized
  );
}

export function clearDirectoryDataCache(): void {
  cache.clear();
}

function loadDataset(dataset: DirectoryDataset): readonly DirectoryRecord[] {
  const cached = cache.get(dataset);
  if (cached) return cached;

  const source: readonly unknown[] =
    dataset === "places"
      ? (placesData as readonly unknown[])
      : [
          ...(beachesData as readonly unknown[]),
          ...RESTORED_BEACH_RECORDS,
        ];

  if (!Array.isArray(source)) {
    throw new TypeError(`${dataset} must contain a top-level JSON array.`);
  }

  const ids = new Set<string>();
  const slugs = new Set<string>();

  const records = source.map((value, index) =>
    parseDirectoryRecord(value, dataset, index)
  );

  for (const record of records) {
    if (ids.has(record.id)) {
      throw new TypeError(`Duplicate ${dataset} id: ${record.id}`);
    }

    if (slugs.has(record.slug)) {
      throw new TypeError(`Duplicate ${dataset} slug: ${record.slug}`);
    }

    ids.add(record.id);
    slugs.add(record.slug);
  }

  const frozenRecords: readonly DirectoryRecord[] = Object.freeze(
    records
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((record) =>
        Object.freeze({
          ...record,
          tags: Object.freeze([...record.tags]),
          bestFor: Object.freeze([...record.bestFor]),
          hours: Object.freeze([...record.hours]),
          amenities: Object.freeze([...record.amenities]),
          accessNotes: Object.freeze([...record.accessNotes]),
          safetyNotes: Object.freeze([...record.safetyNotes]),
          sourceUrls: Object.freeze([...record.sourceUrls]),
        })
      )
  );

  cache.set(dataset, frozenRecords);
  return frozenRecords;
}

function parseDirectoryRecord(
  value: unknown,
  dataset: DirectoryDataset,
  index: number
): DirectoryRecord {
  const label = `${dataset}[${index}]`;
  const record = asRecord(value, label);

  const id = requiredString(record.id, `${label}.id`);
  const name = requiredString(record.name, `${label}.name`);

  return {
    id,
    slug: optionalString(record.slug) ?? normalizeSlug(name),
    name,
    island: parseIsland(record.island, `${label}.island`),
    category:
      optionalString(record.category) ??
      (dataset === "beaches" ? "beach" : "place"),
    description:
      optionalString(record.description) ??
      `${name} is a destination in the U.S. Virgin Islands.`,
    heroImage:
      optionalString(record.heroImage) ??
      "/images/places/fallbacks/place-stt.svg",
    tags: stringArray(record.tags),
    featured: optionalBoolean(record.featured) ?? false,
    bestFor: stringArray(record.bestFor),
    address: optionalString(record.address),
    phone: optionalString(record.phone),
    website: optionalString(record.website),
    hours: stringArray(record.hours),
    amenities: stringArray(record.amenities),
    accessNotes: stringArray(record.accessNotes),
    safetyNotes: stringArray(record.safetyNotes),
    fees: optionalString(record.fees),
    parking: optionalString(record.parking),
    accessibility: optionalString(record.accessibility),
    sourceLabel: optionalString(record.sourceLabel),
    sourceUrl: optionalString(record.sourceUrl),
    sourceUrls: stringArray(record.sourceUrls),
    verifiedAt: optionalString(record.verifiedAt),
  };
}

function parseIsland(value: unknown, label: string): DirectoryIsland {
  if (typeof value === "string" && ISLANDS.has(value as DirectoryIsland)) {
    return value as DirectoryIsland;
  }

  throw new TypeError(`${label} must be one of: stt, stj, stx`);
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
