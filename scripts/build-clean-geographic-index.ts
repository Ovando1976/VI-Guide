// @ts-nocheck

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const OUT_DATA = path.join(ROOT, "src/data/core/cleanGeographicIndex.data.ts");
const OUT_INDEX = path.join(ROOT, "src/data/core/cleanGeographicIndex.ts");
const OUT_JSON = path.join(ROOT, "reports/clean-geographic-index.json");
const OUT_REVIEW = path.join(ROOT, "reports/clean-geographic-index-review.json");
const OUT_REPORT = path.join(ROOT, "reports/clean-geographic-index-report.md");

const SOURCE_MODULES = [
  {
    label: "atlasSearchIndex",
    path: "../src/data/atlas/atlasSearchIndex",
    priority: 80,
  },
  {
    label: "geographicIndex",
    path: "../src/data/core/geographicIndex",
    priority: 100,
  },
  {
    label: "geographicDictionaryAdditions",
    path: "../src/data/core/geographicDictionaryAdditions",
    priority: 90,
  },
  {
    label: "geographicDictionaryEntries",
    path: "../src/data/generated/geographicDictionaryEntries",
    priority: 50,
  },
  {
    label: "estateKnowledge",
    path: "../src/data/estateKnowledge",
    priority: 85,
  },
  {
    label: "standaloneDictionaryPlaces",
    path: "../src/data/standaloneDictionaryPlaces",
    priority: 55,
  },
  {
    label: "quarterFeatureLinks",
    path: "../src/data/quarterFeatureLinks",
    priority: 40,
  },
  {
    label: "estateFeatureLinks",
    path: "../src/data/estateFeatureLinks",
    priority: 40,
  },
  {
    label: "estateHistories",
    path: "../src/data/estateHistories",
    priority: 70,
  },
  {
    label: "usviHistoryExtract",
    path: "../src/data/history/generated/usviHistoryExtract",
    priority: 35,
  },
];

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island" | "";

type CleanRecord = {
  id: string;
  name: string;
  displayName: string;
  normalizedName: string;
  slug: string;
  island: IslandCode;
  type: string;
  category: string;
  description: string;
  shortDescription?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  aliases: string[];
  historicalNames: string[];
  tags: string[];
  sources: string[];
  sourceRecords: Array<{
    source: string;
    id?: string;
    name?: string;
    type?: string;
    priority: number;
  }>;
  relationships: Array<{
    type: string;
    targetId?: string;
    targetName?: string;
    source: string;
  }>;
  confidence: "high" | "medium" | "low";
  needsReview: boolean;
  reviewNotes: string[];
  raw?: Record<string, unknown>;
};

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[Ææ]/g, "ae")
    .replace(/[Øø]/g, "o")
    .replace(/[Åå]/g, "a")
    .toLowerCase()
    .replace(/\bst[.\s]+/g, "st ")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantage\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value: unknown) {
  return normalizeText(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function cleanString(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === "string") return value.split(/[,;|]/);
          return [];
        })
        .map((value) => cleanString(value))
        .filter(Boolean),
    ),
  );
}

function inferIsland(record: any): IslandCode {
  const raw =
    record.island ||
    record.islandCode ||
    record.selectedIsland ||
    record.properties?.island ||
    record.properties?.islandCode ||
    record.dictionaryMeta?.island ||
    "";

  const value = String(raw).toLowerCase();

  if (["st_thomas", "stt", "saint_thomas", "st-thomas", "st thomas"].includes(value)) {
    return "st_thomas";
  }

  if (["st_john", "stj", "saint_john", "st-john", "st john", "st jan"].includes(value)) {
    return "st_john";
  }

  if (["st_croix", "stx", "saint_croix", "st-croix", "st croix"].includes(value)) {
    return "st_croix";
  }

  if (["water_island", "wat", "water-island", "water island"].includes(value)) {
    return "water_island";
  }

  const haystack = [
    record.name,
    record.title,
    record.label,
    record.displayName,
    record.description,
    record.summary,
    record.text,
  ]
    .map((item) => String(item || "").toLowerCase())
    .join(" ");

  if (/\bst[.\s-]*croix\b|\bcroix\b/.test(haystack)) return "st_croix";
  if (/\bst[.\s-]*john\b|\bst[.\s-]*jan\b/.test(haystack)) return "st_john";
  if (/\bst[.\s-]*thomas\b/.test(haystack)) return "st_thomas";
  if (/\bwater island\b/.test(haystack)) return "water_island";

  return "";
}

function getName(record: any) {
  return cleanString(
    record.name ||
      record.displayName ||
      record.title ||
      record.label ||
      record.canonicalName ||
      record.estateName ||
      record.placeName ||
      record.properties?.name ||
      record.properties?.Name ||
      "",
  );
}

function getType(record: any, source: string) {
  const raw = cleanString(
    record.type ||
      record.kind ||
      record.category ||
      record.featureType ||
      record.properties?.type ||
      record.properties?.kind ||
      "",
  ).toLowerCase();

  if (raw) {
    if (raw.includes("estate")) return "estate";
    if (raw.includes("quarter")) return "quarter";
    if (raw.includes("bay")) return "bay";
    if (raw.includes("cay") || raw.includes("key")) return "cay";
    if (raw.includes("hill") || raw.includes("mount")) return "hill";
    if (raw.includes("island")) return "island";
    if (raw.includes("historic")) return "historicSite";
    if (raw.includes("archive")) return "archiveRecord";
    if (raw.includes("dictionary")) return "dictionaryEntry";
    if (raw.includes("beach")) return "beach";
    return raw;
  }

  if (/estate/i.test(source)) return "estate";
  if (/quarter/i.test(source)) return "quarter";
  if (/history/i.test(source)) return "historyRecord";
  if (/dictionary/i.test(source)) return "dictionaryEntry";

  return "place";
}

function getDescription(record: any) {
  return cleanString(
    record.description ||
      record.summary ||
      record.shortDescription ||
      record.body ||
      record.text ||
      record.content ||
      record.history ||
      record.properties?.description ||
      "",
  );
}

function getCoordinates(record: any) {
  const candidates = [
    record.coordinates,
    record.coord,
    record.center,
    record.centroid,
    record.location,
    record.properties?.coordinates,
    record.properties?.center,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (Array.isArray(candidate) && candidate.length >= 2) {
      const lng = Number(candidate[0]);
      const lat = Number(candidate[1]);

      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= 17 && lat <= 19 && lng >= -66 && lng <= -63) {
        return {
          lat: Number(lat.toFixed(7)),
          lng: Number(lng.toFixed(7)),
        };
      }
    }

    if (typeof candidate === "object") {
      const lat = Number(candidate.lat ?? candidate.latitude);
      const lng = Number(candidate.lng ?? candidate.lon ?? candidate.longitude);

      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= 17 && lat <= 19 && lng >= -66 && lng <= -63) {
        return {
          lat: Number(lat.toFixed(7)),
          lng: Number(lng.toFixed(7)),
        };
      }
    }
  }

  const lat = Number(record.lat ?? record.latitude ?? record.properties?.lat);
  const lng = Number(record.lng ?? record.lon ?? record.longitude ?? record.properties?.lng);

  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= 17 && lat <= 19 && lng >= -66 && lng <= -63) {
    return {
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7)),
    };
  }

  return undefined;
}

function getAliases(record: any) {
  return uniqueStrings([
    record.aliases,
    record.alternateNames,
    record.alternativeNames,
    record.historicalNames,
    record.variantNames,
    record.otherNames,
    record.properties?.aliases,
    record.properties?.alternateNames,
    record.properties?.historicalNames,
  ]);
}

function getTags(record: any, source: string, type: string) {
  return uniqueStrings([
    record.tags,
    record.sources,
    record.categories,
    record.properties?.tags,
    source,
    type,
  ]);
}

function isRelationshipOnly(record: any) {
  const name = getName(record);
  if (name) return false;

  return Boolean(
    record.estateId ||
      record.quarterId ||
      record.featureId ||
      record.sourceId ||
      record.targetId ||
      record.links,
  );
}

function scoreRecord(record: Partial<CleanRecord>, priority: number) {
  let score = priority;

  if (record.coordinates) score += 50;
  if (record.description && record.description.length > 80) score += 30;
  if (record.island) score += 20;
  if (record.confidence === "high") score += 20;
  if (record.confidence === "medium") score += 10;
  if (record.type && record.type !== "dictionaryEntry") score += 5;

  return score;
}

function makeKey(record: CleanRecord) {
  const featureFamily =
    record.type === "dictionaryEntry"
      ? "dictionaryEntry"
      : record.type === "historyRecord"
        ? "historyRecord"
        : record.type === "archiveRecord"
          ? "archiveRecord"
          : record.type;

  return `${record.island || "unknown"}|${featureFamily}|${record.normalizedName}`;
}

function makeCleanRecord(record: any, source: string, priority: number): CleanRecord | null {
  const name = getName(record);

  if (!name || name.length < 2) return null;

  const island = inferIsland(record);
  const type = getType(record, source);
  const description = getDescription(record);
  const normalizedName = normalizeText(name);

  const notes: string[] = [];

  if (!island) notes.push("Island could not be inferred.");
  if (!description) notes.push("Missing description.");
  if (normalizedName.length < 2) notes.push("Weak normalized name.");

  const confidence =
    island && description && getCoordinates(record)
      ? "high"
      : island && (description || type !== "place")
        ? "medium"
        : "low";

  const slug = `${island || "unknown"}-${type}-${slugify(name)}`;

  return {
    id: record.id ? cleanString(record.id) : `clean:${slug}`,
    name,
    displayName: cleanString(record.displayName || record.title || name),
    normalizedName,
    slug,
    island,
    type,
    category: type,
    description,
    shortDescription: description ? description.slice(0, 220) : undefined,
    coordinates: getCoordinates(record),
    aliases: getAliases(record),
    historicalNames: uniqueStrings([record.historicalNames, record.variantNames, getAliases(record)]),
    tags: getTags(record, source, type),
    sources: uniqueStrings([record.source, source]),
    sourceRecords: [
      {
        source,
        id: record.id ? cleanString(record.id) : undefined,
        name,
        type,
        priority,
      },
    ],
    relationships: [],
    confidence,
    needsReview: notes.length > 0 || confidence === "low",
    reviewNotes: notes,
  };
}

function mergeRecords(existing: CleanRecord, incoming: CleanRecord, incomingPriority: number) {
  const existingScore = scoreRecord(existing, existing.sourceRecords[0]?.priority || 0);
  const incomingScore = scoreRecord(incoming, incomingPriority);

  const primary = incomingScore > existingScore ? incoming : existing;
  const secondary = incomingScore > existingScore ? existing : incoming;

  return {
    ...primary,
    aliases: uniqueStrings([primary.aliases, secondary.aliases, secondary.name]),
    historicalNames: uniqueStrings([
      primary.historicalNames,
      secondary.historicalNames,
      primary.aliases,
      secondary.aliases,
    ]),
    tags: uniqueStrings([primary.tags, secondary.tags]),
    sources: uniqueStrings([primary.sources, secondary.sources]),
    sourceRecords: [...primary.sourceRecords, ...secondary.sourceRecords],
    relationships: [...primary.relationships, ...secondary.relationships],
    description:
      primary.description.length >= secondary.description.length
        ? primary.description
        : secondary.description,
    shortDescription:
      (primary.description.length >= secondary.description.length
        ? primary.description
        : secondary.description
      ).slice(0, 220),
    coordinates: primary.coordinates || secondary.coordinates,
    confidence:
      primary.confidence === "high" || secondary.confidence === "high"
        ? "high"
        : primary.confidence === "medium" || secondary.confidence === "medium"
          ? "medium"
          : "low",
    needsReview: primary.needsReview || secondary.needsReview,
    reviewNotes: uniqueStrings([primary.reviewNotes, secondary.reviewNotes]),
  };
}

function extractArraysFromModule(moduleValue: any) {
  const arrays: any[] = [];
  const seenArrays = new WeakSet<object>();

  function addArray(exportName: string, records: any[]) {
    if (!Array.isArray(records)) return;
    if (seenArrays.has(records)) return;

    seenArrays.add(records);
    arrays.push({
      exportName,
      records,
    });
  }

  const preferredExports = [
    "cleanGeographicIndex",
    "cleanGeographicIndexItems",
    "geographicIndexItems",
    "geographicIndexDataItems",
    "atlasSearchIndex",
    "estateKnowledge",
    "standaloneDictionaryPlaces",
    "quarterFeatureLinks",
    "estateFeatureLinks",
    "estateHistories",
    "usviHistoryExtract",
    "geographicDictionaryEntries",
    "geographicDictionaryAdditions",
    "default",
  ];

  for (const key of preferredExports) {
    const value = moduleValue[key];

    if (Array.isArray(value)) {
      addArray(key, value);
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (Array.isArray(value.items)) addArray(`${key}.items`, value.items);
      if (Array.isArray(value.records)) addArray(`${key}.records`, value.records);
    }
  }

  for (const [key, value] of Object.entries(moduleValue)) {
    if (Array.isArray(value)) {
      addArray(key, value);
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (Array.isArray((value as any).items)) {
        addArray(`${key}.items`, (value as any).items);
      }

      if (Array.isArray((value as any).records)) {
        addArray(`${key}.records`, (value as any).records);
      }
    }
  }

  return arrays;
}

async function loadSource(source: any) {
  try {
    const moduleValue = await import(source.path);
    const arrays = extractArraysFromModule(moduleValue);

    return {
      ...source,
      ok: true,
      arrays,
      error: "",
    };
  } catch (error) {
    return {
      ...source,
      ok: false,
      arrays: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function writeCompactDataModule(records: CleanRecord[]) {
  const generatedAt = new Date().toISOString();
  const jsonText = JSON.stringify(records);

  const dataFile = `// Auto-generated compact clean geographic index data.
// Last updated: ${generatedAt}
// Do not edit manually.

export type CleanGeographicIndexDataRecord = Record<string, any>;

const cleanGeographicIndexJson = ${JSON.stringify(jsonText)};

export const cleanGeographicIndexData = JSON.parse(
  cleanGeographicIndexJson
) as CleanGeographicIndexDataRecord[];

export default cleanGeographicIndexData;
`;

  writeFileSync(OUT_DATA, dataFile);
}

function writeWrapper() {
  const wrapper = `import cleanGeographicIndexData from "./cleanGeographicIndex.data";

export type IslandCode =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island"
  | "";

export type CleanGeographicIndexRecord = {
  id: string;
  name: string;
  displayName: string;
  normalizedName: string;
  slug: string;
  island: IslandCode;
  type: string;
  category: string;
  description: string;
  shortDescription?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  aliases: string[];
  historicalNames: string[];
  tags: string[];
  sources: string[];
  sourceRecords: Array<{
    source: string;
    id?: string;
    name?: string;
    type?: string;
    priority: number;
  }>;
  relationships: Array<{
    type: string;
    targetId?: string;
    targetName?: string;
    source: string;
  }>;
  confidence: "high" | "medium" | "low";
  needsReview: boolean;
  reviewNotes: string[];
  [key: string]: any;
};

export const cleanGeographicIndex =
  cleanGeographicIndexData as CleanGeographicIndexRecord[];

export const cleanGeographicIndexMeta = {
  totalRecords: cleanGeographicIndex.length,
  byIsland: cleanGeographicIndex.reduce<Record<string, number>>((acc, item) => {
    const island = item.island || "unknown";
    acc[island] = (acc[island] || 0) + 1;
    return acc;
  }, {}),
  byType: cleanGeographicIndex.reduce<Record<string, number>>((acc, item) => {
    const type = item.type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}),
  needsReview: cleanGeographicIndex.filter((item) => item.needsReview).length,
};

export const cleanGeographicIndexItems = cleanGeographicIndex;
export default cleanGeographicIndex;
`;

  writeFileSync(OUT_INDEX, wrapper);
}

async function main() {
  mkdirSync(path.dirname(OUT_REPORT), { recursive: true });
  mkdirSync(path.dirname(OUT_DATA), { recursive: true });

  const loadedSources = await Promise.all(SOURCE_MODULES.map(loadSource));

  const map = new Map<string, CleanRecord>();
  const review: any[] = [];
  const sourceStats: any[] = [];

  for (const source of loadedSources) {
    let seen = 0;
    let promoted = 0;
    let skippedRelationshipOnly = 0;
    let skippedNoName = 0;

    for (const arrayInfo of source.arrays) {
      for (const rawRecord of arrayInfo.records) {
        seen += 1;

        if (isRelationshipOnly(rawRecord)) {
          skippedRelationshipOnly += 1;
          review.push({
            source: source.label,
            exportName: arrayInfo.exportName,
            reason: "relationship-only-record",
            record: rawRecord,
          });
          continue;
        }

        const clean = makeCleanRecord(rawRecord, source.label, source.priority);

        if (!clean) {
          skippedNoName += 1;
          review.push({
            source: source.label,
            exportName: arrayInfo.exportName,
            reason: "missing-name",
            record: rawRecord,
          });
          continue;
        }

        const key = makeKey(clean);
        const existing = map.get(key);

        if (existing) {
          map.set(key, mergeRecords(existing, clean, source.priority));
        } else {
          map.set(key, clean);
        }

        promoted += 1;
      }
    }

    sourceStats.push({
      source: source.label,
      ok: source.ok,
      error: source.error,
      arrays: source.arrays.map((arrayInfo: any) => ({
        exportName: arrayInfo.exportName,
        records: arrayInfo.records.length,
      })),
      seen,
      promoted,
      skippedRelationshipOnly,
      skippedNoName,
    });
  }

  const records = [...map.values()].sort((a, b) => {
    const islandCompare = String(a.island).localeCompare(String(b.island));
    if (islandCompare !== 0) return islandCompare;

    const typeCompare = String(a.type).localeCompare(String(b.type));
    if (typeCompare !== 0) return typeCompare;

    return String(a.name).localeCompare(String(b.name));
  });

  writeCompactDataModule(records);
  writeWrapper();

  writeFileSync(OUT_JSON, JSON.stringify(records, null, 2));
  writeFileSync(OUT_REVIEW, JSON.stringify(review, null, 2));

  const byType = records.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const byIsland = records.reduce<Record<string, number>>((acc, item) => {
    acc[item.island || "unknown"] = (acc[item.island || "unknown"] || 0) + 1;
    return acc;
  }, {});

  const report = `# Clean Geographic Index Report

Generated: ${new Date().toISOString()}

## Totals

| Metric | Count |
|---|---:|
| Clean index records | ${records.length} |
| Review records | ${review.length} |
| Needs review in clean index | ${records.filter((item) => item.needsReview).length} |

## By island

${Object.entries(byIsland)
  .sort((a, b) => b[1] - a[1])
  .map(([island, count]) => `- ${island || "unknown"}: ${count}`)
  .join("\n")}

## By type

${Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `- ${type}: ${count}`)
  .join("\n")}

## Sources

| Source | Loaded | Seen | Promoted | Relationship-only | No-name skipped |
|---|---:|---:|---:|---:|---:|
${sourceStats
  .map((stat) => {
    return `| ${stat.source} | ${stat.ok ? "yes" : "no"} | ${stat.seen} | ${stat.promoted} | ${stat.skippedRelationshipOnly} | ${stat.skippedNoName} |`;
  })
  .join("\n")}

## Output files

- \`src/data/core/cleanGeographicIndex.data.ts\`
- \`src/data/core/cleanGeographicIndex.ts\`
- \`reports/clean-geographic-index.json\`
- \`reports/clean-geographic-index-review.json\`
`;

  writeFileSync(OUT_REPORT, report);

  console.log("Clean geographic index built.");
  console.log({
    records: records.length,
    review: review.length,
    byIsland,
    byType,
    report: OUT_REPORT,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
