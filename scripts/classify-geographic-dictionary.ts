#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { dictionaryEntries as geographicDictionaryEntries } from "../src/data/viDictionary";

const GENERATED_DIR = path.join(process.cwd(), "generated");
const OUTPUT_JSON = path.join(GENERATED_DIR, "geographic-dictionary.classified.json");
const OUTPUT_TS = path.join(process.cwd(), "src/data/geographicDictionaryClassified.ts");

type DictionaryType =
  | "estate"
  | "bay"
  | "quarter"
  | "town"
  | "island"
  | "cay"
  | "point"
  | "hill"
  | "harbor"
  | "road"
  | "church"
  | "fort"
  | "place"
  | "unknown";

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function classify(description: string, name: string): DictionaryType {
  const text = normalize(`${name} ${description}`);

  if (/\bestate\b/.test(text) || /\bplantation\b/.test(text)) return "estate";
  if (/\bquarter\b/.test(text)) return "quarter";
  if (/\bbay\b/.test(text)) return "bay";
  if (/\bharbor\b|\bharbour\b/.test(text)) return "harbor";
  if (/\bcay\b|\bkey\b/.test(text)) return "cay";
  if (/\bpoint\b/.test(text)) return "point";
  if (/\bhill\b|\bmountain\b|\bpeak\b/.test(text)) return "hill";
  if (/\btown\b|\bvillage\b|\bsettlement\b/.test(text)) return "town";
  if (/\bisland\b/.test(text)) return "island";
  if (/\broad\b|\bstreet\b/.test(text)) return "road";
  if (/\bchurch\b|\bchapel\b/.test(text)) return "church";
  if (/\bfort\b|\bbattery\b/.test(text)) return "fort";

  return "place";
}

function normalizeQuarter(value: string | null) {
  if (!value) return null;

  const q = value.toUpperCase();

  if (q.includes("GREAT NORTHSIDE")) return "GREAT_NORTHSIDE";
  if (q.includes("LITTLE NORTHSIDE")) return "LITTLE_NORTHSIDE";
  if (q.includes("FRENCHMAN")) return "FRENCHMAN_BAY";
  if (q.includes("CRUZ BAY")) return "CRUZ_BAY";
  if (q.includes("CORAL BAY")) return "CORAL_BAY";
  if (q.includes("REEF BAY")) return "REEF_BAY";
  if (q.includes("MAHO BAY")) return "MAHO_BAY";
  if (q.includes("REDHOOK")) return "REDHOOK";
  if (q.includes("EAST")) return "EAST_END";
  if (q.includes("WEST")) return "WEST_END";
  if (q.includes("NORTHSIDE")) return "NORTHSIDE";
  if (q.includes("SOUTHSIDE")) return "SOUTHSIDE";
  if (q.includes("KRONPRINDSENS") || q.includes("PRINCE")) return "PRINCE";
  if (q.includes("KONGENS") || q.includes("KING")) return "KING";
  if (q.includes("DRONNINGENS") || q.includes("QUEEN")) return "QUEEN";
  if (q.includes("COMPAGNIE") || q.includes("COMPANY")) return "COMPANY";
  if (q.includes("NEW")) return "NEW";

  return q.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

async function main() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const classified = geographicDictionaryEntries.map((entry) => ({
    ...entry,
    type: classify(entry.description, entry.sourceName),
    possibleQuarterGroup: normalizeQuarter(entry.possibleQuarter),
  }));

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(classified, null, 2));

  await fs.writeFile(
    OUTPUT_TS,
    `export type ClassifiedGeographicDictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
  possibleQuarterGroup: string | null;
  type: string;
};

export const classifiedGeographicDictionaryEntries: ClassifiedGeographicDictionaryEntry[] = ${JSON.stringify(
      classified,
      null,
      2
    )};
`
  );

  console.log(`Classified ${classified.length} dictionary entries`);
  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});