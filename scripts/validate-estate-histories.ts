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
const NORMALIZED_TS_OUT = path.join(
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

async function parsePdf(
  buffer: Buffer
): Promise<{ text: string; numpages?: number }> {
  const mod = require("pdf-parse");

  if (typeof mod === "function") return mod(buffer);
  if (typeof mod.default === "function") return mod.default(buffer);
  if (typeof mod.pdf === "function") return mod.pdf(buffer);

  if (typeof mod.PDFParse === "function") {
    const parser = new mod.PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy?.();

    return {
      text: result.text,
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
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanName(value: unknown) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/^Estate\s+/i, "")
    .replace(/[,.;:].*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: unknown) {
  return cleanName(value)
    .toLowerCase()
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

function splitDictionaryEntries(rawText: string): DictionaryEntry[] {
  const text = cleanText(rawText)
    .split("\n")
    .filter((line) => {
      const value = line.trim();

      if (!value) return false;
      if (/^GEOGRAPHIC/i.test(value)) return false;
      if (/DICTIONARY OF THE VIRGIN ISLANDS/i.test(value)) return false;
      if (/^\d+$/.test(value)) return false;
      if (/^[A-Z]$/.test(value)) return false;

      return true;
    })
    .join("\n");

  const entryStart =
    /(?:^|\n)([A-Z][A-Z'’()./& -]{2,80})[.,—-]\s+/g;

  const matches = [...text.matchAll(entryStart)];
  const entries: DictionaryEntry[] = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const next = matches[i + 1];

    const start = match.index ?? 0;
    const end = next?.index ?? text.length;

    const chunk = cleanText(text.slice(start, end));
    if (chunk.length < 80) continue;

    const sourceName = cleanName(match[1]);
    const normalizedName = normalizeKey(sourceName);

    if (!sourceName || sourceName.length < 2) continue;
    if (/GEOGRAPHIC|DICTIONARY|VIRGIN ISLANDS/i.test(sourceName)) continue;

    entries.push({
      id: normalizedName || `entry-${entries.length + 1}`,
      sourceName,
      normalizedName,
      description: chunk.replace(/\n+/g, " ").replace(/\s+/g, " "),
      possibleIsland: guessIsland(chunk),
      possibleQuarter: guessQuarter(chunk),
    });
  }

  return entries;
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
    NORMALIZED_TS_OUT,
    `export type GeographicDictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  possibleIsland: string | null;
  possibleQuarter: string | null;
};

export const geographicDictionaryEntries: GeographicDictionaryEntry[] = ${JSON.stringify(entries, null, 2)};

export function getGeographicDictionaryEntryByName(name: string) {
  const key = name
    .replace(/^Estate\\s+/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return geographicDictionaryEntries.find((entry) => entry.normalizedName === key) ?? null;
}
`
  );

  console.log(`PDF: ${PDF_PATH}`);
  console.log(`Pages: ${parsed.numpages ?? "unknown"}`);
  console.log(`Raw text characters: ${rawText.length}`);
  console.log(`Normalized entries: ${entries.length}`);
  console.log(`Wrote ${RAW_TEXT_OUT}`);
  console.log(`Wrote ${ENTRIES_JSON_OUT}`);
  console.log(`Wrote ${NORMALIZED_TS_OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});