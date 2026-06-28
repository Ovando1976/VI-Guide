#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { estates } from "../src/data/estates";
import { classifiedGeographicDictionaryEntries } from "../src/data/geographicDictionaryClassified";

const GENERATED_DIR = path.join(process.cwd(), "generated");
const OUTPUT_JSON = path.join(GENERATED_DIR, "estate-dictionary-matches.json");

const MIN_ACCEPT_SCORE = 70;

const GENERIC_NAMES = new Set([
  "estate",
  "point",
  "hill",
  "bay",
  "hope",
  "john",
  "brown",
  "retreat",
  "rock",
  "spring",
  "river",
  "grove",
  "king",
  "queen",
  "prince",
  "company",
  "northside",
  "southside",
  "eastend",
  "westend",
]);

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function key(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactKey(value: unknown) {
  return key(value).replace(/\s+/g, "");
}

function isGenericSourceName(name: unknown) {
  return GENERIC_NAMES.has(key(name));
}

function getEstateCandidates(estate: (typeof estates)[number]) {
  const candidates = new Set<string>();

  candidates.add(key(estate.name));

  if (Array.isArray(estate.aliases)) {
    for (const alias of estate.aliases) {
      const aliasKey = key(alias);
      if (aliasKey) candidates.add(aliasKey);
    }
  }

  const base = key(estate.name);
  if (base.includes(" and ")) {
    for (const part of base.split(" and ")) {
      if (part.trim().length >= 4) candidates.add(part.trim());
    }
  }

  if (base.includes(" ")) {
    const withoutDirectional = base
      .replace(/\beastern portion\b/g, "")
      .replace(/\bwestern portion\b/g, "")
      .replace(/\beast\b/g, "")
      .replace(/\bwest\b/g, "")
      .replace(/\bnorth\b/g, "")
      .replace(/\bsouth\b/g, "")
      .replace(/\ba\b$/g, "")
      .replace(/\bb\b$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (withoutDirectional.length >= 4) candidates.add(withoutDirectional);
  }

  return [...candidates].filter((candidate) => candidate.length >= 3);
}

function hasIslandAgreement(
  estate: (typeof estates)[number],
  entry: (typeof classifiedGeographicDictionaryEntries)[number]
) {
  return !entry.possibleIsland || entry.possibleIsland === estate.island;
}

function hasQuarterAgreement(
  estate: (typeof estates)[number],
  entry: (typeof classifiedGeographicDictionaryEntries)[number]
) {
  const estateQuarter = key(estate.quarterGroup || estate.quarter || "");
  const entryQuarter = key(entry.possibleQuarterGroup || entry.possibleQuarter || "");

  if (!estateQuarter || !entryQuarter) return false;

  return (
    estateQuarter === entryQuarter ||
    estateQuarter.includes(entryQuarter) ||
    entryQuarter.includes(estateQuarter)
  );
}

function scoreMatch(
  estate: (typeof estates)[number],
  entry: (typeof classifiedGeographicDictionaryEntries)[number]
) {
  const estateName = key(estate.name);
  const estateCompact = compactKey(estate.name);
  const entryName = key(entry.sourceName);
  const entryCompact = compactKey(entry.sourceName);
  const entryText = key(entry.description);

  if (!entryName || entryName.length < 3) return 0;

  if (isGenericSourceName(entryName) && entryName !== estateName) {
    return 0;
  }

  const candidates = getEstateCandidates(estate);

  let score = 0;

  for (const candidate of candidates) {
    const candidateCompact = candidate.replace(/\s+/g, "");

    if (entryName === candidate) score = Math.max(score, 130);
    if (entryCompact === candidateCompact) score = Math.max(score, 125);

    if (
      candidate.length >= 5 &&
      entryName.includes(candidate) &&
      !isGenericSourceName(entryName)
    ) {
      score = Math.max(score, 105);
    }

    if (
      entryName.length >= 5 &&
      candidate.includes(entryName) &&
      !isGenericSourceName(entryName)
    ) {
      score = Math.max(score, 90);
    }

    if (
      candidate.length >= 6 &&
      entryText.includes(candidate) &&
      !isGenericSourceName(entryName)
    ) {
      score = Math.max(score, 62);
    }
  }

  if (score === 0) return 0;

  if (entry.type === "estate") score += 14;
  if (entry.type !== "estate" && estateName !== entryName) score -= 12;

  if (hasIslandAgreement(estate, entry)) score += 10;
  else score -= 25;

  if (hasQuarterAgreement(estate, entry)) score += 8;

  if (estateCompact === entryCompact) score += 10;

  if (entryName.length <= 4 && estateName !== entryName) score -= 25;

  return Math.max(0, score);
}

function findBestMatch(estate: (typeof estates)[number]) {
  let best:
    | {
        score: number;
        entry: (typeof classifiedGeographicDictionaryEntries)[number];
      }
    | null = null;

  for (const entry of classifiedGeographicDictionaryEntries) {
    const score = scoreMatch(estate, entry);

    if (score < MIN_ACCEPT_SCORE) continue;

    if (!best || score > best.score) {
      best = { score, entry };
    }
  }

  return best;
}

async function main() {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const matches = estates.map((estate) => {
    const match = findBestMatch(estate);

    return {
      geoid: String(estate.geoid),
      estateName: clean(estate.name),
      island: estate.island,
      quarter: estate.quarter ?? null,
      quarterGroup: estate.quarterGroup ?? null,
      matched: Boolean(match),
      confidence: match?.score ?? 0,
      dictionaryEntryId: match?.entry.id ?? null,
      dictionaryName: match?.entry.sourceName ?? null,
      dictionaryType: match?.entry.type ?? null,
      dictionaryIsland: match?.entry.possibleIsland ?? null,
      dictionaryQuarter: match?.entry.possibleQuarter ?? null,
      dictionaryQuarterGroup: match?.entry.possibleQuarterGroup ?? null,
      description: match?.entry.description ?? null,
    };
  });

  const matched = matches.filter((item) => item.matched);
  const unmatchedEstates = matches.filter((item) => !item.matched);

  const usedEntryIds = new Set(matched.map((item) => item.dictionaryEntryId));

  const unmatchedDictionaryEntries = classifiedGeographicDictionaryEntries.filter(
    (entry) => !usedEntryIds.has(entry.id)
  );

  const output = {
    generatedAt: new Date().toISOString(),
    totalEstates: estates.length,
    matchedCount: matched.length,
    unmatchedEstateCount: unmatchedEstates.length,
    unmatchedDictionaryEntryCount: unmatchedDictionaryEntries.length,
    matches,
    unmatchedEstates,
    unmatchedDictionaryEntries,
  };

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(output, null, 2));

  console.log(`Total estates: ${estates.length}`);
  console.log(`Matched estates: ${matched.length}`);
  console.log(`Unmatched estates: ${unmatchedEstates.length}`);
  console.log(`Unmatched dictionary entries: ${unmatchedDictionaryEntries.length}`);
  console.log(`Wrote ${OUTPUT_JSON}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});