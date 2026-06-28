#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { estates } from "../src/data/estates";
import { classifiedGeographicDictionaryEntries } from "../src/data/geographicDictionaryClassified";

const GENERATED_DIR = path.join(process.cwd(), "generated");

const COORD_LINKS_JSON = path.join(GENERATED_DIR, "estate-coordinate-links.json");

const OUT_DICTIONARY_ENTRIES = path.join(process.cwd(), "src/data/dictionaryEntries.ts");
const OUT_ESTATE_FEATURES = path.join(process.cwd(), "src/data/estateFeatureLinks.ts");
const OUT_QUARTER_FEATURES = path.join(process.cwd(), "src/data/quarterFeatureLinks.ts");
const OUT_STANDALONE = path.join(process.cwd(), "src/data/standaloneDictionaryPlaces.ts");
const OUT_COORDS = path.join(process.cwd(), "src/data/dictionaryCoordinates.ts");

const OUT_ENGINE_JSON = path.join(GENERATED_DIR, "dictionary-knowledge-engine.json");

type FeatureType =
  | "estate"
  | "quarter"
  | "bay"
  | "point"
  | "hill"
  | "cay_or_island"
  | "gut_or_stream"
  | "road"
  | "settlement"
  | "school"
  | "church"
  | "historic_site"
  | "coordinate"
  | "unknown";

type DictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  cleanedName: string;
  featureType: FeatureType;
  island: string | null;
  quarter: string | null;
  quarterGroup: string | null;
  description: string;
  cleanedDescription: string;
  confidence: number;
  source: "Geographic Dictionary of the Virgin Islands";
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function cleanName(value: unknown) {
  return cleanText(value)
    .replace(/^Estate\s+/i, "")
    .replace(/[,.;:].*$/, "")
    .trim();
}

function key(value: unknown) {
  return cleanName(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function featureType(entry: any): FeatureType {
  const type = String(entry.type ?? "");

  if (
    [
      "estate",
      "quarter",
      "bay",
      "point",
      "hill",
      "cay_or_island",
      "gut_or_stream",
      "road",
      "settlement",
      "school",
      "church",
      "historic_site",
      "coordinate",
      "unknown",
    ].includes(type)
  ) {
    return type as FeatureType;
  }

  const text = key(`${entry.sourceName} ${entry.description}`);

  if (/\bestate\b|\bplantage\b|\bplantation\b/.test(text)) return "estate";
  if (/\bquarter\b|\bdistrict\b/.test(text)) return "quarter";
  if (/\bbay\b|\bcove\b|\bharbor\b|\bharbour\b|\binlet\b/.test(text)) return "bay";
  if (/\bpoint\b|\bhead\b|\bbluff\b|\bpeninsula\b/.test(text)) return "point";
  if (/\bhill\b|\bmount\b|\bmountain\b|\bpeak\b|\bridge\b/.test(text)) return "hill";
  if (/\bcay\b|\bkey\b|\bisland\b|\bislet\b/.test(text)) return "cay_or_island";
  if (/\bgut\b|\bstream\b|\bcreek\b|\briver\b/.test(text)) return "gut_or_stream";
  if (/\broad\b|\broute\b|\btrail\b|\bpath\b/.test(text)) return "road";
  if (/\bschool\b/.test(text)) return "school";
  if (/\bchurch\b|\bmission\b/.test(text)) return "church";
  if (/\bvillage\b|\btown\b|\bsettlement\b/.test(text)) return "settlement";

  return "unknown";
}

function estateNames(estate: (typeof estates)[number]) {
  const names = new Set<string>();
  const base = key(estate.name);

  if (base) names.add(base);

  if (Array.isArray(estate.aliases)) {
    for (const alias of estate.aliases) {
      const aliasKey = key(alias);
      if (aliasKey.length >= 4) names.add(aliasKey);
    }
  }

  for (const part of base.split(" and ")) {
    if (part.length >= 4) names.add(part);
  }

  return [...names];
}

function scoreEstate(entry: DictionaryEntry, estate: (typeof estates)[number]) {
  const entryName = key(entry.cleanedName);
  const entryText = key(entry.cleanedDescription);
  const names = estateNames(estate);

  let score = 0;
  const reasons: string[] = [];

  for (const estateName of names) {
    if (entryName === estateName) {
      score += 160;
      reasons.push("exact estate name");
    }

    if (estateName.length >= 5 && entryName.includes(estateName)) {
      score += 110;
      reasons.push("entry name contains estate name");
    }

    if (entryName.length >= 5 && estateName.includes(entryName)) {
      score += 95;
      reasons.push("estate name contains entry name");
    }

    if (estateName.length >= 5 && entryText.includes(estateName)) {
      score += 25;
      reasons.push("description mentions estate");
    }
  }

  if (entry.island && entry.island === estate.island) {
    score += 20;
    reasons.push("same island");
  }

  if (entry.island && entry.island !== estate.island) {
    score -= 45;
    reasons.push("different island penalty");
  }

  const estateQuarter = key(estate.quarterGroup || estate.quarter || "");
  const entryQuarter = key(entry.quarterGroup || entry.quarter || "");

  if (
    estateQuarter &&
    entryQuarter &&
    (estateQuarter === entryQuarter ||
      estateQuarter.includes(entryQuarter) ||
      entryQuarter.includes(estateQuarter))
  ) {
    score += 15;
    reasons.push("quarter agreement");
  }

  const strongNameMatch =
    reasons.includes("exact estate name") ||
    reasons.includes("entry name contains estate name") ||
    reasons.includes("estate name contains entry name");

  if (!strongNameMatch && reasons.includes("description mentions estate")) {
    score = Math.min(score, 90);
  }

  return {
    estateGeoid: String(estate.geoid),
    estateName: cleanName(estate.name),
    island: estate.island,
    quarter: estate.quarter ?? null,
    quarterGroup: estate.quarterGroup ?? null,
    score: Math.max(0, score),
    strongNameMatch,
    reasons: [...new Set(reasons)],
  };
}

function scoreQuarter(entry: DictionaryEntry, estate: (typeof estates)[number]) {
  const entryText = key(`${entry.cleanedName} ${entry.cleanedDescription}`);
  const quarter = String(estate.quarterGroup || estate.quarter || "");
  const quarterKey = key(quarter);

  let score = 0;

  if (quarterKey && entryText.includes(quarterKey)) score += 80;
  if (entry.quarterGroup && key(entry.quarterGroup) === quarterKey) score += 80;
  if (entry.island && entry.island === estate.island) score += 20;

  return score;
}

async function readCoordinateLinks() {
  try {
    const raw = await fs.readFile(COORD_LINKS_JSON, "utf8");
    return JSON.parse(raw) as {
      estateLinks: Array<{
        geoid: string;
        estateName: string;
        coordinates: Array<{
          entryId: string;
          sourceName: string;
          lat: number;
          lng: number;
          rawLat: string;
          rawLng: string;
          description: string;
        }>;
      }>;
    };
  } catch {
    return { estateLinks: [] };
  }
}

function writeTsArray<T>(typeBlock: string, exportName: string, rows: T[]) {
  return `${typeBlock}

export const ${exportName} = ${JSON.stringify(rows, null, 2)};
`;
}

async function main() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const coordinateLinks = await readCoordinateLinks();

  const dictionaryEntries: DictionaryEntry[] =
    classifiedGeographicDictionaryEntries.map((entry: any) => ({
      id: String(entry.id),
      sourceName: cleanText(entry.sourceName),
      normalizedName: String(entry.normalizedName ?? ""),
      cleanedName: cleanName(entry.sourceName),
      featureType: featureType(entry),
      island: entry.possibleIsland ?? null,
      quarter: entry.possibleQuarter ?? null,
      quarterGroup: entry.possibleQuarterGroup ?? null,
      description: cleanText(entry.description),
      cleanedDescription: cleanText(entry.description),
      confidence: Number(entry.confidence ?? 0),
      source: "Geographic Dictionary of the Virgin Islands",
    }));

  const usedEntryIds = new Set<string>();

  const estateFeatureLinks = estates.map((estate) => {
    const candidates = dictionaryEntries
      .map((entry) => {
        const scored = scoreEstate(entry, estate);
        return {
          entry,
          ...scored,
        };
      })
      .filter((item) => item.score >= 100 && item.strongNameMatch)
      .sort((a, b) => b.score - a.score);

    const features = candidates.map((item) => {
      usedEntryIds.add(item.entry.id);

      return {
        entryId: item.entry.id,
        name: item.entry.cleanedName,
        type: item.entry.featureType,
        island: item.entry.island,
        quarter: item.entry.quarter,
        confidence: item.score,
        reasons: item.reasons,
        description: item.entry.cleanedDescription,
      };
    });

    return {
      estateGeoid: String(estate.geoid),
      estateName: cleanName(estate.name),
      island: estate.island,
      quarter: estate.quarter ?? null,
      quarterGroup: estate.quarterGroup ?? null,
      features,
    };
  });

  const quarterMap = new Map<string, any>();

  for (const estate of estates) {
    const quarter = String(estate.quarterGroup || estate.quarter || "UNKNOWN");
    const mapKey = `${estate.island}:${quarter}`;

    if (!quarterMap.has(mapKey)) {
      quarterMap.set(mapKey, {
        island: estate.island,
        quarter,
        features: [],
      });
    }
  }

  for (const entry of dictionaryEntries) {
    if (usedEntryIds.has(entry.id)) continue;

    if (entry.featureType === "quarter") {
      const matchingEstates = estates
        .map((estate) => ({
          estate,
          score: scoreQuarter(entry, estate),
        }))
        .filter((item) => item.score >= 80);

      for (const item of matchingEstates) {
        const quarter = String(
          item.estate.quarterGroup || item.estate.quarter || "UNKNOWN"
        );
        const mapKey = `${item.estate.island}:${quarter}`;
        const record = quarterMap.get(mapKey);

        if (record) {
          record.features.push({
            entryId: entry.id,
            name: entry.cleanedName,
            type: entry.featureType,
            confidence: item.score,
            description: entry.cleanedDescription,
          });
          usedEntryIds.add(entry.id);
        }
      }
    }
  }

  const quarterFeatureLinks = [...quarterMap.values()].filter(
    (item) => item.features.length > 0
  );

  const dictionaryCoordinates = coordinateLinks.estateLinks.flatMap((estate) =>
    estate.coordinates.map((coord) => ({
      entryId: coord.entryId,
      sourceName: coord.sourceName,
      lat: coord.lat,
      lng: coord.lng,
      rawLat: coord.rawLat,
      rawLng: coord.rawLng,
      linkedEstateGeoid: estate.geoid,
      linkedEstateName: estate.estateName,
      confidence: 100,
      source: "Geographic Dictionary of the Virgin Islands",
      description: coord.description,
    }))
  );

  for (const coord of dictionaryCoordinates) {
    usedEntryIds.add(coord.entryId);
  }

  const standaloneDictionaryPlaces = dictionaryEntries
    .filter((entry) => !usedEntryIds.has(entry.id))
    .map((entry) => ({
      entryId: entry.id,
      name: entry.cleanedName,
      type: entry.featureType,
      island: entry.island,
      quarter: entry.quarter,
      description: entry.cleanedDescription,
      source: entry.source,
    }));

  const engine = {
    generatedAt: new Date().toISOString(),
    dictionaryEntries,
    estateFeatureLinks,
    quarterFeatureLinks,
    standaloneDictionaryPlaces,
    dictionaryCoordinates,
    stats: {
      dictionaryEntries: dictionaryEntries.length,
      estateFeatureLinks: estateFeatureLinks.reduce(
        (sum, estate) => sum + estate.features.length,
        0
      ),
      quarterFeatureLinks: quarterFeatureLinks.reduce(
        (sum, quarter) => sum + quarter.features.length,
        0
      ),
      standaloneDictionaryPlaces: standaloneDictionaryPlaces.length,
      dictionaryCoordinates: dictionaryCoordinates.length,
    },
  };

  await fs.writeFile(OUT_ENGINE_JSON, JSON.stringify(engine, null, 2));

  await fs.writeFile(
    OUT_DICTIONARY_ENTRIES,
    writeTsArray(
      `export type DictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  cleanedName: string;
  featureType: string;
  island: string | null;
  quarter: string | null;
  quarterGroup: string | null;
  description: string;
  cleanedDescription: string;
  confidence: number;
  source: "Geographic Dictionary of the Virgin Islands";
};`,
      "dictionaryEntries",
      dictionaryEntries
    )
  );

  await fs.writeFile(
    OUT_ESTATE_FEATURES,
    writeTsArray(
      `export type EstateFeatureLink = {
  estateGeoid: string;
  estateName: string;
  island: string;
  quarter: string | null;
  quarterGroup: string | null;
  features: Array<{
    entryId: string;
    name: string;
    type: string;
    island: string | null;
    quarter: string | null;
    confidence: number;
    reasons: string[];
    description: string;
  }>;
};

export function getEstateFeatureLinkByGeoid(geoid: string) {
  return estateFeatureLinks.find((link) => String(link.estateGeoid) === String(geoid)) ?? null;
}

export function getEstateFeaturesByGeoid(geoid: string) {
  return getEstateFeatureLinkByGeoid(geoid)?.features ?? [];
}`,
      "estateFeatureLinks",
      estateFeatureLinks
    )
  );

  await fs.writeFile(
    OUT_QUARTER_FEATURES,
    writeTsArray(
      `export type QuarterFeatureLink = {
  island: string;
  quarter: string;
  features: Array<{
    entryId: string;
    name: string;
    type: string;
    confidence: number;
    description: string;
  }>;
};

export function getQuarterFeatures(island: string, quarter: string) {
  return quarterFeatureLinks.find(
    (link) => link.island === island && link.quarter === quarter
  )?.features ?? [];
}`,
      "quarterFeatureLinks",
      quarterFeatureLinks
    )
  );

  await fs.writeFile(
    OUT_STANDALONE,
    writeTsArray(
      `export type StandaloneDictionaryPlace = {
  entryId: string;
  name: string;
  type: string;
  island: string | null;
  quarter: string | null;
  description: string;
  source: "Geographic Dictionary of the Virgin Islands";
};`,
      "standaloneDictionaryPlaces",
      standaloneDictionaryPlaces
    )
  );

  await fs.writeFile(
    OUT_COORDS,
    writeTsArray(
      `export type DictionaryCoordinate = {
  entryId: string;
  sourceName: string;
  lat: number;
  lng: number;
  rawLat: string;
  rawLng: string;
  linkedEstateGeoid: string;
  linkedEstateName: string;
  confidence: number;
  source: "Geographic Dictionary of the Virgin Islands";
  description: string;
};

export function getDictionaryCoordinatesByEstateGeoid(geoid: string) {
  return dictionaryCoordinates.filter((coord) => String(coord.linkedEstateGeoid) === String(geoid));
}`,
      "dictionaryCoordinates",
      dictionaryCoordinates
    )
  );

  console.log("Dictionary knowledge engine built");
  console.log(engine.stats);
  console.log(`Wrote ${OUT_ENGINE_JSON}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});