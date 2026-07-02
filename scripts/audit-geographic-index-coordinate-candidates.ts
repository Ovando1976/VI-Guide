// @ts-nocheck

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island" | "";

type Coord = {
  lat: number;
  lng: number;
};

type SourceCandidate = {
  sourceFile: string;
  sourceIndex: number;
  sourceName: string;
  normalizedName: string;
  canonicalName: string;
  island: IslandCode;
  coordinates: Coord;
  properties: Record<string, unknown>;
};

type Proposal = {
  index: number;
  name: string;
  type?: string;
  island?: IslandCode;
  issue: string;
  bestScore: number;
  confidence: "exact" | "strong" | "review" | "weak" | "none";
  bestMatch?: {
    sourceFile: string;
    sourceIndex: number;
    sourceName: string;
    sourceIsland: IslandCode;
    coordinates: Coord;
    score: number;
    reason: string;
  };
  alternatives: Array<{
    sourceFile: string;
    sourceIndex: number;
    sourceName: string;
    sourceIsland: IslandCode;
    coordinates: Coord;
    score: number;
    reason: string;
  }>;
};

const ROOT = process.cwd();

const REPORT_IN = path.join(ROOT, "reports/data-cleanliness-report.json");
const REPORT_OUT = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates.json"
);

const SOURCE_FILES = [
  "public/geo/usvi-estates.geojson",
  "public/data/usvi-estates.geojson",
  "public/geo/usvi-parcels.geojson",
  "public/data/usvi-parcels.geojson",
].map((file) => path.join(ROOT, file));

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

  if (
    text === "stt" ||
    text === "st thomas" ||
    text === "saint thomas" ||
    text === "thomas"
  ) {
    return "st_thomas";
  }

  if (
    text === "stj" ||
    text === "st john" ||
    text === "saint john" ||
    text === "john"
  ) {
    return "st_john";
  }

  if (
    text === "stx" ||
    text === "st croix" ||
    text === "saint croix" ||
    text === "croix"
  ) {
    return "st_croix";
  }

  if (
    text === "wat" ||
    text === "water island" ||
    text === "water_island"
  ) {
    return "water_island";
  }

  if (text.includes("st thomas") || text.includes("saint thomas")) {
    return "st_thomas";
  }

  if (text.includes("st john") || text.includes("saint john")) {
    return "st_john";
  }

  if (text.includes("st croix") || text.includes("saint croix")) {
    return "st_croix";
  }

  if (text.includes("water island")) {
    return "water_island";
  }

  return "";
}

function inferIslandFromName(name: string): IslandCode {
  return normalizeIsland(name);
}

function inferIslandFromCoordinates(coord: Coord): IslandCode {
  const { lat, lng } = coord;

  if (lat < 18) return "st_croix";

  if (lat >= 18 && lng > -64.86) return "st_john";

  if (lat >= 18 && lng <= -64.86) return "st_thomas";

  return "";
}

function inferFeatureIsland(
  properties: Record<string, unknown>,
  coordinates: Coord
): IslandCode {
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

function tokens(value: string): string[] {
  return canonicalName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function tokenScore(a: string, b: string): number {
  const aTokens = new Set(tokens(a));
  const bTokens = new Set(tokens(b));

  if (!aTokens.size || !bTokens.size) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  const union = new Set([...aTokens, ...bTokens]).size;
  return intersection / union;
}

function compact(value: string): string {
  return canonicalName(value).replace(/\s+/g, "");
}

function isTooGeneric(value: string): boolean {
  const canon = canonicalName(value);
  const parts = tokens(value);

  if (!canon) return true;

  if (
    [
      "bay",
      "point",
      "hill",
      "road",
      "gut",
      "estate",
      "plantation",
      "battery",
      "channel",
      "valley",
      "mountain",
      "mountains",
      "spring",
      "creek",
      "cay",
      "rock",
    ].includes(canon)
  ) {
    return true;
  }

  return parts.length === 1 && parts[0].length <= 3;
}

function scoreNames(left: string, right: string): { score: number; reason: string } {
  const leftNorm = normalizeName(left);
  const rightNorm = normalizeName(right);
  const leftCanon = canonicalName(left);
  const rightCanon = canonicalName(right);

  if (!leftNorm || !rightNorm) {
    return { score: 0, reason: "empty_name" };
  }

  if (isTooGeneric(left) || isTooGeneric(right)) {
    return { score: 0, reason: "too_generic" };
  }

  if (leftNorm === rightNorm) {
    return { score: 1, reason: "normalized_exact" };
  }

  if (leftCanon && leftCanon === rightCanon) {
    return { score: 0.97, reason: "canonical_exact" };
  }

  if (compact(left) && compact(left) === compact(right)) {
    return { score: 0.94, reason: "compact_canonical_exact" };
  }

  const tScore = tokenScore(left, right);

  if (tScore >= 0.8) {
    return { score: tScore, reason: "token_overlap" };
  }

  const leftTokens = tokens(left);
  const rightTokens = tokens(right);

  if (
    leftCanon.length >= 7 &&
    rightCanon.length >= 7 &&
    leftTokens.length >= 2 &&
    rightTokens.length >= 2 &&
    (leftCanon.includes(rightCanon) || rightCanon.includes(leftCanon))
  ) {
    return { score: 0.72, reason: "canonical_contains_review_only" };
  }

  return { score: tScore, reason: "weak_token_overlap" };
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

function readSourceCandidates(): SourceCandidate[] {
  const candidates: SourceCandidate[] = [];

  for (const sourcePath of SOURCE_FILES) {
    if (!existsSync(sourcePath)) continue;

    const sourceFile = path.relative(ROOT, sourcePath);
    const raw = JSON.parse(readFileSync(sourcePath, "utf8"));
    const features = Array.isArray(raw.features) ? raw.features : [];

    for (let index = 0; index < features.length; index += 1) {
      const feature = features[index];
      const properties = feature?.properties || {};
      const coordinates = centroidFromGeometry(feature?.geometry);

      if (!coordinates) continue;

      const island = inferFeatureIsland(properties, coordinates);
      const names = getFeatureNames(properties);

      for (const sourceName of names) {
        candidates.push({
          sourceFile,
          sourceIndex: index,
          sourceName,
          normalizedName: normalizeName(sourceName),
          canonicalName: canonicalName(sourceName),
          island,
          coordinates,
          properties,
        });
      }
    }
  }

  return candidates;
}

function confidenceFromScore(score: number): Proposal["confidence"] {
  if (score >= 0.99) return "exact";
  if (score >= 0.94) return "strong";
  if (score >= 0.8) return "review";
  if (score > 0) return "weak";
  return "none";
}

function getRecordIsland(record: any, issue: any): IslandCode {
  return (
    normalizeIsland(record?.island) ||
    normalizeIsland(record?.islandCode) ||
    normalizeIsland(record?.sourceIsland) ||
    inferIslandFromName(issue?.name || record?.name || record?.title || "")
  );
}

function main() {
  if (!existsSync(REPORT_IN)) {
    throw new Error(`Missing report: ${REPORT_IN}`);
  }

  mkdirSync(path.join(ROOT, "reports"), { recursive: true });

  const cleanlinessReport = JSON.parse(readFileSync(REPORT_IN, "utf8"));

  const missingIssues = cleanlinessReport.issues.filter(
    (issue: any) =>
      issue.source === "geographic_index" &&
      issue.issue === "missing_coordinates"
  );

  const sourceCandidates = readSourceCandidates();

  const proposals: Proposal[] = missingIssues.map((issue: any) => {
    const record = geographicIndex[issue.index] || {};
    const name = issue.name || record.name || record.title || "";
    const recordIsland = getRecordIsland(record, issue);

    const scored = sourceCandidates
      .map((candidate) => {
        if (
          recordIsland &&
          candidate.island &&
          recordIsland !== candidate.island
        ) {
          return null;
        }

        const result = scoreNames(name, candidate.sourceName);

        if (result.score <= 0) return null;

        const islandBoost =
          recordIsland && candidate.island && recordIsland === candidate.island
            ? 0.01
            : 0;

        return {
          sourceFile: candidate.sourceFile,
          sourceIndex: candidate.sourceIndex,
          sourceName: candidate.sourceName,
          sourceIsland: candidate.island,
          coordinates: candidate.coordinates,
          score: Number(Math.min(1, result.score + islandBoost).toFixed(3)),
          reason: result.reason,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const best = scored[0];

    return {
      index: issue.index,
      name,
      type: record.type || record.kind || record.featureType,
      island: recordIsland,
      issue: issue.issue,
      bestScore: best?.score || 0,
      confidence: confidenceFromScore(best?.score || 0),
      bestMatch: best,
      alternatives: scored.slice(1),
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    missingIssues: missingIssues.length,
    sourceCandidates: sourceCandidates.length,
    sourceFilesUsed: SOURCE_FILES.filter(existsSync).map((file) =>
      path.relative(ROOT, file)
    ),
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

  console.log("Island-safe geographic coordinate candidate audit complete.");
  console.log(`Report: ${path.relative(ROOT, REPORT_OUT)}`);
  console.table(summary.confidenceTotals);

  console.log("\nExact + strong candidates:");
  console.table(
    proposals
      .filter((proposal) => ["exact", "strong"].includes(proposal.confidence))
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        island: proposal.island || "",
        confidence: proposal.confidence,
        score: proposal.bestScore,
        match: proposal.bestMatch?.sourceName,
        sourceIsland: proposal.bestMatch?.sourceIsland || "",
        lat: proposal.bestMatch?.coordinates.lat,
        lng: proposal.bestMatch?.coordinates.lng,
        source: proposal.bestMatch?.sourceFile,
      }))
  );

  console.log("\nReview candidates:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "review")
      .slice(0, 80)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        island: proposal.island || "",
        score: proposal.bestScore,
        match: proposal.bestMatch?.sourceName || "",
        sourceIsland: proposal.bestMatch?.sourceIsland || "",
        lat: proposal.bestMatch?.coordinates.lat,
        lng: proposal.bestMatch?.coordinates.lng,
      }))
  );

  const stillMissing = proposals.filter(
    (proposal) => proposal.confidence === "none"
  );

  if (stillMissing.length) {
    console.log("\nNo-candidate records:");
    console.table(
      stillMissing.slice(0, 80).map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        type: proposal.type || "",
        island: proposal.island || "",
      }))
    );
  }
}

main();
