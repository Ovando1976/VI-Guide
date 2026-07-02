// src/lib/search/geographicSearch.ts
import {
  geographicIndexItems,
  type GeographicIndexItem,
} from "../../data/core/geographicIndex";
import {
  atlasSearchIndex,
  type AtlasSearchRecord,
} from "../../data/atlas/atlasSearchIndex";

export type GeographicIndexSource = GeographicIndexItem["source"];

export type GeographicSearchFilters = {
  island?: string;
  source?: GeographicIndexSource | "gazetteer" | "all";
  category?: string;
  limit?: number;
};

const atlasRecords: readonly AtlasSearchRecord[] = atlasSearchIndex;

function normalize(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sameIsland(itemIsland: string | undefined, filterIsland?: string) {
  if (!filterIsland || filterIsland === "all") return true;
  if (!itemIsland || itemIsland === "all") return true;
  return itemIsland === filterIsland;
}

function sourceMatches(record: AtlasSearchRecord, source?: GeographicSearchFilters["source"]) {
  if (!source || source === "all") return true;
  return record.sources.includes(source);
}

function categoryMatches(record: AtlasSearchRecord, category?: string) {
  if (!category || category === "all") return true;
  return normalize(record.type) === normalize(category);
}

function scoreRecord(record: AtlasSearchRecord, query: string) {
  if (!query) return 1;

  const q = normalize(query);
  const name = normalize(record.name);
  const displayName = normalize(record.displayName);
  const type = normalize(record.type);
  const searchText = normalize(record.searchText);
  const aliases = normalize(record.aliases.join(" "));
  const related = normalize(record.relatedNames.join(" "));

  let score = 0;

  if (displayName === q) score += 1000;
  if (name === q) score += 900;
  if (displayName.includes(q)) score += 300;
  if (name.includes(q)) score += 250;
  if (aliases.includes(q)) score += 200;
  if (related.includes(q)) score += 150;
  if (searchText.includes(q)) score += 100;

  if (type === "estate" && q.includes("estate")) score += 200;
  if (record.sources.includes("gazetteer")) score += 25;
  if (record.relationshipCount > 0) score += Math.min(record.relationshipCount * 10, 80);

  return score;
}

function atlasRecordToGeographicItem(record: AtlasSearchRecord): GeographicIndexItem {
  const existing = geographicIndexItems.find((item) =>
    record.sourceIds.includes(item.id),
  );

  if (existing) {
    return {
      ...existing,
      searchText: record.searchText,
      aliases: [...new Set([...(existing.aliases || []), ...record.aliases])],
      tags: [...new Set([...(existing.tags || []), ...record.sources])],
      relatedNames: record.relatedNames,
      atlasSources: record.sources,
      atlasEvidence: record.evidence,
      atlasRelationshipCount: record.relationshipCount,
    } as unknown as GeographicIndexItem;
  }

  return {
    id: record.sourceIds[0] || record.id,
    source: record.primarySource,
    category: record.type,
    type: record.type,
    name: record.name,
    displayName: record.displayName,
    island: record.island,
    coordinates:
      typeof record.lat === "number" && typeof record.lng === "number"
        ? { lat: record.lat, lng: record.lng }
        : null,
    lat: record.lat,
    lng: record.lng,
    aliases: [...record.aliases],
    searchText: record.searchText,
    description:
      record.evidence[0]?.label ||
      `${record.displayName} is part of the VI Guide Atlas index.`,
    relatedNames: record.relatedNames,
    atlasSources: record.sources,
    atlasEvidence: record.evidence,
    atlasRelationshipCount: record.relationshipCount,
  } as unknown as GeographicIndexItem;
}

 export function searchAllGeography(

  query: string,

  filters: GeographicSearchFilters = {},

): GeographicIndexItem[] {

  const q = normalize(query);

  const limit = filters.limit ?? 50;

  return atlasRecords

    .filter((record) => {

      if (!sourceMatches(record, filters.source)) return false;

      if (!sameIsland(record.island, filters.island)) return false;

      if (!categoryMatches(record, filters.category)) return false;

      if (!q) return true;

      return scoreRecord(record, q) > 0;

    })

    .map((record) => ({

      record,

      score: scoreRecord(record, q),

    }))

    .sort((a, b) => b.score - a.score)

    .slice(0, limit)

    .map(({ record }) => atlasRecordToGeographicItem(record));

}

export function getGeographyBySource(
  source: GeographicSearchFilters["source"],
  limit = 100,
) {
  return searchAllGeography("", { source, limit });
}

