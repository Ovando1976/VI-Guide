import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

type RouteMap = Partial<
  Record<"overview" | "history" | "archives" | "knowledge" | "map", string>
>;

type EvidenceMap = {
  estateLayer: boolean;
  geographicIndex: boolean;
  starterGazetteer: boolean;
  dictionary: boolean;
  archive: boolean;
  historicMap: boolean;
};

type RawAtlasRecord = {
  id: string;
  name: string;
  type: string;
  island: IslandCode;
  source: "estates" | "geographicIndex" | "starterGazetteer";
  aliases: string[];
  description: string;
  coordinates: { lat: number; lng: number } | null;
  routes: RouteMap;
  evidence: EvidenceMap;
};

type CanonicalAtlasRecord = Omit<RawAtlasRecord, "source"> & {
  sources: string[];
  sourceIds: Record<string, string[]>;
};

const BAD_IDS = new Set(["", "-1", "st", "i", "bt", "thomas", "croix"]);

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function stripEstate(value: unknown): string {
  return clean(value).replace(/^estate\s+/i, "").trim();
}

function slug(value: unknown): string {
  return stripEstate(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeId(value: unknown, fallback: string): string {
  const id = slug(value);
  return BAD_IDS.has(id) ? fallback : id;
}

function islandOf(value: unknown): IslandCode {
  const v = String(value ?? "").toLowerCase();

  if (v === "stt" || v === "st_thomas" || v === "st-thomas") return "st_thomas";
  if (v === "stj" || v === "st_john" || v === "st-john") return "st_john";
  if (v === "stx" || v === "st_croix" || v === "st-croix") return "st_croix";
  if (v === "wat" || v === "water_island" || v === "water-island") {
    return "water_island";
  }

  return "st_thomas";
}

function coordFrom(value: any): { lat: number; lng: number } | null {
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.lon ?? value?.longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

function normalizeType(rawType: unknown, source: string): string {
  const type = clean(rawType);

  if (source === "geographicIndex" && type === "estate") {
    return "estate_reference";
  }

  if (type === "Danish West Indies Archives") return "archive_record";

  return type || "place";
}

function mergeKey(record: RawAtlasRecord): string {
  if (record.source === "estates") {
    return `${record.island}:estate:${slug(record.name)}`;
  }

  if (record.type === "estate_reference") {
    return `${record.island}:estate:${slug(record.name)}`;
  }

  return `${record.island}:${record.type}:${slug(record.name)}`;
}

function canonicalIdFromKey(key: string): string {
  return key.replace(/:/g, "-");
}

function addUnique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))];
}

function mergeEvidence(a: EvidenceMap, b: EvidenceMap): EvidenceMap {
  return {
    estateLayer: a.estateLayer || b.estateLayer,
    geographicIndex: a.geographicIndex || b.geographicIndex,
    starterGazetteer: a.starterGazetteer || b.starterGazetteer,
    dictionary: a.dictionary || b.dictionary,
    archive: a.archive || b.archive,
    historicMap: a.historicMap || b.historicMap,
  };
}

function preferType(existing: string, incoming: string): string {
  if (existing === "estate") return existing;
  if (incoming === "estate") return incoming;
  if (existing === "estate_reference") return incoming;
  return existing;
}

function preferDescription(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return b.length > a.length ? b : a;
}

function mergeRouteMaps(existing: RouteMap, incoming: RouteMap): RouteMap {
  return {
    ...incoming,
    ...existing,
  };
}

function evidenceForSource(
  source: RawAtlasRecord["source"],
  type: string,
): EvidenceMap {
  return {
    estateLayer: source === "estates",
    geographicIndex: source === "geographicIndex",
    starterGazetteer: source === "starterGazetteer",
    dictionary: type === "dictionaryEntry",
    archive: type === "archive_record",
    historicMap: source === "starterGazetteer",
  };
}

function mergeRecords(records: RawAtlasRecord[]): CanonicalAtlasRecord[] {
  const byKey = new Map<string, CanonicalAtlasRecord>();

  for (const record of records) {
    const key = mergeKey(record);
    const existing = byKey.get(key);
    const canonicalId = canonicalIdFromKey(key);

    if (!existing) {
      byKey.set(key, {
        id: canonicalId,
        name: record.name,
        type: record.type === "estate_reference" ? "estate" : record.type,
        island: record.island,
        aliases: addUnique(record.aliases),
        description: record.description,
        coordinates: record.coordinates,
        routes: { ...record.routes },
        evidence: record.evidence,
        sources: [record.source],
        sourceIds: { [record.source]: [record.id] },
      });
      continue;
    }

    existing.type = preferType(existing.type, record.type);
    if (existing.type === "estate_reference") existing.type = "estate";

    existing.aliases = addUnique([
      ...existing.aliases,
      ...record.aliases,
      record.name,
    ]);

    existing.description = preferDescription(existing.description, record.description);
    existing.coordinates = existing.coordinates ?? record.coordinates;
    existing.routes = mergeRouteMaps(existing.routes, record.routes);
    existing.evidence = mergeEvidence(existing.evidence, record.evidence);
    existing.sources = addUnique([...existing.sources, record.source]);

    existing.sourceIds[record.source] = addUnique([
      ...(existing.sourceIds[record.source] ?? []),
      record.id,
    ]);
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const raw: RawAtlasRecord[] = [];

  const estatesMod = await import("../src/data/estates");
  const estates = estatesMod.estates ?? [];

  for (const estate of estates as any[]) {
    const name = stripEstate(estate.name || estate.estateName || estate.title);
    if (!name) continue;

    const island = islandOf(estate.island || estate.islandCode);
    const fallbackId = `${island}-estate-${slug(name)}`;
    const id = safeId(estate.geoid || estate.estateId || estate.id, fallbackId);
    const encodedId = encodeURIComponent(id);
    const encodedName = encodeURIComponent(name);

    raw.push({
      id,
      name,
      type: "estate",
      island,
      source: "estates",
      aliases: Array.isArray(estate.aliases) ? estate.aliases.map(clean) : [],
      description:
        clean(estate.description || estate.summary) ||
        `Official estate record for Estate ${name}.`,
      coordinates: coordFrom(estate.centroid || estate.coordinates),
      routes: {
        overview: `/estates/${encodedId}?island=${island}`,
        history: `/estates/${encodedId}/history?island=${island}&context=${encodedName}`,
        archives: `/estates/${encodedId}/archives?island=${island}&context=${encodedName}`,
        knowledge: `/history/knowledge?estate=${encodedId}&island=${island}&context=${encodedName}`,
        map: `/map?estate=${encodedId}&island=${island}`,
      },
      evidence: evidenceForSource("estates", "estate"),
    });
  }

  try {
    const indexMod = await import("../src/data/core/geographicIndex");
    const items = indexMod.geographicIndexItems ?? [];

    for (const item of items as any[]) {
      const name = stripEstate(item.name || item.estateName || item.title);
      if (!name) continue;

      const island = islandOf(item.island || item.islandCode);
      const type = normalizeType(item.type || item.kind || item.source, "geographicIndex");
      const fallbackId = `${island}-${slug(type)}-${slug(name)}`;
      const id = safeId(item.id || item.geoid, fallbackId);
      const encodedId = encodeURIComponent(id);
      const encodedName = encodeURIComponent(name);

      raw.push({
        id,
        name,
        type,
        island,
        source: "geographicIndex",
        aliases: [],
        description:
          clean(item.description || item.searchText) ||
          `Geographic index evidence for ${name}.`,
        coordinates: coordFrom(item.centroid || item.coordinates),
        routes: {
          knowledge: `/history/knowledge?estate=${encodedId}&island=${island}&context=${encodedName}`,
          map: `/map?q=${encodedName}&island=${island}`,
        },
        evidence: evidenceForSource("geographicIndex", type),
      });
    }
  } catch (error) {
    console.warn("Skipped geographic index:", error);
  }

  try {
    const gazetteerMod = await import("../src/data/atlas/gazetteer");
    const gazetteer = gazetteerMod.gazetteer ?? [];

    for (const item of gazetteer as unknown as unknown as any[]) {
      const name = stripEstate(item.canonicalName || item.name);
      if (!name) continue;

      const island = islandOf(item.island);
      const type = normalizeType(item.featureType || item.type, "starterGazetteer");
      const fallbackId = `${island}-${slug(type)}-${slug(name)}`;
      const id = safeId(item.id, fallbackId);
      const encodedName = encodeURIComponent(name);

      raw.push({
        id,
        name,
        type,
        island,
        source: "starterGazetteer",
        aliases: Array.isArray(item.aliases) ? item.aliases.map(clean) : [],
        description: clean(item.notes || item.description),
        coordinates: item.coordinates ?? null,
        routes: {
          map: `/map?q=${encodedName}&island=${island}`,
          knowledge: `/history/knowledge?estate=${encodeURIComponent(
            id,
          )}&island=${island}&context=${encodedName}`,
        },
        evidence: evidenceForSource("starterGazetteer", type),
      });
    }
  } catch (error) {
    console.warn("Skipped starter gazetteer:", error);
  }

  const atlasRecords = mergeRecords(raw);

  const metadata = {
    generatedAt: new Date().toISOString(),
    rawRecords: raw.length,
    totalRecords: atlasRecords.length,
    mergedDuplicates: raw.length - atlasRecords.length,
    officialEstateSourceRecords: estates.length,
    canonicalOfficialEstateRecords: atlasRecords.filter((record) =>
      record.sources.includes("estates"),
    ).length,
    bySource: raw.reduce<Record<string, number>>((acc, record) => {
      acc[record.source] = (acc[record.source] || 0) + 1;
      return acc;
    }, {}),
    byType: atlasRecords.reduce<Record<string, number>>((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {}),
    byEvidence: atlasRecords.reduce<Record<string, number>>((acc, record) => {
      for (const [key, value] of Object.entries(record.evidence)) {
        if (value) acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {}),
  };

  mkdirSync("data/master", { recursive: true });
  writeFileSync(
    "data/master/master-atlas.json",
    JSON.stringify({ metadata, records: atlasRecords }, null, 2),
  );

  mkdirSync(dirname("src/data/atlas/masterAtlas.ts"), { recursive: true });
  writeFileSync(
    "src/data/atlas/masterAtlas.ts",
    `// Auto-generated by scripts/build-master-atlas.ts
export const atlasMetadata = ${JSON.stringify(metadata, null, 2)} as const;

export const atlasRecords = ${JSON.stringify(atlasRecords, null, 2)} as const;
`,
  );

  console.log("Canonical Master Atlas built.");
  console.log(metadata);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});