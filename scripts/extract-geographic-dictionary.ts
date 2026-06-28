#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const PDF_PATH =
  process.env.PDF_PATH ||
  path.join(
    process.cwd(),
    "docs/sources/geographic-dictionary-virgin-islands-1925.pdf"
  );

const GENERATED_DIR = path.join(process.cwd(), "generated");
const RAW_TEXT_OUT = path.join(GENERATED_DIR, "geographic-dictionary.raw.txt");
const ENTRIES_JSON_OUT = path.join(
  GENERATED_DIR,
  "geographic-dictionary.entries.json"
);
const OUTPUT_TS = path.join(
  process.cwd(),
  "src/data/geographicDictionaryEntries.ts"
);

type DictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
};

async function parsePdf(buffer: Buffer): Promise<{ text: string; numpages?: number }> {
  const mod = require("pdf-parse");

  if (typeof mod === "function") return mod(buffer);
  if (typeof mod.default === "function") return mod.default(buffer);
  if (typeof mod.pdf === "function") return mod.pdf(buffer);

  if (typeof mod.PDFParse === "function") {
    const parser = new mod.PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy?.();

    return {
      text: result.text || "",
      numpages: result.total ?? result.numpages,
    };
  }

  throw new Error(`Unsupported pdf-parse export shape: ${Object.keys(mod).join(", ")}`);
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\r/g, "\n")
    .replace(/-\n/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanName(value: unknown) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value: unknown) {
  return cleanName(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function guessIsland(text: string) {
  const value = text.toLowerCase();

  if (value.includes("st. thomas") || value.includes("saint thomas")) return "stt";
  if (value.includes("st. john") || value.includes("saint john")) return "stj";
  if (value.includes("st. croix") || value.includes("saint croix")) return "stx";
  if (value.includes("water island")) return "wat";

  return null;
}

function guessQuarter(text: string) {
  const value = text.toUpperCase();

  const quarters = [
    "GREAT NORTHSIDE",
    "LITTLE NORTHSIDE",
    "FRENCHMAN BAY",
    "FRENCHMANS BAY",
    "CRUZ BAY",
    "CORAL BAY",
    "REEF BAY",
    "MAHO BAY",
    "REDHOOK",
    "EAST END",
    "EASTEND",
    "WEST END",
    "WESTEND",
    "NORTHSIDE",
    "SOUTHSIDE",
    "KRONPRINDSENS",
    "KONGENS",
    "DRONNINGENS",
    "COMPAGNIE",
    "COMPANY",
    "PRINCE",
    "QUEEN",
    "KING",
    "NEW",
  ];

  return quarters.find((quarter) => value.includes(quarter)) ?? null;
}

function isBadName(name: string) {
  const value = name.toUpperCase();

  if (!name || name.length < 2) return true;
  if (name.length > 90) return true;
  if (/^\d+$/.test(name)) return true;
  if (/^[A-Z]$/.test(name)) return true;
  if (value.includes("GEOGRAPHIC DICTIONARY")) return true;
  if (value.includes("VIRGIN ISLANDS")) return true;
  if (value.includes("GOVERNMENT PRINTING OFFICE")) return true;
  if (value.includes("ERRATA NOTICE")) return true;
  if (value.includes("PREFACE")) return true;
  if (value.includes("PRICE")) return true;
  if (name.length < 3) return true;
  if (name.length > 45) return true;
  if (/^[A-Z]\.?(\s|\d|$)/i.test(name)) return true;
  if (/\d{3,}/.test(name)) return true;
  if (/\bdispatching secretary\b/i.test(name)) return true;
  if (/\bnaval government affairs\b/i.test(name)) return true;
  if (/\bgovernment\b/i.test(name)) return true;
  if (/\bprinting\b/i.test(name)) return true;
  if (/\bpublication\b/i.test(name)) return true;
  if (/\bfigure\b/i.test(name)) return true;
  if (/\bplate\b/i.test(name)) return true;
  if (/\bpage\b/i.test(name)) return true;
  if (name.split(" ").length > 6) return true;

  return false;
}

function stripFrontMatter(text: string) {
  const markers = [
    "Aalborg",
    "Aalborg; ",
    "Aalborg:",
    "Adrian; ",
    "Annaberg; ",
  ];

  const lower = text.toLowerCase();

  for (const marker of markers) {
    const index = lower.indexOf(marker.toLowerCase());
    if (index > 0) return text.slice(index);
  }

  return text;
}

function splitDictionaryEntries(rawText: string): DictionaryEntry[] {
  const text = stripFrontMatter(cleanText(rawText));

  const entryStart = /(?:^|\n)([A-Z][A-Za-z0-9'()./& -]{2,45});\s+/g;
  const matches = [...text.matchAll(entryStart)];

  const entries: DictionaryEntry[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const next = matches[i + 1];

    const name = cleanName(match[1]);
    if (isBadName(name)) continue;

    const start = match.index ?? 0;
    const end = next?.index ?? text.length;
    const chunk = cleanText(text.slice(start, end).replace(/\n+/g, " "));

    if (chunk.length < 40) continue;
    if (/GEOGRAPHIC DICTIONARY|GOVERNMENT PRINTING OFFICE|ERRATA NOTICE/i.test(chunk.slice(0, 160))) {
      continue;
    }

    const normalizedName = normalizeName(name);

    entries.push({
      id: normalizedName || `entry-${entries.length + 1}`,
      sourceName: name,
      normalizedName,
      description: chunk,
      possibleIsland: guessIsland(chunk),
      possibleQuarter: guessQuarter(chunk),
    });
  }

  const deduped = new Map<string, DictionaryEntry>();

  for (const entry of entries) {
    const existing = deduped.get(entry.id);
    if (!existing || entry.description.length > existing.description.length) {
      deduped.set(entry.id, entry);
    }
  }

  return [...deduped.values()].sort((a, b) =>
    a.sourceName.localeCompare(b.sourceName)
  );
}

async function main() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const buffer = await fs.readFile(PDF_PATH);
  const parsed = await parsePdf(buffer);
  const rawText = cleanText(parsed.text);
  const entries = splitDictionaryEntries(rawText);

  await fs.writeFile(RAW_TEXT_OUT, rawText);
  await fs.writeFile(ENTRIES_JSON_OUT, JSON.stringify(entries, null, 2));

  await fs.writeFile(
    OUTPUT_TS,
    `export type GeographicDictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
};

export const geographicDictionaryEntries: GeographicDictionaryEntry[] = ${JSON.stringify(
      entries,
      null,
      2
    )};

export function getGeographicDictionaryEntryByName(name: string) {
  const key = name
    .replace(/^Estate\\s+/i, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return geographicDictionaryEntries.find((entry) => entry.normalizedName === key) ?? null;
}
`
  );

  console.log(`PDF: ${PDF_PATH}`);
  console.log(`Pages: ${parsed.numpages ?? "unknown"}`);
  console.log(`Raw text characters: ${rawText.length}`);
  console.log(`Clean dictionary entries: ${entries.length}`);
  console.log(`Wrote ${ENTRIES_JSON_OUT}`);
  console.log(`Wrote ${OUTPUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});