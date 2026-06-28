#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { estates } from "../src/data/estates";

const MATCHES_JSON = path.join(
  process.cwd(),
  "generated",
  "estate-dictionary-matches.json"
);

const OUT_JSON = path.join(
  process.cwd(),
  "generated",
  "unmatched-dictionary-analysis.json"
);

const OUT_REVIEW_JSON = path.join(
  process.cwd(),
  "generated",
  "unmatched-dictionary-review.json"
);

const MIN_CANDIDATE_SCORE = 60;
const MIN_AUTO_SUGGEST_SCORE = 100;

type DictionaryEntry = {
  id: string;
  sourceName: string;
  normalizedName: string;
  description: string;
  type?: string;
  possibleIsland?: string | null;
  possibleQuarter?: string | null;
  possibleQuarterGroup?: string | null;
};

type Candidate = {
  estateGeoid: string;
  estateName: string;
  island: string;
  quarter: string | null;
  quarterGroup: string | null;
  score: number;
  strongNameMatch: boolean;
  reasons: string[];
};

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

function classifyEntry(entry: DictionaryEntry) {
  const text = key(`${entry.sourceName} ${entry.description}`);

  if (/\bestate\b|\bplantage\b|\bplantation\b/.test(text)) return "estate";
  if (/\bquarter\b|\bdistrict\b/.test(text)) return "quarter";
  if (/\bbay\b|\bcove\b|\bharbor\b|\bharbour\b|\binlet\b/.test(text)) return "bay";
  if (/\bhill\b|\bmount\b|\bmountain\b|\bpeak\b|\bridge\b/.test(text)) return "hill";
  if (/\bcay\b|\bkey\b|\bisland\b|\bislet\b/.test(text)) return "cay_or_island";
  if (/\bpoint\b|\bhead\b|\bbluff\b|\bpeninsula\b/.test(text)) return "point";
  if (/\bgut\b|\bstream\b|\bcreek\b|\briver\b/.test(text)) return "gut_or_stream";
  if (/\broad\b|\broute\b|\bpath\b|\btrail\b/.test(text)) return "road";
  if (/\bvillage\b|\bsettlement\b|\btown\b|\bpost office\b/.test(text)) return "settlement";

  return entry.type || "unknown";
}

function estateCandidateNames(estate: (typeof estates)[number]) {
  const names = new Set<string>();
  const base = key(estate.name);

  if (base) names.add(base);

  if (Array.isArray(estate.aliases)) {
    for (const alias of estate.aliases) {
      const aliasKey = key(alias);
      if (aliasKey.length >= 3) names.add(aliasKey);
    }
  }

  for (const part of base.split(" and ")) {
    if (part.length >= 4) names.add(part);
  }

  return [...names].filter(Boolean);
}

function hasStrongNameMatch(reasons: string[]) {
  return (
    reasons.includes("exact entry name") ||
    reasons.includes("entry name contains estate name") ||
    reasons.includes("estate name contains entry name")
  );
}

function scoreEstate(
  entry: DictionaryEntry,
  estate: (typeof estates)[number]
): Candidate {
  const entryName = key(entry.sourceName);
  const entryText = key(entry.description);
  const entryAll = `${entryName} ${entryText}`;
  const estateNames = estateCandidateNames(estate);

  let score = 0;
  const reasons: string[] = [];

  for (const estateName of estateNames) {
    if (!estateName) continue;

    if (entryName === estateName) {
      score += 140;
      reasons.push("exact entry name");
    }

    if (
      estateName.length >= 5 &&
      entryName.includes(estateName) &&
      entryName !== estateName
    ) {
      score += 95;
      reasons.push("entry name contains estate name");
    }

    if (
      entryName.length >= 5 &&
      estateName.includes(entryName) &&
      entryName !== estateName
    ) {
      score += 85;
      reasons.push("estate name contains entry name");
    }

    if (estateName.length >= 5 && entryText.includes(estateName)) {
      score += 25;
      reasons.push("description mentions estate");
    }
  }

  const estateQuarter = key(estate.quarterGroup || estate.quarter || "");
  const entryQuarter = key(
    entry.possibleQuarterGroup || entry.possibleQuarter || ""
  );

  if (entry.possibleIsland && entry.possibleIsland === estate.island) {
    score += 20;
    reasons.push("same island");
  }

  if (entry.possibleIsland && entry.possibleIsland !== estate.island) {
    score -= 45;
    reasons.push("different island penalty");
  }

  if (
    estateQuarter &&
    entryQuarter &&
    (estateQuarter === entryQuarter ||
      estateQuarter.includes(entryQuarter) ||
      entryQuarter.includes(estateQuarter))
  ) {
    score += 20;
    reasons.push("quarter agreement");
  }

  if (estateQuarter && entryAll.includes(estateQuarter)) {
    score += 12;
    reasons.push("description references estate quarter");
  }

  const uniqueReasons = [...new Set(reasons)];
  const strongNameMatch = hasStrongNameMatch(uniqueReasons);

  if (!strongNameMatch && uniqueReasons.includes("description mentions estate")) {
    score = Math.min(score, 95);
  }

  return {
    estateGeoid: String(estate.geoid),
    estateName: clean(estate.name),
    island: estate.island,
    quarter: estate.quarter ?? null,
    quarterGroup: estate.quarterGroup ?? null,
    score: Math.max(0, score),
    strongNameMatch,
    reasons: uniqueReasons,
  };
}

async function main() {
  const raw = await fs.readFile(MATCHES_JSON, "utf8");
  const parsed = JSON.parse(raw) as {
    unmatchedDictionaryEntries: DictionaryEntry[];
  };

  const analysis = parsed.unmatchedDictionaryEntries.map((entry) => {
    const inferredType = classifyEntry(entry);

    const candidates = estates
      .map((estate) => scoreEstate(entry, estate))
      .filter((candidate) => candidate.score >= MIN_CANDIDATE_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const best = candidates[0] ?? null;

    const suggested =
      best &&
      best.score >= MIN_AUTO_SUGGEST_SCORE &&
      best.strongNameMatch
        ? best
        : null;

    return {
      entryId: entry.id,
      sourceName: entry.sourceName,
      normalizedName: entry.normalizedName,
      inferredType,
      dictionaryType: entry.type ?? null,
      possibleIsland: entry.possibleIsland ?? null,
      possibleQuarter: entry.possibleQuarter ?? null,
      possibleQuarterGroup: entry.possibleQuarterGroup ?? null,
      description: entry.description,
      bestCandidate: best,
      candidates,
      suggestedEstateGeoid: suggested?.estateGeoid ?? null,
      suggestedEstateName: suggested?.estateName ?? null,
      suggestedScore: suggested?.score ?? 0,
      suggestedReasons: suggested?.reasons ?? [],
      needsHumanReview: !suggested,
    };
  });

  const review = analysis.filter(
    (item) =>
      item.suggestedEstateGeoid ||
      item.candidates.length > 0 ||
      item.inferredType !== "unknown"
  );

  await fs.writeFile(OUT_JSON, JSON.stringify(analysis, null, 2));
  await fs.writeFile(OUT_REVIEW_JSON, JSON.stringify(review, null, 2));

  console.log(`Unmatched dictionary entries analyzed: ${analysis.length}`);
  console.log(`Entries with review signal: ${review.length}`);
  console.log(
    `Suggested strong estate links: ${
      analysis.filter((item) => item.suggestedEstateGeoid).length
    }`
  );
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_REVIEW_JSON}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});