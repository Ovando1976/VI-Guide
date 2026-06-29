import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

type RawDiscoveryFile = {
  records: RawDiscovery[];
};

type RawDiscovery = {
  id: string;
  title?: string;
  name?: string;
  island?: string;
  category?: string;
  type?: string;
  description?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  raw?: Record<string, any>;
};

type CanonicalDiscovery = {
  id: string;
  sourceIds: string[];
  title: string;
  normalizedTitle: string;
  island: string;
  category: string;
  type: string;
  description: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  tags: string[];
  confidence: number;
  duplicateCount: number;
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

function slug(value: unknown) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeIsland(value: unknown) {
  const text = normalize(value);
  if (text === "stt" || text.includes("thomas")) return "st_thomas";
  if (text === "stj" || text.includes("john")) return "st_john";
  if (text === "stx" || text.includes("croix")) return "st_croix";
  if (text.includes("water")) return "water_island";
  return text || "st_thomas";
}

function normalizeCategory(value: unknown) {
  const text = normalize(value);
  if (text.includes("beach")) return "beach";
  if (text.includes("restaurant") || text === "food" || text === "nightlife") return "restaurant";
  if (text.includes("event")) return "event";
  if (text.includes("historic") || text === "history") return "history";
  if (text.includes("ferry") || text.includes("cruise") || text.includes("transport")) return "transport";
  if (text.includes("hiking")) return "hiking-trail";
  if (text.includes("shopping")) return "shopping";
  if (text.includes("business")) return "business";
  if (text.includes("attraction")) return "attraction";
  if (text.includes("grocery") || text.includes("provision")) return "provisioning";
  return text || "place";
}

function validNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function titleOf(record: RawDiscovery) {
  return clean(
    record.title ||
      record.name ||
      record.raw?.title ||
      record.raw?.name ||
      record.raw?.businessName ||
      record.id,
  );
}

function islandOf(record: RawDiscovery) {
  return normalizeIsland(record.raw?.islandCode ?? record.island ?? record.raw?.island);
}

function categoryOf(record: RawDiscovery) {
  return normalizeCategory(
    record.raw?.collectionName ??
      record.raw?.sourceCollection ??
      record.category ??
      record.type,
  );
}

function dedupeKey(record: RawDiscovery) {
  return `${islandOf(record)}:${categoryOf(record)}:${slug(titleOf(record))}`;
}

function mergeGroup(group: RawDiscovery[]): CanonicalDiscovery {
  const primary = group[0];
  const raw = primary.raw ?? {};
  const title = titleOf(primary);
  const island = islandOf(primary);
  const category = categoryOf(primary);

  const lat =
    validNumber(primary.lat) ??
    validNumber(raw.lat) ??
    validNumber(raw.latitude) ??
    validNumber(raw.coordinates?.lat) ??
    validNumber(raw.location?.lat) ??
    validNumber(raw.centroid?.lat);

  const lng =
    validNumber(primary.lng) ??
    validNumber(raw.lng) ??
    validNumber(raw.longitude) ??
    validNumber(raw.coordinates?.lng) ??
    validNumber(raw.location?.lng) ??
    validNumber(raw.centroid?.lng);

  const tags = [
    ...new Set(
      group.flatMap((item) => [
        ...(item.tags || []),
        ...(Array.isArray(item.raw?.tags) ? item.raw.tags : []),
        categoryOf(item),
        islandOf(item),
      ]),
    ),
  ].map(clean).filter(Boolean);

  const description = clean(
    primary.description ||
      raw.description ||
      raw.summary ||
      raw.shortDescription ||
      group.find((item) => item.description)?.description ||
      "Virgin Islands discovery record.",
  );

  const imageUrl = clean(
    primary.imageUrl ||
      raw.coverImage ||
      raw.imageUrl ||
      raw.image ||
      raw.photoUrl ||
      "",
  );

  return {
    id: `${island}-${category}-${slug(title)}`,
    sourceIds: group.map((item) => item.id),
    title,
    normalizedTitle: normalize(title),
    island,
    category,
    type: category,
    description,
    imageUrl: imageUrl || undefined,
    lat,
    lng,
    tags,
    confidence: group.length > 1 ? 0.9 : 0.75,
    duplicateCount: group.length - 1,
    searchText: normalize([title, island, category, description, ...tags, ...group.map((item) => item.id)].join(" ")),
  };
}

const input = JSON.parse(readFileSync("public/data/discoveries.json", "utf8")) as RawDiscoveryFile;
const records = input.records || [];
const groups = new Map<string, RawDiscovery[]>();

for (const record of records) {
  const key = dedupeKey(record);
  groups.set(key, [...(groups.get(key) || []), record]);
}

const canonicalRecords = [...groups.values()]
  .map(mergeGroup)
  .sort((a, b) => `${a.island}-${a.category}-${a.title}`.localeCompare(`${b.island}-${b.category}-${b.title}`));

const metadata = {
  generatedAt: new Date().toISOString(),
  inputRecords: records.length,
  canonicalRecords: canonicalRecords.length,
  duplicatesMerged: records.length - canonicalRecords.length,
  byIsland: canonicalRecords.reduce<Record<string, number>>((acc, item) => {
    acc[item.island] = (acc[item.island] || 0) + 1;
    return acc;
  }, {}),
  byCategory: canonicalRecords.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {}),
};

mkdirSync("public/data/canonical", { recursive: true });
mkdirSync("src/data/canonical", { recursive: true });

writeFileSync(
  "public/data/canonical/discoveries.canonical.json",
  JSON.stringify({ metadata, records: canonicalRecords }, null, 2) + "\n",
);

writeFileSync(
  "src/data/canonical/discoveriesCanonical.ts",
  `import canonicalFile from "../../../public/data/canonical/discoveries.canonical.json";

export type CanonicalDiscovery = {
  id: string;
  sourceIds: string[];
  title: string;
  normalizedTitle: string;
  island: string;
  category: string;
  type: string;
  description: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  tags: string[];
  confidence: number;
  duplicateCount: number;
  searchText: string;
};

type CanonicalDiscoveryFile = {
  metadata: {
    generatedAt: string;
    inputRecords: number;
    canonicalRecords: number;
    duplicatesMerged: number;
    byIsland: Record<string, number>;
    byCategory: Record<string, number>;
  };
  records: CanonicalDiscovery[];
};

const data = canonicalFile as CanonicalDiscoveryFile;

export const canonicalDiscoveryMetadata = data.metadata;
export const canonicalDiscoveries = data.records;
`,
);

console.log("Canonical discoveries built.");
console.log(metadata);
