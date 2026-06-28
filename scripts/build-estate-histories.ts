#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";

const MATCHES_JSON = path.join(process.cwd(), "generated", "estate-dictionary-matches.json");
const OUTPUT_JSON = path.join(process.cwd(), "generated", "estate-history-enriched.json");
const OUTPUT_TS = path.join(process.cwd(), "src/data/estateHistories.ts");

const VERIFIED_CONFIDENCE = 100;

type MatchRecord = {
  geoid: string;
  estateName: string;
  island: string;
  quarter: string | null;
  quarterGroup: string | null;
  matched: boolean;
  confidence: number;
  dictionaryName: string | null;
  dictionaryType: string | null;
  dictionaryIsland: string | null;
  dictionaryQuarter: string | null;
  description: string | null;
};

function fallbackSummary(item: MatchRecord) {
  const quarter = item.quarter || item.quarterGroup || "Unknown Quarter";

  return `${item.estateName} is part of the historic estate geography of the U.S. Virgin Islands. It is associated with ${quarter}. This record currently contains mapped estate, island, quarter, and coordinate data. More archival detail can be added from maps, census records, deeds, Danish West Indies records, and local historical sources.`;
}

function cleanSummary(value: string | null) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function getReviewLabel(item: MatchRecord) {
  if (!item.matched || item.confidence <= 0) {
    return "Generated estate record";
  }

  if (item.confidence >= VERIFIED_CONFIDENCE) {
    return "Verified historical record";
  }

  return "Historical note — needs source review";
}

async function main() {
  const raw = await fs.readFile(MATCHES_JSON, "utf8");
  const parsed = JSON.parse(raw) as { matches: MatchRecord[] };

  const histories = parsed.matches.map((item) => {
    const verified = item.matched && item.confidence >= VERIFIED_CONFIDENCE;
    const needsReview = !verified;

    return {
      geoid: item.geoid,
      name: item.estateName,
      island: item.island,
      quarter: item.quarter || item.quarterGroup || null,
      source: item.matched
        ? "Geographic Dictionary of the Virgin Islands"
        : "Generated estate record",
      sourceName: item.dictionaryName,
      sourceType: item.dictionaryType,
      confidence: item.confidence,
      verified,
      needsReview,
      publicLabel: getReviewLabel(item),
      summary: item.description ? cleanSummary(item.description) : fallbackSummary(item),
      dictionaryDescription: item.description ? cleanSummary(item.description) : null,
    };
  });

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(histories, null, 2));

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
  publicLabel: string;
  summary: string;
  dictionaryDescription: string | null;
};

export const estateHistories: EstateHistoryRecord[] = ${JSON.stringify(histories, null, 2)};

export function getEstateHistoryByGeoid(geoid: string) {
  return estateHistories.find((history) => String(history.geoid) === String(geoid)) ?? null;
}
`
  );

  console.log(`Built ${histories.length} estate history records`);
  console.log(`Verified: ${histories.filter((item) => item.verified).length}`);
  console.log(`Needs review: ${histories.filter((item) => item.needsReview).length}`);
  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});