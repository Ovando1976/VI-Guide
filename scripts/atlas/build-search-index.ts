// scripts/atlas/build-search-index.ts
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { gazetteer } from "../../src/data/atlas/gazetteer";
import { atlasRelationships } from "../../src/data/atlas/atlasRelationships";

// Local type definition to ensure the script works without dependency on the old file
export type GeographicIndexItem = {
  id: string;
  name: string;
  displayName?: string;
  canonicalName?: string;
  baseName?: string;
  estateName?: string;
  estateId?: string;
  type?: string;
  category?: string;
  featureType?: string;
  island?: string;
  source?: string;
  description?: string;
  aliases?: string[];
  coordinates?: { lat: number; lng: number };
  lat?: number;
  lng?: number;
  searchText?: string;
};

// Load the cleaned data directly
const geographicIndexItems: GeographicIndexItem[] = JSON.parse(
  readFileSync("./data/core/geographicIndex_final.json", "utf-8")
);

type AtlasEvidence = {
  source: string;
  sourceId: string;
  label: string;
  confidence: number;
};

type AtlasSearchRecord = {
  id: string;
  sources: string[];
  primarySource: string;
  sourceIds: string[];
  name: string;
  displayName: string;
  type: string;
  island?: string;
  lat?: number;
  lng?: number;
  aliases: string[];
  relatedNames: string[];
  relationshipCount: number;
  evidence: AtlasEvidence[];
  searchText: string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function coords(item: GeographicIndexItem) {
  const lat = item.coordinates?.lat ?? item.lat;
  const lng = item.coordinates?.lng ?? item.lng;
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : {};
}

const gazetteerRecords: AtlasSearchRecord[] = gazetteer.map((item) => {
  const relatedNames = atlasRelationships
    .filter((rel) => rel.fromId === item.id && rel.type !== "appears_on")
    .map((rel) => rel.toName);

  const aliases = unique([...item.aliases]);

  return {
    id: `gazetteer:${item.id}`,
    sources: ["gazetteer"],
    primarySource: "gazetteer",
    sourceIds: [item.id],
    name: item.canonicalName,
    displayName: item.displayName,
    type: item.featureType,
    island: item.island,
    lat: item.coordinates?.lat,
    lng: item.coordinates?.lng,
    aliases,
    relatedNames: unique([...item.relatedNames, ...relatedNames]),
    relationshipCount: atlasRelationships.filter((rel) => rel.fromId === item.id).length,
    evidence: [
      {
        source: "gazetteer",
        sourceId: item.id,
        label: item.notes || item.displayName,
        confidence: 0.75,
      },
    ],
    searchText: normalize([
      item.id,
      item.canonicalName,
      item.displayName,
      item.featureType,
      item.island,
      item.searchText,
      item.notes,
      ...aliases,
      ...item.relatedNames,
      ...relatedNames,
    ].join(" ")),
  };
});

const geographicRecords: AtlasSearchRecord[] = geographicIndexItems.map((item) => {
  const source = item.source || "geographicIndex";
  const aliases = unique(item.aliases || []);
  const name = clean(item.displayName || item.name || item.id);

  return {
    id: `geographic:${item.id}`,
    sources: [source],
    primarySource: source,
    sourceIds: [item.id],
    name,
    displayName: clean(item.displayName || item.canonicalName || item.name || item.id),
    type: clean(item.type || item.category || item.featureType || item.source || "place"),
    island: item.island,
    ...coords(item),
    aliases,
    relatedNames: [],
    relationshipCount: 0,
    evidence: [
      {
        source,
        sourceId: item.id,
        label: item.description || item.name || item.id,
        confidence: 0.8,
      },
    ],
    searchText: normalize([
      item.id,
      item.name,
      item.displayName,
      item.canonicalName,
      item.baseName,
      item.estateName,
      item.estateId,
      item.type,
      item.category,
      item.featureType,
      item.source,
      item.island,
      item.searchText,
      item.description,
      ...aliases,
    ].join(" ")),
  };
});

const recordsByKey = new Map<string, AtlasSearchRecord>();

for (const record of [...geographicRecords, ...gazetteerRecords]) {
  const key = `${record.island || "all"}:${normalize(record.displayName)}:${normalize(record.type)}`;
  const existing = recordsByKey.get(key);

  if (!existing) {
    recordsByKey.set(key, record);
    continue;
  }

  recordsByKey.set(key, {
    ...existing,
    sources: unique([...existing.sources, ...record.sources]),
    sourceIds: unique([...existing.sourceIds, ...record.sourceIds]),
    aliases: unique([...existing.aliases, ...record.aliases]),
    relatedNames: unique([...existing.relatedNames, ...record.relatedNames]),
    relationshipCount: existing.relationshipCount + record.relationshipCount,
    evidence: [...existing.evidence, ...record.evidence],
    searchText: normalize(`${existing.searchText} ${record.searchText}`),
  });
}

const atlasSearchIndex = [...recordsByKey.values()].sort((a, b) =>
  a.displayName.localeCompare(b.displayName),
);

const metadata = {
  generatedAt: new Date().toISOString(),
  totalRecords: atlasSearchIndex.length,
  gazetteerRecords: gazetteerRecords.length,
  geographicRecords: geographicRecords.length,
  recordsWithGazetteerEvidence: atlasSearchIndex.filter((item) =>
    item.sources.includes("gazetteer"),
  ).length,
  bySource: atlasSearchIndex.reduce<Record<string, number>>((acc, item) => {
    for (const source of item.sources) acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {}),
};

mkdirSync("data/atlas/generated", { recursive: true });
writeFileSync("data/atlas/generated/atlas-search-index.json", `${JSON.stringify(atlasSearchIndex, null, 2)}\n`);
writeFileSync("data/atlas/generated/atlas-search-index-metadata.json", `${JSON.stringify(metadata, null, 2)}\n`);

mkdirSync(dirname("src/data/atlas/atlasSearchIndex.ts"), { recursive: true });
writeFileSync(
  "src/data/atlas/atlasSearchIndex.ts",
  `// Auto-generated by scripts/atlas/build-search-index.ts

export type AtlasEvidence = {
  source: string;
  sourceId: string;
  label: string;
  confidence: number;
};

export type AtlasSearchRecord = {
  id: string;
  sources: readonly string[];
  primarySource: string;
  sourceIds: readonly string[];
  name: string;
  displayName: string;
  type: string;
  island?: string;
  lat?: number;
  lng?: number;
  aliases: readonly string[];
  relatedNames: readonly string[];
  relationshipCount: number;
  evidence: readonly AtlasEvidence[];
  searchText: string;
};

export const atlasSearchIndex = ${JSON.stringify(atlasSearchIndex, null, 2)} as const satisfies readonly AtlasSearchRecord[];

export const atlasSearchIndexMetadata = ${JSON.stringify(metadata, null, 2)} as const;
`,
);

console.log("Atlas search index built.");
console.log(metadata);
