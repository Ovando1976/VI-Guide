#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { estates } from "../src/data/estates";

const require = createRequire(import.meta.url);

const PDF_PATH =
  process.env.PDF_PATH ||
  path.join(process.cwd(), "docs/sources/geographic-dictionary-virgin-islands-1925.pdf");

const GENERATED_DIR = path.join(process.cwd(), "generated");
const RAW_TEXT_OUT = path.join(GENERATED_DIR, "geographic-dictionary.raw.txt");
const REVIEW_OUT = path.join(GENERATED_DIR, "estate-history-review.json");
const OUTPUT_JSON = path.join(GENERATED_DIR, "estate-history-enriched.json");
const OUTPUT_TS = path.join(process.cwd(), "src/data/estateHistories.ts");

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

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\r/g, "\n")
    .replace(/-\n/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanEstateName(value: unknown) {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function key(value: unknown) {
  return cleanEstateName(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextForSearch(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9\n]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n");
}

function islandLabel(value: string) {
  if (value === "stt") return "St. Thomas";
  if (value === "stj") return "St. John";
  if (value === "stx") return "St. Croix";
  if (value === "wat") return "Water Island";
  return "U.S. Virgin Islands";
}

function extractWindow(rawText: string, normalizedRaw: string, searchTerm: string) {
  const normalizedTerm = key(searchTerm);
  if (!normalizedTerm || normalizedTerm.length < 3) return null;

  const index = normalizedRaw.indexOf(normalizedTerm);
  if (index < 0) return null;

  const start = Math.max(0, index - 900);
  const end = Math.min(rawText.length, index + 2200);

  return clean(rawText.slice(start, end).replace(/\n+/g, " "));
}

function getCandidateNames(estate: (typeof estates)[number]) {
  const names = new Set<string>();

  names.add(cleanEstateName(estate.name));

  if (Array.isArray(estate.aliases)) {
    for (const alias of estate.aliases) {
      names.add(cleanEstateName(alias));
    }
  }

  const base = cleanEstateName(estate.name);
  if (base.includes("/")) {
    for (const part of base.split("/")) names.add(cleanEstateName(part));
  }

  return [...names].filter((name) => key(name).length >= 3);
}

function scoreCandidate(
  estate: (typeof estates)[number],
  candidate: string,
  windowText: string | null
) {
  if (!windowText) return 0;

  const text = key(windowText);
  const candidateKey = key(candidate);
  const estateNameKey = key(estate.name);
  const quarterKey = key(estate.quarter ?? estate.quarterGroup ?? "");
  const island = String(estate.island);

  let score = 0;

  if (text.includes(candidateKey)) score += 70;
  if (candidateKey === estateNameKey) score += 25;
  if (text.includes("estate")) score += 15;
  if (text.includes("plantation")) score += 10;
  if (quarterKey && text.includes(quarterKey)) score += 10;

  if (island === "stt" && (text.includes("st thomas") || text.includes("saint thomas"))) score += 10;
  if (island === "stj" && (text.includes("st john") || text.includes("saint john"))) score += 10;
  if (island === "stx" && (text.includes("st croix") || text.includes("saint croix"))) score += 10;
  if (island === "wat" && text.includes("water island")) score += 10;

  if (/geographic dictionary of the virgin islands/i.test(windowText.slice(0, 120))) score -= 25;

  return score;
}

function fallbackSummary(estate: (typeof estates)[number]) {
  const title = cleanEstateName(estate.name);
  const quarter = estate.quarter || estate.quarterGroup || "Unknown Quarter";

  return `${title} is part of the historic estate geography of the U.S. Virgin Islands. It is associated with ${quarter} on ${islandLabel(String(estate.island))}. This record currently contains mapped estate, island, quarter, and coordinate data. More archival detail can be added from maps, census records, deeds, Danish West Indies records, and local historical sources.`;
}

async function main() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const buffer = await fs.readFile(PDF_PATH);
  const parsed = await parsePdf(buffer);

  const rawText = clean(parsed.text);
  const normalizedRaw = normalizeTextForSearch(rawText);

  await fs.writeFile(RAW_TEXT_OUT, rawText);

  const histories = estates.map((estate) => {
    const title = cleanEstateName(estate.name);
    const candidates = getCandidateNames(estate);

    let best: {
      candidate: string;
      summary: string;
      confidence: number;
    } | null = null;

    for (const candidate of candidates) {
      const windowText = extractWindow(rawText, normalizedRaw, candidate);
      const confidence = scoreCandidate(estate, candidate, windowText);

      if (windowText && (!best || confidence > best.confidence)) {
        best = {
          candidate,
          summary: windowText,
          confidence,
        };
      }
    }

    const accepted = Boolean(best && best.confidence >= 80);

    return {
      geoid: String(estate.geoid),
      name: title,
      island: estate.island,
      quarter: estate.quarter ?? estate.quarterGroup ?? null,
      source: accepted
        ? "Geographic Dictionary of the Virgin Islands"
        : "Generated estate record",
      sourceName: accepted ? best?.candidate ?? null : null,
      sourceType: accepted ? "pdf-text-window" : null,
      confidence: accepted ? best?.confidence ?? 0 : 0,
      verified: accepted && (best?.confidence ?? 0) >= 110,
      needsReview: !accepted || (best?.confidence ?? 0) < 110,
      summary: accepted ? best!.summary : fallbackSummary(estate),
      dictionaryDescription: accepted ? best!.summary : null,
    };
  });

  const review = histories.map((history) => ({
    geoid: history.geoid,
    name: history.name,
    island: history.island,
    quarter: history.quarter,
    sourceName: history.sourceName,
    confidence: history.confidence,
    verified: history.verified,
    needsReview: history.needsReview,
    preview: history.summary.slice(0, 280),
  }));

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(histories, null, 2));
  await fs.writeFile(REVIEW_OUT, JSON.stringify(review, null, 2));

  await fs.writeFile(
    OUTPUT_TS,
    `export type EstateHistoryRecord = {
  geoid: string;
  name: string;
  island: string;
  quarter: string | null;
  source: string;
  sourceName: string | null;
  sourceType: string | null;
  confidence: number;
  verified: boolean;
  needsReview: boolean;
  summary: string;
  dictionaryDescription: string | null;
};

export const estateHistories: EstateHistoryRecord[] = ${JSON.stringify(histories, null, 2)};

export function getEstateHistoryByGeoid(geoid: string) {
  return estateHistories.find((history) => String(history.geoid) === String(geoid)) ?? null;
}
`
  );

  console.log(`PDF: ${PDF_PATH}`);
  console.log(`Pages: ${parsed.numpages ?? "unknown"}`);
  console.log(`Raw text characters: ${rawText.length}`);
  console.log(`Built ${histories.length} estate histories`);
  console.log(`PDF accepted: ${histories.filter((h) => h.source !== "Generated estate record").length}`);
  console.log(`Verified: ${histories.filter((h) => h.verified).length}`);
  console.log(`Needs review: ${histories.filter((h) => h.needsReview).length}`);
  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${REVIEW_OUT}`);
  console.log(`Wrote ${OUTPUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});