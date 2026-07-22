import {
  getBeachTravelKnowledgeRecords,
  getPlaceTravelKnowledgeRecords,
} from "@/lib/directory-data";
import { ACCOMMODATIONS } from "@/lib/accommodations";
import { getHistoricTravelKnowledgeRecords } from "@/lib/historic-sites";
import generatedRestaurants from "@/data/catalog/restaurants.generated.json";
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

type PublishedIsland = "stt" | "stj" | "stx";

type GeneratedRestaurant = {
  id: string;
  slug: string;
  name: string;
  island: PublishedIsland | "wi";
  category: "restaurant";
  diningType?: string;
  cuisines?: string[];
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  googlePlaceId: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  operatingStatus?: string;
  source?: string;
  discoveredAt?: string;
  lastVerifiedAt?: string;
  verificationStatus?: string;
  rawTypes?: string[];
  photoReferences?: string[];
};

type PublishedRestaurant = GeneratedRestaurant & { island: PublishedIsland };

type LiveCatalogCache = {
  version: number;
  islands: Partial<Record<PublishedIsland, TerritoryEntity[]>>;
};

const LIVE_CATALOG_KEY = "vi-guide.live-territory-catalog.v1";

const places = getPlaceTravelKnowledgeRecords();
const beaches = getBeachTravelKnowledgeRecords();
const historicSites = getHistoricTravelKnowledgeRecords();
const restaurants = generatedRestaurants as GeneratedRestaurant[];

const staticEntities: TerritoryEntity[] = dedupe([
  ...ACCOMMODATIONS.map(accommodationToTerritoryEntity),

  ...places.map((record) => travelKnowledgeToTerritoryEntity(record)),

  ...restaurants
    .filter(isPublishedRestaurant)
    .map((record) =>
      travelKnowledgeToTerritoryEntity({
        ...record,
        category: "food",
        description: `${record.name} is a verified dining option in the U.S. Virgin Islands.`,
        tags: [
          "food",
          "restaurant",
          record.diningType,
          ...(record.cuisines ?? []),
          record.operatingStatus,
        ].filter((value): value is string => Boolean(value)),
        location: record.address,
      }),
    ),

  ...beaches.map((record) =>
    travelKnowledgeToTerritoryEntity(record, "beach"),
  ),

  ...historicSites.map((record) =>
    travelKnowledgeToTerritoryEntity(record, "historic"),
  ),
]);

export type TerritoryCatalogStats = Record<string, number> & {
  total: number;
  positioned: number;
};

export function queryTerritoryMapPlaces(
  query: TerritoryQuery = {},
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
        Number.isFinite(place.lng),
    );
}

export function queryTerritoryEntities(
  query: TerritoryQuery = {},
): TerritoryEntity[] {
  const text = query.text?.trim().toLowerCase();
  const categories = new Set(
    query.categories?.map((value) => value.toLowerCase()),
  );
  const kinds = new Set(query.kinds);

  return currentEntities().filter((entity) => {
    if (query.island && entity.island !== query.island) return false;
    if (kinds.size > 0 && !kinds.has(entity.kind)) return false;
    if (query.positionedOnly && !entity.position) return false;

    if (
      categories.size > 0 &&
      !entity.categories.some((category) =>
        categories.has(category.toLowerCase()),
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

      if (!haystack.includes(text)) return false;
    }

    return true;
  });
}

export function getTerritoryEntity(id: string): TerritoryEntity | null {
  return currentEntities().find((entity) => entity.id === id) ?? null;
}

export function getTerritoryCatalogStats(): TerritoryCatalogStats {
  return currentEntities().reduce<TerritoryCatalogStats>(
    (stats, entity) => {
      stats.total += 1;
      stats[entity.kind] = (stats[entity.kind] ?? 0) + 1;
      stats[entity.island] = (stats[entity.island] ?? 0) + 1;
      if (entity.position) stats.positioned += 1;
      return stats;
    },
    { total: 0, positioned: 0 },
  );
}

function currentEntities() {
  const live = readLiveEntities();
  if (!live.length) return staticEntities;
  return dedupe([...staticEntities, ...live]);
}

function readLiveEntities(): TerritoryEntity[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LIVE_CATALOG_KEY) ?? "null",
    ) as LiveCatalogCache | null;

    if (!parsed || parsed.version !== 1 || !parsed.islands) return [];
    return Object.values(parsed.islands).flatMap((entities) =>
      Array.isArray(entities) ? entities.filter(isTerritoryEntity) : [],
    );
  } catch {
    return [];
  }
}

function isTerritoryEntity(value: unknown): value is TerritoryEntity {
  if (!value || typeof value !== "object") return false;
  const entity = value as Partial<TerritoryEntity>;
  return Boolean(
    entity.id &&
      entity.title &&
      entity.island &&
      entity.kind &&
      Array.isArray(entity.categories) &&
      Array.isArray(entity.tags),
  );
}

function isPublishedRestaurant(
  record: GeneratedRestaurant,
): record is PublishedRestaurant {
  return record.island === "stt" || record.island === "stj" || record.island === "stx";
}

function dedupe(entities: TerritoryEntity[]): TerritoryEntity[] {
  const byIdentity = new Map<string, TerritoryEntity>();

  for (const entity of entities) {
    const identity = `${entity.island}:${entity.kind}:${normalize(entity.title)}`;
    const existing = byIdentity.get(identity);

    if (!existing || shouldReplace(existing, entity)) {
      byIdentity.set(identity, entity);
    }
  }

  return [...byIdentity.values()];
}

function shouldReplace(existing: TerritoryEntity, candidate: TerritoryEntity) {
  if (!existing.position && candidate.position) return true;
  if (existing.position && !candidate.position) return false;

  const existingLive = existing.source.provider.includes("live");
  const candidateLive = candidate.source.provider.includes("live");
  if (!existingLive && candidateLive) return true;

  const existingImage = Boolean(existing.media?.hero);
  const candidateImage = Boolean(candidate.media?.hero);
  if (!existingImage && candidateImage) return true;

  return false;
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
