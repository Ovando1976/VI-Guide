#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { geographicDictionaryEntries } from "../src/data/geographicDictionaryEntries";

const OUT_TS = path.join(process.cwd(), "src/data/dictionaryReviewEntries.ts");
const OUT_JSON = path.join(process.cwd(), "generated/dictionary-review-entries.json");

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

function featureType(entry: any) {
  const text = `${entry.sourceName} ${entry.description}`.toLowerCase();

  if (/\bestate\b|\bplantage\b|\bplantation\b/.test(text)) return "estate";
  if (/\bquarter\b|\bdistrict\b/.test(text)) return "quarter";
  if (/\bbay\b|\bcove\b|\bharbor\b|\binlet\b/.test(text)) return "bay";
  if (/\bpoint\b|\bhead\b|\bbluff\b/.test(text)) return "point";
  if (/\bhill\b|\bmount\b|\bmountain\b|\bpeak\b|\bridge\b/.test(text)) return "hill";
  if (/\bcay\b|\bkey\b|\bisland\b|\bislet\b/.test(text)) return "cay_or_island";
  if (/\bgut\b|\bstream\b|\bcreek\b|\briver\b/.test(text)) return "gut_or_stream";
  if (/\broad\b|\broute\b|\btrail\b|\bpath\b/.test(text)) return "road";
  if (/\bschool\b/.test(text)) return "school";
  if (/\bchurch\b|\bmission\b/.test(text)) return "church";
  if (/\bvillage\b|\btown\b|\bsettlement\b/.test(text)) return "settlement";

  return "unknown";
}

async function main() {
  const rows = geographicDictionaryEntries.map((entry) => ({
    id: entry.id,
    sourceName: entry.sourceName,
    normalizedName: entry.normalizedName,
    cleanedName: cleanName(entry.sourceName),
    featureType: featureType(entry),
    island: entry.possibleIsland ?? null,
    quarter: entry.possibleQuarter ?? null,
    parentEstateGeoid: null,
    parentEstateName: null,
    confidence: 0,
    description: entry.description,
    cleanedDescription: cleanText(entry.description),
    status: "unreviewed",
    notes: "",
  }));

  await fs.writeFile(OUT_JSON, JSON.stringify(rows, null, 2));

  await fs.writeFile(
    OUT_TS,
    `import type { DictionaryReviewEntry } from "./dictionaryReviewTypes";

export const dictionaryReviewEntries: DictionaryReviewEntry[] = ${JSON.stringify(
      rows,
      null,
      2
    )};
`
  );

  console.log(`Built ${rows.length} dictionary review entries`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});