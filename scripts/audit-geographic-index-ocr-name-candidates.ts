// @ts-nocheck

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island" | "";

type Coord = {
  lat: number;
  lng: number;
};

const ROOT = process.cwd();

const REPORT_IN = path.join(ROOT, "reports/data-cleanliness-report.json");
const REPORT_OUT = path.join(ROOT, "reports/geographic-index-ocr-name-candidates.json");

const SOURCE_FILES = [
  "public/geo/usvi-estates.geojson",
  "public/data/usvi-estates.geojson",
  "public/geo/usvi-parcels.geojson",
  "public/data/usvi-parcels.geojson",
].map((file) => path.join(ROOT, file));

const MANUAL_NAME_CORRECTIONS: Record<string, string[]> = {
  "Beaehing Spit": ["Beeching Spit", "Beaching Spit"],
  "Blg Faat Cay": ["Big Flat Cay"],
  "Blp Fountain": ["Fountain"],
  "Bonne EspBrance": ["Bonne Esperance"],
  "Bonne EspBrance Road": ["Bonne Esperance Road"],
  "BoPcks Creek": ["Bucks Creek", "Buck Creek"],
  "BtaZley Point": ["Butler Point", "Botany Point"],
  "CaZverts Punt": ["Calverts Point", "Calvert Point"],
  "Cehterline Road": ["Centerline Road"],
  "Chrietiunsfort": ["Christiansfort", "Christian's Fort", "Fort Christiansværn"],
  "Christinn's Fort": ["Christian's Fort", "Christiansfort", "Fort Christiansværn"],
  "Conoordia": ["Concordia"],
  "ConstitutlonhUZ": ["Constitution Hill"],
  "Coterado P d n t": ["Colorado Point", "Coterado Point"],
  "Cottongarden": ["Cotton Garden"],
  "CahrZtaberg": ["Cabritaberg", "Cabriteberg"],
  "Cabriteberg P o C t": ["Cabriteberg Point"],
  "Caetelpolnt": ["Castle Point"],
  "Ceeeman HiZZ": ["Cinnamon Hill"],
  "Cfroen ICny": ["Crown Bay"],
  "Ch'rlstianeted'": ["Christiansted"],
  "ChUU88On": ["Clifton", "Clairmont"],
  "Curha Mmntaln": ["Cumba Mountain"],
  "Dolly Efl1": ["Dolly Hill"],
  "Dry Lcdqc": ["Dry Lodge"],
};

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeIsland(value: unknown): IslandCode {
  const text = stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!text) return "";

  if (["stt", "st thomas", "saint thomas", "thomas"].includes(text)) return "st_thomas";
  if (["stj", "st john", "saint john", "john"].includes(text)) return "st_john";
  if (["stx", "st croix", "saint croix", "croix"].includes(text)) return "st_croix";
  if (["wat", "water island", "water_island"].includes(text)) return "water_island";

  if (text.includes("st thomas") || text.includes("saint thomas")) return "st_thomas";
  if (text.includes("st john") || text.includes("saint john")) return "st_john";
  if (text.includes("st croix") || text.includes("saint croix")) return "st_croix";
  if (text.includes("water island")) return "water_island";

  return "";
}

function inferIslandFromCoordinates(coord: Coord): IslandCode {
  const { lat, lng } = coord;

  if (lat < 18) return "st_croix";
  if (lat >= 18 && lng > -64.86) return "st_john";
  if (lat >= 18 && lng <= -64.86) return "st_thomas";

  return "";
}

function normalizeName(value: string): string {
  return stripDiacritics(value)
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bst\.\b/g, "st")
    .replace(/\bsaint\b/g, "st")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalName(value: string): string {
  return normalizeName(value)
    .replace(/\bthe\b/g, " ")
    .replace(/\bestate\b/g, " ")
    .replace(/\bestates\b/g, " ")
    .replace(/\bplantation\b/g, " ")
    .replace(/\bquarter\b/g, " ")
    .replace(/\bst croix\b/g, " ")
    .replace(/\bst thomas\b/g, " ")
    .replace(/\bst john\b/g, " ")
    .replace(/\bwater island\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string): string {
  return canonicalName(value).replace(/\s+/g, "");
}

function tokens(value: string): string[] {
  return canonicalName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const left = compact(a);
  const right = compact(b);

  if (!left || !right) return 0;

  const distance = levenshtein(left, right);
  const maxLen = Math.max(left.length, right.length);

  return 1 - distance / maxLen;
}

function tokenOverlap(a: string, b: string): number {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  if (!left.size || !right.size) return 0;

  let intersection = 0;

  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }

  const union = new Set([...left, ...right]).size;

  return intersection / union;
}

function collectCoordinatePairs(value: unknown, pairs: Array<[number, number]> = []) {
  if (!Array.isArray(value)) return pairs;

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    const lng = value[0];
    const lat = value[1];

    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= 17 &&
      lat <= 19 &&
      lng >= -66 &&
      lng <= -64
    ) {
      pairs.push([lng, lat]);
    }

    return pairs;
  }

  for (const child of value) {
    collectCoordinatePairs(child, pairs);
  }

  return pairs;
}

function centroidFromGeometry(geometry: any): Coord | null {
  if (!geometry) return null;

  const pairs = collectCoordinatePairs(geometry.coordinates);

  if (!pairs.length) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of pairs) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    lat: Number(((minLat + maxLat) / 2).toFixed(6)),
    lng: Number(((minLng + maxLng) / 2).toFixed(6)),
  };
}

function getFeatureNames(properties: Record<string, unknown>): string[] {
  const keys = [
    "name",
    "Name",
    "NAME",
    "estate",
    "Estate",
    "ESTATE",
    "fullName",
    "FullName",
    "FULL_NAME",
    "label",
    "Label",
    "LABEL",
    "displayName",
    "DisplayName",
    "MAPNAME",
    "MAP_NAME",
    "QUARTER",
    "quarter",
  ];

  const names = new Set<string>();

  for (const key of keys) {
    const value = asText(properties[key]);
    if (value) names.add(value);
  }

  const estate = asText(properties.ESTATE) || asText(properties.estate);
  if (estate) {
    names.add(estate);
    names.add(`Estate ${estate}`);
    names.add(`${estate} Estate`);
  }

  return [...names];
}

function inferFeatureIsland(properties: Record<string, unknown>, coordinates: Coord): IslandCode {
  const keys = [
    "island",
    "Island",
    "ISLAND",
    "islandCode",
    "IslandCode",
    "ISLAND_CODE",
    "territory",
    "Territory",
    "TERRITORY",
  ];

  for (const key of keys) {
    const island = normalizeIsland(properties[key]);
    if (island) return island;
  }

  return inferIslandFromCoordinates(coordinates);
}

function readSourceCandidates() {
  const candidates = [];

  for (const sourcePath of SOURCE_FILES) {
    if (!existsSync(sourcePath)) continue;

    const sourceFile = path.relative(ROOT, sourcePath);
    const raw = JSON.parse(readFileSync(sourcePath, "utf8"));
    const features = Array.isArray(raw.features) ? raw.features : [];

    for (let sourceIndex = 0; sourceIndex < features.length; sourceIndex += 1) {
      const feature = features[sourceIndex];
      const properties = feature?.properties || {};
      const coordinates = centroidFromGeometry(feature?.geometry);

      if (!coordinates) continue;

      const sourceIsland = inferFeatureIsland(properties, coordinates);

      for (const sourceName of getFeatureNames(properties)) {
        candidates.push({
          sourceFile,
          sourceIndex,
          sourceName,
          sourceIsland,
          coordinates,
          properties,
          canonicalName: canonicalName(sourceName),
        });
      }
    }
  }

  return candidates;
}

function getRecordIsland(record: any, issue: any): IslandCode {
  return (
    normalizeIsland(record?.island) ||
    normalizeIsland(record?.islandCode) ||
    normalizeIsland(issue?.island) ||
    normalizeIsland(issue?.name || record?.name || record?.title || "")
  );
}

function hasCoordinates(record: any) {
  if (typeof record?.lat === "number" && typeof record?.lng === "number") return true;

  if (
    typeof record?.coordinates?.lat === "number" &&
    typeof record?.coordinates?.lng === "number"
  ) {
    return true;
  }

  if (
    typeof record?.center?.lat === "number" &&
    typeof record?.center?.lng === "number"
  ) {
    return true;
  }

  if (
    typeof record?.centroid?.lat === "number" &&
    typeof record?.centroid?.lng === "number"
  ) {
    return true;
  }

  return Boolean(record?.geometry);
}

function generatedHeuristicNames(name: string): string[] {
  const guesses = new Set<string>();

  const cleaned = name
    .replace(/Z/g, "l")
    .replace(/ZZ/g, "ll")
    .replace(/P o C t/gi, "Point")
    .replace(/P d n t/gi, "Point")
    .replace(/Punt/gi, "Point")
    .replace(/polnt/gi, "point")
    .replace(/HiZZ/gi, "Hill")
    .replace(/Mmntaln/gi, "Mountain")
    .replace(/Efl1/gi, "Hill")
    .replace(/ICny/gi, "Bay")
    .replace(/d u/gi, "du")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned && cleaned !== name) guesses.add(cleaned);

  const normalizedSpacing = name
    .replace(/\bCanebay\b/gi, "Cane Bay")
    .replace(/\bCanegarden\b/gi, "Cane Garden")
    .replace(/\bCanevalley\b/gi, "Cane Valley")
    .replace(/\bBotanybay\b/gi, "Botany Bay")
    .replace(/\bCaretbay\b/gi, "Caret Bay")
    .replace(/\bCliftonhill\b/gi, "Clifton Hill")
    .replace(/\bCornhill\b/gi, "Corn Hill")
    .replace(/\bCottongarden\b/gi, "Cotton Garden")
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedSpacing && normalizedSpacing !== name) guesses.add(normalizedSpacing);

  return [...guesses];
}

function candidateNamesForRecord(name: string): string[] {
  return [
    name,
    ...(MANUAL_NAME_CORRECTIONS[name] || []),
    ...generatedHeuristicNames(name),
  ];
}

function scoreNameAgainstSource(candidateName: string, sourceName: string) {
  const canonCandidate = canonicalName(candidateName);
  const canonSource = canonicalName(sourceName);

  if (!canonCandidate || !canonSource) {
    return { score: 0, reason: "empty" };
  }

  if (canonCandidate === canonSource) {
    return { score: 1, reason: "canonical_exact_after_correction" };
  }

  if (compact(candidateName) === compact(sourceName)) {
    return { score: 0.97, reason: "compact_exact_after_correction" };
  }

  const sim = similarity(candidateName, sourceName);
  const overlap = tokenOverlap(candidateName, sourceName);
  const score = Math.max(sim, overlap);

  if (score >= 0.9) return { score, reason: "high_similarity" };
  if (score >= 0.82) return { score, reason: "review_similarity" };

  return { score, reason: "weak_similarity" };
}

function confidenceFromScore(score: number, wasCorrected: boolean) {
  if (score >= 0.99 && wasCorrected) return "strong_correction";
  if (score >= 0.97 && wasCorrected) return "strong_correction";
  if (score >= 0.9 && wasCorrected) return "review";
  if (score >= 0.82 && wasCorrected) return "review";
  if (score >= 0.97) return "already_match";
  if (score > 0) return "weak";
  return "none";
}

function main() {
  if (!existsSync(REPORT_IN)) {
    throw new Error(`Missing report: ${REPORT_IN}`);
  }

  mkdirSync(path.join(ROOT, "reports"), { recursive: true });

  const cleanlinessReport = JSON.parse(readFileSync(REPORT_IN, "utf8"));
  const sourceCandidates = readSourceCandidates();

  const sampledMissingIssues = cleanlinessReport.issues.filter(
    (issue: any) =>
      issue.source === "geographic_index" &&
      issue.issue === "missing_coordinates"
  );

  const proposals = sampledMissingIssues.map((issue: any) => {
    const record = geographicIndex[issue.index] || {};
    const name = issue.name || record.name || record.title || "";
    const recordIsland = getRecordIsland(record, issue);
    const namesToTry = candidateNamesForRecord(name);

    const scored = [];

    for (const candidateName of namesToTry) {
      const wasCorrected = candidateName !== name;

      for (const source of sourceCandidates) {
        if (
          recordIsland &&
          source.sourceIsland &&
          recordIsland !== source.sourceIsland
        ) {
          continue;
        }

        const result = scoreNameAgainstSource(candidateName, source.sourceName);

        if (result.score <= 0) continue;

        scored.push({
          originalName: name,
          proposedName: candidateName,
          wasCorrected,
          sourceName: source.sourceName,
          sourceIsland: source.sourceIsland,
          sourceFile: source.sourceFile,
          sourceIndex: source.sourceIndex,
          coordinates: source.coordinates,
          score: Number(result.score.toFixed(3)),
          reason: result.reason,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    return {
      index: issue.index,
      originalName: name,
      type: record.type || record.kind || record.featureType || "",
      island: recordIsland,
      existingCoordinates: hasCoordinates(record),
      confidence: confidenceFromScore(best?.score || 0, Boolean(best?.wasCorrected)),
      bestScore: best?.score || 0,
      bestMatch: best || null,
      alternatives: scored.slice(1, 6),
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    sampledMissingIssues: sampledMissingIssues.length,
    sourceCandidates: sourceCandidates.length,
    confidenceTotals: proposals.reduce((acc: Record<string, number>, item) => {
      acc[item.confidence] = (acc[item.confidence] || 0) + 1;
      return acc;
    }, {}),
  };

  writeFileSync(
    REPORT_OUT,
    JSON.stringify(
      {
        summary,
        proposals,
      },
      null,
      2
    )
  );

  console.log("Geographic OCR/name candidate audit complete.");
  console.log(`Report: ${path.relative(ROOT, REPORT_OUT)}`);
  console.table(summary.confidenceTotals);

  console.log("\nStrong correction candidates:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "strong_correction")
      .map((proposal) => ({
        index: proposal.index,
        original: proposal.originalName,
        proposed: proposal.bestMatch?.proposedName,
        island: proposal.island,
        match: proposal.bestMatch?.sourceName,
        sourceIsland: proposal.bestMatch?.sourceIsland,
        score: proposal.bestScore,
        lat: proposal.bestMatch?.coordinates.lat,
        lng: proposal.bestMatch?.coordinates.lng,
      }))
  );

  console.log("\nReview candidates:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "review")
      .slice(0, 80)
      .map((proposal) => ({
        index: proposal.index,
        original: proposal.originalName,
        proposed: proposal.bestMatch?.proposedName,
        island: proposal.island,
        match: proposal.bestMatch?.sourceName,
        sourceIsland: proposal.bestMatch?.sourceIsland,
        score: proposal.bestScore,
      }))
  );
}

main();
