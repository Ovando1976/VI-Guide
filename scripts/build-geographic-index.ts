import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { beaches } from "../src/data/beaches";
import { civicPlaces } from "../src/data/civicPlaces";
import { danishArchives } from "../src/data/danishArchives";
import { estateKnowledge } from "../src/data/estateKnowledge";
import { geographicDictionaryCleanEntries as geographicDictionaryEntries } from "../src/data/clean/geographicDictionaryClean";
import { historicSites } from "../src/data/historicSites";
import { findGeographicCanonicalOverride } from "../src/data/core/geographicCanonicalRules";
import { findGeographicOcrCleanupRule } from "../src/data/core/geographicOcrCleanupRules";
import { findGeographicReferenceRule } from "../src/data/core/geographicReferenceRules";
import { findGeographicFrenchCoastalRule } from "../src/data/core/geographicFrenchCoastalRules";
import { findGeographicAlphabeticalCleanupRule } from "../src/data/core/geographicAlphabeticalCleanupRules";
import { findGeographicCoordinateOverride } from "../src/data/core/geographicCoordinateOverrides";

type GeoPoint = { lat: number; lng: number };

type CoordinateStatus =
  | "verified"
  | "estimated"
  | "approximate"
  | "missing"
  | "bad"
  | "not-applicable";

type GeographicIndexSource =
  | "estate"
  | "historicSite"
  | "beach"
  | "civicPlace"
  | "dictionary"
  | "archive"
  | "restaurant"
  | "shopping"
  | "transportation"
  | "business";

type GeographicIndexItem = {
  id: string;
  source: GeographicIndexSource;
  name: string;
  canonicalName?: string;
  displayName?: string;
  baseName?: string;
  featureType?: string;
  island?: string;
  category?: string;
  type?: string;
  description?: string;
  coordinates?: GeoPoint | null;
  coordinateStatus?: CoordinateStatus;
  coordinateNotes?: string;
  confidence?: number;
  uncertaintyMeters?: number;
  historicalSource?: string;
  locationEvidence?: string;
  estateId?: string;
  estateName?: string;
  aliases?: string[];
  tags: string[];
  isReferenceOnly?: boolean;
  linkedCanonicalIds?: string[];
  preferredDisplayId?: string;
  referenceNotes?: string;
  searchText: string;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sources?: unknown[];
  canonicalNotes?: string;
};

function cleanText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value: unknown): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item)).filter(Boolean);
}

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map(cleanText)
        .filter(Boolean),
    ),
  );
}

function normalizeIsland(value: unknown): string | undefined {
  const text = cleanText(value).toLowerCase();
  if (!text) return undefined;

  if (["stt", "st_thomas", "st. thomas", "st thomas", "saint thomas"].includes(text)) {
    return "st_thomas";
  }

  if (["stj", "st_john", "st. john", "st john", "saint john"].includes(text)) {
    return "st_john";
  }

  if (["stx", "st_croix", "st. croix", "st croix", "saint croix"].includes(text)) {
    return "st_croix";
  }

  if (["wat", "water_island", "water island"].includes(text)) {
    return "water_island";
  }

  if (text === "unknown") return "unknown";

  return text;
}

function getCoordinates(record: any): GeoPoint | null {
  const c = record?.coordinates ?? record?.centroid ?? record?.location;
  if (!c || typeof c !== "object") return null;

  const lat = Number(c.lat ?? c.latitude);
  const lng = Number(c.lng ?? c.lon ?? c.long ?? c.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function makeSearchText(parts: unknown[]): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : [part]))
    .map(cleanText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function safeId(prefix: string, fallback: unknown, index: number): string {
  const slug = slugify(fallback);
  return slug ? `${prefix}:${slug}` : `${prefix}:record-${index + 1}`;
}

function sourceToFeatureType(
  source: GeographicIndexSource,
  type?: string,
  category?: string,
) {
  if (source === "estate") return "estate";
  if (source === "historicSite") return "historicSite";
  if (source === "beach") return "beach";
  if (source === "civicPlace") return "place";
  if (source === "dictionary") return cleanText(type || category || "dictionary");
  if (source === "archive") return "archive";
  if (source === "restaurant") return "place";
  if (source === "shopping") return "place";
  if (source === "transportation") return "transportation";
  if (source === "business") return cleanText(type || category || "business");
  return cleanText(type || category || "unknown");
}

function getCoordinateStatus(
  coordinates: GeoPoint | null | undefined,
  explicitStatus?: CoordinateStatus,
): CoordinateStatus {
  if (explicitStatus) return explicitStatus;
  return coordinates ? "estimated" : "missing";
}

function getCoordinateNotes(
  coordinates: GeoPoint | null | undefined,
  explicitNotes?: string,
): string {
  if (explicitNotes) return explicitNotes;

  return coordinates
    ? "Coordinate inherited from source record; needs verification."
    : "Coordinate missing; needs verification.";
}

function findOverrideForItem(item: GeographicIndexItem) {
  const featureType = sourceToFeatureType(item.source, item.type, item.category);

  return (
    findGeographicCanonicalOverride({
      name: item.name,
      island: item.island,
      type: featureType,
      source: item.source,
    }) ||
    findGeographicCanonicalOverride({
      name: item.name,
      island: item.island,
      type: item.type || item.category,
      source: item.source,
    }) ||
    findGeographicCanonicalOverride({
      name: item.name,
      island: item.island,
      type: featureType,
    }) ||
    findGeographicCanonicalOverride({
      name: item.name,
      island: item.island,
      type: item.type || item.category,
    }) ||
    findGeographicCanonicalOverride({
      name: item.name,
      island: item.island,
      source: item.source,
    }) ||
    findGeographicCanonicalOverride({
      name: item.name,
      island: item.island,
    }) ||
    findGeographicCanonicalOverride({
      name: item.name,
      type: featureType,
    })
  );
}

function finalizeItem(item: GeographicIndexItem): GeographicIndexItem {
  const override = findOverrideForItem(item) as any;

  const canonicalName = override?.canonicalName || item.canonicalName || item.name;
  const displayName = override?.displayName || item.displayName || canonicalName;
  const baseName = override?.baseName || item.baseName || item.name;

  const featureType =
    override?.featureType ||
    item.featureType ||
    sourceToFeatureType(item.source, item.type, item.category);

  const island = normalizeIsland(override?.island || item.island);

  const coordinateOverride = findGeographicCoordinateOverride({
    id: item.id,
    name: displayName,
    canonicalName,
    island,
    featureType,
  }) as any;

  const coordinates =
    coordinateOverride?.coordinates ||
    override?.coordinates ||
    item.coordinates ||
    null;

  const coordinateStatus = getCoordinateStatus(
    coordinates,
    coordinateOverride?.coordinateStatus ||
      override?.coordinateStatus ||
      item.coordinateStatus,
  );

  const coordinateNotes = getCoordinateNotes(
    coordinates,
    coordinateOverride?.coordinateNotes ||
      override?.coordinateNotes ||
      item.coordinateNotes,
  );

  const aliases = uniqueStrings([
    item.aliases,
    override?.aliases,
    coordinateOverride?.aliases,
    item.name,
    item.displayName,
    item.canonicalName,
    displayName,
    canonicalName,
    baseName,
  ]);

  return {
    ...item,
    name: displayName,
    canonicalName,
    displayName,
    baseName,
    featureType,
    island,
    aliases,
    coordinates,
    coordinateStatus,
    coordinateNotes,
    confidence:
      coordinateOverride?.confidence ??
      override?.confidence ??
      item.confidence,
    uncertaintyMeters:
      coordinateOverride?.uncertaintyMeters ??
      override?.uncertaintyMeters ??
      item.uncertaintyMeters,
    historicalSource:
      coordinateOverride?.historicalSource ??
      override?.historicalSource ??
      item.historicalSource,
    locationEvidence:
      coordinateOverride?.locationEvidence ??
      override?.locationEvidence ??
      item.locationEvidence,
    canonicalNotes:
      override?.notes ||
      coordinateOverride?.notes ||
      item.canonicalNotes,
    searchText: makeSearchText([
      item.searchText,
      item.id,
      item.name,
      displayName,
      canonicalName,
      baseName,
      featureType,
      island,
      aliases,
      item.category,
      item.type,
      item.description,
      item.estateId,
      item.estateName,
      item.tags,
    ]),
  };
}

function dedupeKey(item: GeographicIndexItem) {
  return [
    item.island || "unknown-island",
    item.featureType || item.type || item.category || item.source,
    item.source,
    slugify(item.canonicalName || item.name),
  ].join(":");
}

function coordinateRank(status?: CoordinateStatus) {
  if (status === "verified") return 6;
  if (status === "estimated") return 5;
  if (status === "approximate") return 4;
  if (status === "missing") return 3;
  if (status === "not-applicable") return 2;
  if (status === "bad") return 1;
  return 0;
}

function mergeItems(a: GeographicIndexItem, b: GeographicIndexItem): GeographicIndexItem {
  const betterCoordinateItem =
    coordinateRank(b.coordinateStatus) > coordinateRank(a.coordinateStatus) ? b : a;

  const coordinates = betterCoordinateItem.coordinates || a.coordinates || b.coordinates || null;

  return {
    ...a,
    description:
      cleanText(b.description).length > cleanText(a.description).length
        ? b.description
        : a.description,
    coordinates,
    coordinateStatus:
      betterCoordinateItem.coordinateStatus ||
      getCoordinateStatus(coordinates, a.coordinateStatus || b.coordinateStatus),
    coordinateNotes:
      betterCoordinateItem.coordinateNotes ||
      a.coordinateNotes ||
      b.coordinateNotes ||
      getCoordinateNotes(coordinates),
    confidence:
      betterCoordinateItem.confidence ??
      a.confidence ??
      b.confidence,
    uncertaintyMeters:
      betterCoordinateItem.uncertaintyMeters ??
      a.uncertaintyMeters ??
      b.uncertaintyMeters,
    historicalSource:
      betterCoordinateItem.historicalSource ||
      a.historicalSource ||
      b.historicalSource,
    locationEvidence:
      betterCoordinateItem.locationEvidence ||
      a.locationEvidence ||
      b.locationEvidence,
    estateId: a.estateId || b.estateId,
    estateName: a.estateName || b.estateName,
    imageUrl: a.imageUrl || b.imageUrl,
    coverImage: a.coverImage || b.coverImage,
    thumbnailUrl: a.thumbnailUrl || b.thumbnailUrl,
    sourceUrl: a.sourceUrl || b.sourceUrl,
    sources: [
      ...(Array.isArray(a.sources) ? a.sources : []),
      ...(Array.isArray(b.sources) ? b.sources : []),
    ],
    aliases: uniqueStrings([a.aliases, b.aliases, b.name, b.canonicalName, b.displayName]),
    tags: uniqueStrings([a.tags, b.tags]),
    isReferenceOnly: Boolean(a.isReferenceOnly || b.isReferenceOnly),
    linkedCanonicalIds: uniqueStrings([a.linkedCanonicalIds, b.linkedCanonicalIds]),
    preferredDisplayId: a.preferredDisplayId || b.preferredDisplayId,
    referenceNotes: a.referenceNotes || b.referenceNotes,
    searchText: makeSearchText([
      a.searchText,
      b.searchText,
      a.aliases,
      b.aliases,
      a.tags,
      b.tags,
      b.description,
    ]),
  };
}

function dedupeItems(items: GeographicIndexItem[]) {
  const map = new Map<string, GeographicIndexItem>();

  for (const item of items) {
    const key = dedupeKey(item);
    const existing = map.get(key);
    map.set(key, existing ? mergeItems(existing, item) : item);
  }

  return Array.from(map.values()).sort((a, b) => {
    const islandCompare = cleanText(a.island).localeCompare(cleanText(b.island));
    if (islandCompare !== 0) return islandCompare;

    const sourceCompare = a.source.localeCompare(b.source);
    if (sourceCompare !== 0) return sourceCompare;

    return a.name.localeCompare(b.name);
  });
}

const estateRecords = Array.isArray((estateKnowledge as any).records)
  ? (estateKnowledge as any).records
  : [];

const historicSiteRecords = Array.isArray(historicSites) ? historicSites : [];
const beachRecords = Array.isArray(beaches) ? beaches : [];
const civicPlaceRecords = Array.isArray(civicPlaces) ? civicPlaces : [];
const archiveRecords = Array.isArray(danishArchives) ? danishArchives : [];


const DICTIONARY_ISLAND_OVERRIDES: Record<string, string> = {
  "carol point": "water_island",
  "sand bay": "water_island",
};

const DICTIONARY_COORDINATE_OVERRIDES: Record<string, GeoPoint> = {
  "banana bay": { lat: 18.3246, lng: -64.9508 },
  "banana point": { lat: 18.3252, lng: -64.9516 },
  "bandy point": { lat: 18.3249, lng: -64.9531 },
  "druif bay": { lat: 18.3156, lng: -64.9566 },
  "limestone bay": { lat: 18.3139, lng: -64.9486 },
  "caroline point": { lat: 18.3237, lng: -64.9542 },
  "carol point": { lat: 18.3129, lng: -64.9512 },
  "sprat bay": { lat: 18.3125, lng: -64.9463 },
  "sprat point": { lat: 18.3131, lng: -64.9428 },
  "providence": { lat: 18.3164, lng: -64.9561 },
  "providence point": { lat: 18.3184, lng: -64.9581 },
  "sand bay": { lat: 18.3188, lng: -64.9457 },
  "elephant bay": { lat: 18.3219, lng: -64.9565 },
  "flamingo point": { lat: 18.3086, lng: -64.9518 },
  "flamingo rock": { lat: 18.3082, lng: -64.9524 },
};

function dictionaryOverrideKey(entry: any) {
  return cleanText(entry.sourceName || entry.name || entry.canonicalName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const dictionaryRecords = Array.isArray(geographicDictionaryEntries)
  ? geographicDictionaryEntries
  : [];

const estateItems: GeographicIndexItem[] = estateRecords.map((estate: any, index: number) => {
  const id =
    cleanText(estate.estateId || estate.id || estate.geoid) ||
    safeId("estate", estate.estateName || estate.name, index);

  const name = cleanText(
    estate.estateName ||
      estate.name ||
      estate.normalizedName ||
      estate.aliases?.[0] ||
      "Unnamed estate",
  );

  const coordinates = getCoordinates(estate);

  return finalizeItem({
    id,
    source: "estate",
    name,
    canonicalName: name,
    displayName: name,
    baseName: name,
    featureType: "estate",
    island: normalizeIsland(estate.island ?? estate.islandCode),
    category: cleanText(estate.category) || "estate",
    type: cleanText(estate.type) || "estate",
    description: cleanText(estate.description || estate.historicSummary || estate.history),
    coordinates,
    coordinateStatus: getCoordinateStatus(coordinates, estate.coordinateStatus),
    coordinateNotes: getCoordinateNotes(coordinates, estate.coordinateNotes),
    estateId: id,
    estateName: name,
    aliases: asArray(estate.aliases),
    imageUrl: cleanText(estate.imageUrl),
    coverImage: cleanText(estate.coverImage || estate.imageUrl),
    sources: estate.sources ?? [],
    tags: asArray(estate.tags),
    searchText: makeSearchText([
      id,
      name,
      estate.normalizedName,
      estate.aliases,
      estate.quarter,
      estate.quarterGroup,
      estate.description,
      estate.historicSummary,
      estate.history,
      estate.danishName,
      estate.relatedPlaces,
      estate.relatedHistoricSites,
      estate.relatedArchives,
      estate.relatedDictionaryEntries,
      estate.relatedBeaches,
      estate.tags,
    ]),
  });
});

const historicSiteItems: GeographicIndexItem[] = historicSiteRecords.map((site: any, index: number) => {
  const name = cleanText(site.name || site.title || "Unnamed historic site");
  const coordinates = getCoordinates(site);

  return finalizeItem({
    id: cleanText(site.id) || safeId("historic-site", name, index),
    source: "historicSite",
    name,
    canonicalName: name,
    displayName: name,
    baseName: name,
    featureType: cleanText(site.type) || "historicSite",
    island: normalizeIsland(site.island ?? site.islandCode),
    category: cleanText(site.category) || "historic",
    type: cleanText(site.type) || "historicSite",
    description: cleanText(
      site.description ||
        site.historicalSignificance ||
        site.history ||
        site.summary,
    ),
    coordinates,
    coordinateStatus: getCoordinateStatus(coordinates, site.coordinateStatus),
    coordinateNotes: getCoordinateNotes(coordinates, site.coordinateNotes),
    estateId: cleanText(site.estateId),
    estateName: cleanText(site.estateName || site.estate),
    aliases: asArray(site.aliases),
    imageUrl: cleanText(site.imageUrl),
    coverImage: cleanText(site.coverImage || site.imageUrl),
    sourceUrl: cleanText(site.sourceUrl || site.url),
    sources: site.sources ?? [],
    tags: asArray(site.tags),
    searchText: makeSearchText([
      site.id,
      name,
      site.type,
      site.category,
      site.status,
      site.designations,
      site.estate,
      site.estateName,
      site.period,
      site.dateListed,
      site.description,
      site.historicalSignificance,
      site.verifiedFacts,
      site.interpretation,
      site.researchNotes,
      site.relatedEstates,
      site.relatedDictionaryEntries,
      site.relatedArchives,
      site.tags,
    ]),
  });
});

const beachItems: GeographicIndexItem[] = beachRecords.map((beach: any, index: number) => {
  const name = cleanText(beach.name || beach.title || "Unnamed beach");
  const coordinates = getCoordinates(beach);

  return finalizeItem({
    id: cleanText(beach.id || beach.slug) || safeId("beach", name, index),
    source: "beach",
    name,
    canonicalName: name,
    displayName: name,
    baseName: name,
    featureType: "beach",
    island: normalizeIsland(beach.island ?? beach.islandCode),
    category: "beach",
    type: cleanText(beach.type) || "beach",
    description: cleanText(
      beach.description ||
        beach.visitorSummary ||
        beach.summary ||
        beach.historicalContext,
    ),
    coordinates,
    coordinateStatus: getCoordinateStatus(coordinates, beach.coordinateStatus),
    coordinateNotes: getCoordinateNotes(coordinates, beach.coordinateNotes),
    estateId: cleanText(beach.estateId),
    estateName: cleanText(beach.estateName || beach.estate || beach.area),
    aliases: asArray(beach.aliases),
    imageUrl: cleanText(beach.imageUrl || beach.image),
    coverImage: cleanText(beach.coverImage || beach.imageUrl || beach.image),
    sourceUrl: cleanText(beach.sourceUrl || beach.url),
    sources: beach.sources ?? [],
    tags: asArray(beach.tags),
    searchText: makeSearchText([
      beach.id,
      beach.slug,
      name,
      beach.title,
      beach.estate,
      beach.estateName,
      beach.area,
      beach.bay,
      beach.shoreline,
      beach.access,
      beach.status,
      beach.description,
      beach.visitorSummary,
      beach.historicalContext,
      beach.environmentalNotes,
      beach.amenities,
      beach.activities,
      beach.bestFor,
      beach.features,
      beach.cautions,
      beach.safetyNotes,
      beach.nearbyPlaces,
      beach.relatedEstates,
      beach.relatedDictionaryEntries,
      beach.relatedHistoricSites,
      beach.tags,
    ]),
  });
});

const civicPlaceItems: GeographicIndexItem[] = civicPlaceRecords.map((place: any, index: number) => {
  const name = cleanText(place.name || place.title || "Unnamed civic place");
  const coordinates = getCoordinates(place);

  return finalizeItem({
    id: cleanText(place.id) || safeId("civic-place", name, index),
    source: "civicPlace",
    name,
    canonicalName: name,
    displayName: name,
    baseName: name,
    featureType: "place",
    island: normalizeIsland(place.island ?? place.islandCode),
    category: cleanText(place.category) || "civic",
    type: cleanText(place.type) || "civicPlace",
    description: cleanText(place.description || place.summary),
    coordinates,
    coordinateStatus: getCoordinateStatus(coordinates, place.coordinateStatus),
    coordinateNotes: getCoordinateNotes(coordinates, place.coordinateNotes),
    estateId: cleanText(place.estateId),
    estateName: cleanText(place.estateName || place.estate),
    aliases: asArray(place.aliases),
    imageUrl: cleanText(place.imageUrl),
    coverImage: cleanText(place.coverImage || place.imageUrl),
    sourceUrl: cleanText(place.sourceUrl || place.url),
    sources: place.sources ?? [],
    tags: asArray(place.tags),
    searchText: makeSearchText([
      place.id,
      name,
      place.type,
      place.category,
      place.estate,
      place.estateName,
      place.description,
      place.summary,
      place.tags,
    ]),
  });
});

const dictionaryItems: GeographicIndexItem[] = dictionaryRecords.map((entry: any, index: number) => {
  const description = cleanText(entry.description || entry.definition || entry.text);
  const inferredName = description.split(/[.;:]/)[0];

  const originalName = cleanText(
    entry.name ||
      entry.title ||
      entry.term ||
      inferredName ||
      "Unnamed dictionary entry",
  );

  const ocrRule = findGeographicOcrCleanupRule(originalName);
  const frenchRule = findGeographicFrenchCoastalRule(originalName);
  const alphaRule = findGeographicAlphabeticalCleanupRule(originalName, {
    description,
    island: DICTIONARY_ISLAND_OVERRIDES[dictionaryOverrideKey(entry)] || normalizeIsland(entry.island ?? entry.islandCode),
  });

  const cleanupRule: any = alphaRule || frenchRule || ocrRule;

  const displayName = cleanupRule?.displayName || originalName;
  const canonicalName = cleanupRule?.canonicalName || originalName;
  const referenceRule = findGeographicReferenceRule(canonicalName);

  const coordinates =
    cleanupRule?.coordinates ||
    DICTIONARY_COORDINATE_OVERRIDES[dictionaryOverrideKey(entry)] ||
    getCoordinates(entry);

  return finalizeItem({
    id: cleanText(entry.id) || safeId("dictionary", canonicalName || description, index),
    source: "dictionary",
    name: displayName,
    canonicalName,
    displayName,
    baseName: canonicalName,
    featureType: cleanupRule?.featureType || cleanText(entry.type) || "dictionary",
    island:
      cleanupRule?.island ||
      DICTIONARY_ISLAND_OVERRIDES[dictionaryOverrideKey(entry)] ||
      normalizeIsland(entry.island ?? entry.islandCode),
    category: cleanText(entry.category) || "dictionary",
    type: cleanText(entry.type) || "dictionaryEntry",
    description,
    coordinates,
    coordinateStatus: getCoordinateStatus(
      coordinates,
      cleanupRule?.coordinateStatus || entry.coordinateStatus,
    ),
    coordinateNotes: getCoordinateNotes(
      coordinates,
      cleanupRule?.coordinateNotes || entry.coordinateNotes,
    ),
    confidence: cleanupRule?.confidence,
    uncertaintyMeters: cleanupRule?.uncertaintyMeters,
    historicalSource: cleanupRule?.historicalSource,
    locationEvidence: cleanupRule?.locationEvidence,
    estateId: cleanText(entry.estateId),
    estateName: cleanText(entry.estateName || entry.estate),
    aliases: uniqueStrings([entry.aliases, cleanupRule?.aliases, originalName]),
    imageUrl: cleanText(entry.imageUrl),
    coverImage: cleanText(entry.coverImage || entry.imageUrl),
    sourceUrl: cleanText(entry.sourceUrl || entry.url),
    sources: entry.sources ?? [],
    tags: asArray(entry.tags),
    isReferenceOnly: Boolean(referenceRule),
    linkedCanonicalIds: referenceRule?.linkedCanonicalIds,
    preferredDisplayId: referenceRule?.preferredDisplayId,
    referenceNotes: referenceRule?.notes,
    canonicalNotes: cleanupRule?.notes,
    searchText: makeSearchText([
      entry.id,
      originalName,
      displayName,
      canonicalName,
      cleanupRule?.aliases,
      entry.title,
      entry.term,
      entry.type,
      entry.category,
      entry.estate,
      entry.estateName,
      description,
      entry.relatedPlaces,
      entry.relatedEstates,
      entry.relatedHistoricSites,
      entry.tags,
    ]),
  });
});

const archiveItems: GeographicIndexItem[] = archiveRecords.map((archive: any, index: number) => {
  const title = cleanText(
    archive.title ||
      archive.subtitle ||
      archive.summary ||
      archive.description ||
      archive.archiveReference ||
      "Danish archive record",
  );

  const coordinates = getCoordinates(archive);

  return finalizeItem({
    id: cleanText(archive.id) || safeId("archive", title, index),
    source: "archive",
    name: title,
    canonicalName: title,
    displayName: title,
    baseName: title,
    featureType: "archive",
    island: normalizeIsland(archive.island ?? archive.islandCode),
    category: "archive",
    type: cleanText(archive.archiveCollection || archive.collection || "danishArchive"),
    description: cleanText(
      archive.summary ||
        archive.description ||
        archive.translatedText ||
        archive.originalText,
    ),
    coordinates,
    coordinateStatus: getCoordinateStatus(coordinates, archive.coordinateStatus),
    coordinateNotes: getCoordinateNotes(coordinates, archive.coordinateNotes),
    estateId: cleanText(archive.estateId),
    estateName: cleanText(archive.estateName || archive.estate),
    aliases: asArray(archive.aliases),
    imageUrl: cleanText(archive.imageUrl),
    coverImage: cleanText(archive.coverImage || archive.imageUrl),
    thumbnailUrl: cleanText(archive.thumbnailUrl),
    sourceUrl: cleanText(archive.sourceUrl || archive.url),
    sources: archive.sources ?? [],
    tags: asArray(archive.tags),
    searchText: makeSearchText([
      archive.id,
      title,
      archive.subtitle,
      archive.archiveCollection,
      archive.archiveReference,
      archive.collection,
      archive.estate,
      archive.estateName,
      archive.summary,
      archive.description,
      archive.originalText,
      archive.translatedText,
      archive.relatedEstates,
      archive.relatedPlaces,
      archive.relatedHistoricSites,
      archive.relatedDictionaryEntries,
      archive.tags,
    ]),
  });
});

const rawItems = [
  ...estateItems,
  ...historicSiteItems,
  ...beachItems,
  ...civicPlaceItems,
  ...dictionaryItems,
  ...archiveItems,
].filter((item) => item.id && (item.name || item.description));

const allItems = dedupeItems(rawItems);

const countBySource = (source: GeographicIndexSource) =>
  allItems.filter((item) => item.source === source).length;

const countByCoordinateStatus = (status: CoordinateStatus) =>
  allItems.filter((item) => item.coordinateStatus === status).length;

const geographicIndex = {
  generatedAt: new Date().toISOString(),
  counts: {
    total: allItems.length,
    estates: countBySource("estate"),
    historicSites: countBySource("historicSite"),
    beaches: countBySource("beach"),
    civicPlaces: countBySource("civicPlace"),
    dictionaryEntries: countBySource("dictionary"),
    archives: countBySource("archive"),
    rawTotalBeforeDedupe: rawItems.length,
    removedAsDuplicates: rawItems.length - allItems.length,
    coordinatesVerified: countByCoordinateStatus("verified"),
    coordinatesEstimated: countByCoordinateStatus("estimated"),
    coordinatesApproximate: countByCoordinateStatus("approximate"),
    coordinatesMissing: countByCoordinateStatus("missing"),
    coordinatesBad: countByCoordinateStatus("bad"),
    coordinatesNotApplicable: countByCoordinateStatus("not-applicable"),
  },
  items: allItems,
};

const outputPath = resolve("src/data/core/geographicIndex.ts");
mkdirSync(dirname(outputPath), { recursive: true });

const serializedIndex = JSON.stringify(geographicIndex);

writeFileSync(
  outputPath,
  `// Auto-generated by scripts/build-geographic-index.ts
// Do not edit manually.

export type CoordinateStatus =
  | "verified"
  | "estimated"
  | "approximate"
  | "missing"
  | "bad"
  | "not-applicable";

export type GeographicIndexSource =
  | "estate"
  | "historicSite"
  | "beach"
  | "civicPlace"
  | "dictionary"
  | "archive"
  | "restaurant"
  | "shopping"
  | "transportation"
  | "business";

export interface GeographicIndexItem {
  id: string;
  source: GeographicIndexSource;
  name: string;
  canonicalName?: string;
  displayName?: string;
  baseName?: string;
  featureType?: string;
  island?: string;
  category?: string;
  type?: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  coordinateStatus?: CoordinateStatus;
  coordinateNotes?: string;
  confidence?: number;
  uncertaintyMeters?: number;
  historicalSource?: string;
  locationEvidence?: string;
  estateId?: string;
  estateName?: string;
  aliases?: string[];
  tags: string[];
  searchText: string;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sources?: unknown[];
  canonicalNotes?: string;
  isReferenceOnly?: boolean;
  linkedCanonicalIds?: string[];
  preferredDisplayId?: string;
  referenceNotes?: string;
}

export interface GeographicIndex {
  generatedAt: string;
  counts: {
    total: number;
    estates: number;
    historicSites: number;
    beaches: number;
    civicPlaces: number;
    dictionaryEntries: number;
    archives: number;
    rawTotalBeforeDedupe: number;
    removedAsDuplicates: number;
    coordinatesVerified: number;
    coordinatesEstimated: number;
    coordinatesApproximate: number;
    coordinatesMissing: number;
    coordinatesBad: number;
    coordinatesNotApplicable: number;
  };
  items: GeographicIndexItem[];
}

export const geographicIndex: GeographicIndex = JSON.parse(${JSON.stringify(serializedIndex)});

export const geographicIndexItems: GeographicIndexItem[] = geographicIndex.items;

export function searchGeographicIndex(query: string, limit = 50): GeographicIndexItem[] {
  const q = query.trim().toLowerCase();

  if (!q) return geographicIndex.items.slice(0, limit);

  function text(value: unknown) {
    return String(value ?? "").toLowerCase();
  }

  function exact(value: unknown) {
    return text(value) === q;
  }

  function includes(value: unknown) {
    return text(value).includes(q);
  }

  function score(item: GeographicIndexItem) {
    let points = 0;

    if (exact(item.name)) points += 1000;
    if (exact(item.displayName)) points += 1000;
    if (exact(item.canonicalName)) points += 950;
    if (exact(item.baseName)) points += 900;

    if (item.aliases?.some((alias) => exact(alias))) points += 850;

    if (includes(item.name)) points += 500;
    if (includes(item.displayName)) points += 500;
    if (includes(item.canonicalName)) points += 450;
    if (includes(item.baseName)) points += 400;

    if (item.aliases?.some((alias) => includes(alias))) points += 350;

    if (includes(item.id)) points += 250;
    if (includes(item.estateName)) points += 200;
    if (includes(item.featureType)) points += 150;
    if (includes(item.type)) points += 125;
    if (includes(item.category)) points += 100;

    const strongMatchPoints = points;

    if (strongMatchPoints > 0 && includes(item.description)) points += 40;
    if (strongMatchPoints > 0 && includes(item.searchText)) points += 10;

    if (points <= 0) return 0;

    if (item.source === "estate") points += 30;
    if (item.source === "beach") points += 25;
    if (item.source === "historicSite") points += 20;
    if (item.source === "dictionary" && item.isReferenceOnly) points -= 25;

    return points;
  }

  return geographicIndex.items
    .map((item) => ({ item, score: score(item) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map((row) => row.item)
    .slice(0, limit);
}

export function getGeographicIndexItemById(id: string): GeographicIndexItem | undefined {
  return geographicIndex.items.find((item) => item.id === id);
}

export function getGeographicIndexItemsBySource(
  source: GeographicIndexSource,
  limit = 100,
): GeographicIndexItem[] {
  return geographicIndex.items
    .filter((item) => item.source === source)
    .slice(0, limit);
}

export function getGeographicIndexItemsByIsland(
  island: string,
  limit = 200,
): GeographicIndexItem[] {
  const normalizedIsland = island.trim().toLowerCase();

  return geographicIndex.items
    .filter((item) => item.island === normalizedIsland)
    .slice(0, limit);
}

export function getMappableGeographicIndexItems(limit = 1000): GeographicIndexItem[] {
  return geographicIndex.items
    .filter((item) => Boolean(item.coordinates))
    .slice(0, limit);
}

export function getImageGeographicIndexItems(limit = 500): GeographicIndexItem[] {
  return geographicIndex.items
    .filter((item) => Boolean(item.coverImage || item.imageUrl || item.thumbnailUrl))
    .slice(0, limit);
}

export function getGeographicIndexItemsByCoordinateStatus(
  status: CoordinateStatus,
  limit = 1000,
): GeographicIndexItem[] {
  return geographicIndex.items
    .filter((item) => item.coordinateStatus === status)
    .slice(0, limit);
}
`,
);

console.log("Geographic index built:");
console.log(geographicIndex.counts);
console.log(`Wrote ${outputPath}`);