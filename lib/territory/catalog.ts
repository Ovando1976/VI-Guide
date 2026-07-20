import {
  getBeachTravelKnowledgeRecords,
  getPlaceTravelKnowledgeRecords,
} from "@/lib/directory-data";
import { ACCOMMODATIONS } from "@/lib/accommodations";
import { getHistoricTravelKnowledgeRecords } from "@/lib/historic-sites";
import type {
  TerritoryEntity,
  TerritoryMapPlace,
  TerritoryQuery,
} from "@/types/territory";
import {
  accommodationToTerritoryEntity,
  territoryEntityToMapPlace,
  travelKnowledgeToTerritoryEntity,
} from "./adapters";

const places = getPlaceTravelKnowledgeRecords();
const beaches = getBeachTravelKnowledgeRecords();
const historicSites = getHistoricTravelKnowledgeRecords();

const staticEntities: TerritoryEntity[] = dedupe([
  ...ACCOMMODATIONS.map(accommodationToTerritoryEntity),

  ...places.map((record) =>
    travelKnowledgeToTerritoryEntity(record)
  ),

  ...beaches.map((record) =>
    travelKnowledgeToTerritoryEntity(record, "beach")
  ),

  ...historicSites.map((record) =>
    travelKnowledgeToTerritoryEntity(record, "historic")
  ),
]);

export type TerritoryCatalogStats = Record<string, number> & {
  total: number;
  positioned: number;
};

export function queryTerritoryMapPlaces(
  query: TerritoryQuery = {}
): TerritoryMapPlace[] {
  return queryTerritoryEntities({
    ...query,
    positionedOnly: true,
  })
    .map(territoryEntityToMapPlace)
    .filter(
      (place): place is TerritoryMapPlace =>
        typeof place.lat === "number" &&
        Number.isFinite(place.lat) &&
        typeof place.lng === "number" &&
        Number.isFinite(place.lng)
    );
}

export function queryTerritoryEntities(
  query: TerritoryQuery = {}
): TerritoryEntity[] {
  const text = query.text?.trim().toLowerCase();

  const categories = new Set(
    query.categories?.map((value) => value.toLowerCase())
  );

  const kinds = new Set(query.kinds);

  return staticEntities.filter((entity) => {
    if (query.island && entity.island !== query.island) {
      return false;
    }

    if (kinds.size > 0 && !kinds.has(entity.kind)) {
      return false;
    }

    if (query.positionedOnly && !entity.position) {
      return false;
    }

    if (
      categories.size > 0 &&
      !entity.categories.some((category) =>
        categories.has(category.toLowerCase())
      )
    ) {
      return false;
    }

    if (text) {
      const haystack = [
        entity.title,
        entity.summary,
        entity.description,
        ...entity.categories,
        ...entity.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(text)) {
        return false;
      }
    }

    return true;
  });
}

export function getTerritoryEntity(id: string): TerritoryEntity | null {
  return staticEntities.find((entity) => entity.id === id) ?? null;
}

export function getTerritoryCatalogStats(): TerritoryCatalogStats {
  return staticEntities.reduce<TerritoryCatalogStats>(
    (stats, entity) => {
      stats.total += 1;
      stats[entity.kind] = (stats[entity.kind] ?? 0) + 1;
      stats[entity.island] = (stats[entity.island] ?? 0) + 1;

      if (entity.position) {
        stats.positioned += 1;
      }

      return stats;
    },
    {
      total: 0,
      positioned: 0,
    }
  );
}

function dedupe(entities: TerritoryEntity[]): TerritoryEntity[] {
  const byIdentity = new Map<string, TerritoryEntity>();

  for (const entity of entities) {
    const identity = `${entity.island}:${entity.kind}:${normalize(
      entity.title
    )}`;

    const existing = byIdentity.get(identity);

    if (!existing || (!existing.position && entity.position)) {
      byIdentity.set(identity, entity);
    }
  }

  return [...byIdentity.values()];
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
