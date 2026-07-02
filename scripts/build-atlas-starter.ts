// scripts/build-atlas-starter.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

type FeatureType =
  | "estate"
  | "quarter"
  | "bay"
  | "beach"
  | "harbor"
  | "road"
  | "point"
  | "cay"
  | "reef"
  | "rock"
  | "hill"
  | "mountain"
  | "valley"
  | "gut"
  | "pond"
  | "fort"
  | "church"
  | "town"
  | "village"
  | "building"
  | "historic_site";

type SourceMap = {
  id: string;
  title: string;
  island: IslandCode;
  imagePath: string;
  status: "manual_transcription_started" | "draft" | "verified";
  notes?: string;
};

type GazetteerFeatureInput = {
  canonicalName: string;
  featureType: FeatureType;
  island: IslandCode;
  aliases?: string[];
  coordinates?: { lat: number; lng: number } | null;
  sourceMaps?: string[];
  notes?: string;
  relatedNames?: string[];
};

type GazetteerFeature = Required<
  Omit<GazetteerFeatureInput, "aliases" | "coordinates" | "sourceMaps" | "notes" | "relatedNames">
> & {
  id: string;
  canonicalName: string;
  normalizedName: string;
  displayName: string;
  featureType: FeatureType;
  category: FeatureType;
  island: IslandCode;
  islandLabel: string;
  aliases: string[];
  coordinates: { lat: number; lng: number } | null;
  sourceMaps: string[];
  relatedNames: string[];
  searchText: string;
  notes: string;
};

const sourceMap: SourceMap = {
  id: "st_thomas_historic_map_early",
  title: "Historic Map of St. Thomas",
  island: "st_thomas",
  imagePath: "/images/maps/st-thomas-historic-map.jpeg",
  status: "manual_transcription_started",
  notes: "Starter transcription from uploaded historic St. Thomas map.",
};

const rawFeatures: GazetteerFeatureInput[] = [
  estate("Dorothea"),
  estate("Neltjeberg", ["Neltjebjerg", "Estate Neltjeberg"]),
  estate("Hull"),
  estate("St. Peter", ["Saint Peter", "Estate St. Peter"]),
  estate("Lovenlund", ["Løvenlund", "Estate Lovenlund"]),
  estate("Rosendal", ["Rosendahl, Estate Rosendal"]),
  estate("Anna's Retreat", ["Annas Retreat", "Estate Anna's Retreat"]),
  estate("Tutu"),
  estate("Nazareth", ["Estate Nazareth"], ["Nazareth Bay", "Beverhout Point", "Bourgen Estate"]),
  estate("Frydendal", ["Fryden Dal", "Estate Frydendal"]),
  estate("Bovoni", ["Estate Bovoni", "Bovoni Estate"], ["Bovoni Bay", "Bovoni Cay", "Bovoni Estate", "Batzley Point"]),
  estate("Bolongo"),

  place("Charlotte Amalie", "town", ["Charlotte Amalia", "Amalienborg"], {
    lat: 18.3419,
    lng: -64.9307,
  }),

  place("Magens Bay", "bay", ["Magen's Bay"], {
    lat: 18.3637,
    lng: -64.9304,
  }),

  cay("Hans Lollik", ["Hans Lollick", "Hans Lollik Island"]),
  cay("Inner Brass", ["Inner Brass Island"]),
  cay("Outer Brass", ["Outer Brass Island"]),
  cay("Thatch Cay", ["Thatch Island"]),
  cay("Grass Cay"),
];

const features = rawFeatures.map(normalizeFeature);

const metadata = {
  generatedAt: new Date().toISOString(),
  title: "VI Guide Starter Gazetteer",
  sourceMapId: sourceMap.id,
  totalFeatures: features.length,
  byIsland: countBy(features, "island"),
  byFeatureType: countBy(features, "featureType"),
};

writeJson("data/maps/st_thomas_early_map/map-metadata.json", sourceMap);
writeJson("data/master/gazetteer.json", features);
writeJson("data/master/gazetteer-metadata.json", metadata);

writeTs("src/data/atlas/gazetteer.ts", "gazetteer", features, "GazetteerFeature");
writeTs("src/data/atlas/sourceMaps.ts", "sourceMaps", [sourceMap], "SourceMap");
writeTs("src/data/atlas/gazetteerMetadata.ts", "gazetteerMetadata", metadata);

console.log("Atlas starter built.");
console.log(metadata);
console.log("Wrote data/master/gazetteer.json");
console.log("Wrote src/data/atlas/gazetteer.ts");
console.log("Wrote src/data/atlas/sourceMaps.ts");

function estate(
  name: string,
  aliases: string[] = [`Estate ${name}`],
  relatedNames: string[] = [],
): GazetteerFeatureInput {
  return {
    canonicalName: name,
    featureType: "estate",
    island: "st_thomas",
    aliases,
    coordinates: null,
    sourceMaps: [sourceMap.id],
    relatedNames,
    notes: `Visible on uploaded historic St. Thomas map.`,
  };
}

function cay(
  name: string,
  aliases: string[] = [],
  coordinates: { lat: number; lng: number } | null = null,
): GazetteerFeatureInput {
  return place(name, "cay", aliases, coordinates);
}

function place(
  canonicalName: string,
  featureType: FeatureType,
  aliases: string[] = [],
  coordinates: { lat: number; lng: number } | null = null,
): GazetteerFeatureInput {
  return {
    canonicalName,
    featureType,
    island: "st_thomas",
    aliases,
    coordinates,
    sourceMaps: [sourceMap.id],
    relatedNames: [],
    notes: `Visible on uploaded historic St. Thomas map.`,
  };
}

function normalizeFeature(input: GazetteerFeatureInput): GazetteerFeature {
  const normalizedName = normalize(input.canonicalName);
  const id = `${input.island}_${input.featureType}_${slug(input.canonicalName)}`;

  const aliases = uniq([
    ...(input.aliases || []),
    input.featureType === "estate" ? `Estate ${input.canonicalName}` : "",
  ]);

  const searchText = uniq([
    input.canonicalName,
    ...aliases,
    input.featureType,
    input.island,
    ...(input.relatedNames || []),
    input.notes || "",
  ])
    .join(" ")
    .toLowerCase();

  return {
    id,
    canonicalName: input.canonicalName,
    normalizedName,
    displayName:
      input.featureType === "estate"
        ? `Estate ${input.canonicalName}`
        : input.canonicalName,
    featureType: input.featureType,
    category: input.featureType,
    island: input.island,
    islandLabel: islandLabel(input.island),
    aliases,
    coordinates: input.coordinates ?? null,
    sourceMaps: input.sourceMaps?.length ? input.sourceMaps : [sourceMap.id],
    relatedNames: input.relatedNames || [],
    searchText,
    notes: input.notes || "",
  };
}

function normalize(value: string) {
  return value
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and");
}

function slug(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function islandLabel(island: IslandCode) {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  return "Water Island";
}

function uniq(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? "unknown");
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function writeTs(path: string, name: string, data: unknown, typeName?: string) {
  mkdirSync(dirname(path), { recursive: true });

  const typeExport =
    typeName === "GazetteerFeature"
      ? `
export type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

export type GazetteerFeature = {
  id: string;
  canonicalName: string;
  normalizedName: string;
  displayName: string;
  featureType: string;
  category: string;
  island: IslandCode;
  islandLabel: string;
  aliases: readonly string[];
  coordinates: { lat: number; lng: number } | null;
  sourceMaps: readonly string[];
  relatedNames: readonly string[];
  searchText: string;
  notes: string;
};
`
      : typeName === "SourceMap"
        ? `
export type SourceMap = {
  id: string;
  title: string;
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  imagePath: string;
  status: "manual_transcription_started" | "draft" | "verified";
  notes?: string;
};
`
        : "";

  writeFileSync(
    path,
    `// Auto-generated by scripts/build-atlas-starter.ts
${typeExport}
export const ${name} = ${JSON.stringify(data, null, 2)} as const;
`,
  );
}