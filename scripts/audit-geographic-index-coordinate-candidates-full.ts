// @ts-nocheck

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

let historicSites: any[] = [];

try {
  const historicModule = await import("../src/data/historicSites");
  historicSites =
    historicModule.historicSites ||
    historicModule.HISTORIC_SITES ||
    historicModule.default ||
    Object.values(historicModule).find((value) => Array.isArray(value)) ||
    [];
} catch {
  historicSites = [];
}

const ROOT = process.cwd();

const REPORT_OUT = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates-full.json"
);

const CSV_OUT = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates-full.csv"
);

const ESTATE_GEOJSON_CANDIDATES = [
  "public/geo/usvi-estates.geojson",
  "public/data/usvi-estates.geojson",
  "public/data/estates.geojson",
].map((file) => path.join(ROOT, file));

const LOCATION_TYPES = new Set([
  "estate",
  "estates",
  "beach",
  "beaches",
  "historicSite",
  "historic-site",
  "historic_site",
  "historic",
  "site",
  "place",
  "places",
  "point",
  "civicPlace",
  "civic-place",
  "civic_place",
  "restaurant",
  "event",
  "attraction",
]);

const GENERIC_WORDS = new Set([
  "estate",
  "historic",
  "district",
  "site",
  "place",
  "point",
  "bay",
  "road",
  "street",
  "island",
  "st",
  "saint",
  "the",
  "and",
  "of",
  "national",
  "park",
  "plantation",
  "great",
  "house",
  "school",
  "church",
  "manse",
  "fort",
  "ruin",
  "ruins",
]);

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown) {
  return stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIsland(value: unknown) {
  const v = normalize(value).replace(/\s+/g, "_");

  if (!v) return "";

  if (["stt", "st_thomas", "saint_thomas"].includes(v)) return "st_thomas";
  if (["stj", "st_john", "saint_john"].includes(v)) return "st_john";
  if (["stx", "st_croix", "saint_croix"].includes(v)) return "st_croix";
  if (["wat", "water_island"].includes(v)) return "water_island";

  return v;
}

function islandAlias(value: unknown) {
  const island = normalizeIsland(value);

  if (island === "st_thomas") return "stt";
  if (island === "st_john") return "stj";
  if (island === "st_croix") return "stx";
  if (island === "water_island") return "wat";

  return island;
}

function slug(value: unknown) {
  return normalize(value)
    .replace(/\bst croix\b/g, " ")
    .replace(/\bst thomas\b/g, " ")
    .replace(/\bst john\b/g, " ")
    .replace(/\bwater island\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanSlug(value: unknown) {
  return slug(value)
    .split("-")
    .filter((token) => token && !GENERIC_WORDS.has(token))
    .join("-");
}

function tokens(value: unknown) {
  return cleanSlug(value).split("-").filter(Boolean);
}

function tokenOverlap(a: unknown, b: unknown) {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  if (!left.size || !right.size) return 0;

  let same = 0;

  for (const token of left) {
    if (right.has(token)) same += 1;
  }

  return same / new Set([...left, ...right]).size;
}

function levenshtein(a: string, b: string) {
  const left = cleanSlug(a);
  const right = cleanSlug(b);

  const m = left.length;
  const n = right.length;

  if (!m || !n) return Math.max(m, n);

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string) {
  const left = cleanSlug(a);
  const right = cleanSlug(b);

  if (!left || !right) return 0;

  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function getName(record: any) {
  return (
    record?.name ||
    record?.title ||
    record?.label ||
    record?.term ||
    record?.entry ||
    record?.estate ||
    record?.estateName ||
    record?.fullName ||
    record?.baseName ||
    record?.displayName ||
    record?.siteName ||
    record?.placeName ||
    record?.id ||
    ""
  );
}

function getType(record: any) {
  return (
    record?.type ||
    record?.kind ||
    record?.category ||
    record?.recordType ||
    record?.itemType ||
    record?.siteType ||
    record?.class ||
    ""
  );
}

function getIsland(record: any) {
  return normalizeIsland(
    record?.island ||
      record?.islandCode ||
      record?.island_id ||
      record?.islandId ||
      record?.islandName ||
      record?.Island ||
      ""
  );
}

function getCandidateNames(record: any) {
  return [
    getName(record),
    record?.id,
    record?.geoid,
    record?.geoId,
    record?.slug,
    record?.key,
    record?.canonicalName,
    ...(Array.isArray(record?.aliases) ? record.aliases : []),
    ...(Array.isArray(record?.alternateNames) ? record.alternateNames : []),
    ...(Array.isArray(record?.altNames) ? record.altNames : []),
  ].filter(Boolean);
}

function hasCoordinates(record: any) {
  if (!record || typeof record !== "object") return false;

  if (typeof record.lat === "number" && typeof record.lng === "number") return true;
  if (typeof record.latitude === "number" && typeof record.longitude === "number") return true;

  const coord = record.coordinates || record.center || record.centroid || record.coords;

  if (Array.isArray(coord) && coord.length >= 2) {
    return typeof coord[0] === "number" && typeof coord[1] === "number";
  }

  if (coord && typeof coord === "object") {
    return (
      (typeof coord.lat === "number" && typeof coord.lng === "number") ||
      (typeof coord.latitude === "number" && typeof coord.longitude === "number")
    );
  }

  if (record.geometry) return true;

  return false;
}

function getCoordinates(record: any): { lat: number; lng: number } | null {
  if (!record || typeof record !== "object") return null;

  if (typeof record.lat === "number" && typeof record.lng === "number") {
    return { lat: record.lat, lng: record.lng };
  }

  if (typeof record.latitude === "number" && typeof record.longitude === "number") {
    return { lat: record.latitude, lng: record.longitude };
  }

  const coord = record.coordinates || record.center || record.centroid || record.coords;

  if (Array.isArray(coord) && coord.length >= 2) {
    const [a, b] = coord;

    if (typeof a === "number" && typeof b === "number") {
      if (Math.abs(a) <= 20 && Math.abs(b) > 20) return { lat: a, lng: b };
      return { lat: b, lng: a };
    }
  }

  if (coord && typeof coord === "object") {
    if (typeof coord.lat === "number" && typeof coord.lng === "number") {
      return { lat: coord.lat, lng: coord.lng };
    }

    if (typeof coord.latitude === "number" && typeof coord.longitude === "number") {
      return { lat: coord.latitude, lng: coord.longitude };
    }
  }

  return null;
}

function collectPositionsFromGeometry(geometry: any, out: number[][] = []) {
  if (!geometry) return out;

  if (geometry.type === "Point") {
    out.push(geometry.coordinates);
    return out;
  }

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates || []) {
      for (const position of ring || []) out.push(position);
    }

    return out;
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates || []) {
      for (const ring of polygon || []) {
        for (const position of ring || []) out.push(position);
      }
    }

    return out;
  }

  if (geometry.type === "LineString") {
    for (const position of geometry.coordinates || []) out.push(position);
    return out;
  }

  if (geometry.type === "MultiLineString") {
    for (const line of geometry.coordinates || []) {
      for (const position of line || []) out.push(position);
    }

    return out;
  }

  return out;
}

function centroidFromGeometry(geometry: any) {
  const positions = collectPositionsFromGeometry(geometry).filter(
    (position) =>
      Array.isArray(position) &&
      typeof position[0] === "number" &&
      typeof position[1] === "number"
  );

  if (!positions.length) return null;

  let lng = 0;
  let lat = 0;

  for (const position of positions) {
    lng += position[0];
    lat += position[1];
  }

  return {
    lat: Number((lat / positions.length).toFixed(6)),
    lng: Number((lng / positions.length).toFixed(6)),
  };
}

function isLocationLike(record: any) {
  const type = normalize(getType(record));

  if (LOCATION_TYPES.has(type)) return true;

  if (record?.geometry) return true;

  const name = normalize(getName(record));

  return /\b(estate|bay|beach|point|hill|fort|battery|harbor|harbour|island|plantation|gut|reef|cay|key|school|church|ruin|historic)\b/.test(name);
}

function sourceCandidateFromGeoFeature(feature: any, index: number) {
  const p = feature.properties || {};
  const coords = centroidFromGeometry(feature.geometry);

  if (!coords) return null;

  const name =
    p.name ||
    p.NAME ||
    p.estate ||
    p.ESTATE ||
    p.label ||
    p.LABEL ||
    p.fullName ||
    p.baseName ||
    "";

  return {
    source: "estates_geojson",
    sourceIndex: index,
    id: feature.id || p.id || p.geoid || p.GEOID || p.OBJECTID || p.objectid || "",
    name,
    type: p.type || p.TYPE || "estate",
    island: normalizeIsland(p.island || p.ISLAND || p.islandCode || p.ISLAND_CODE || p.quarterIsland || ""),
    lat: coords.lat,
    lng: coords.lng,
    names: [
      name,
      p.fullName,
      p.baseName,
      p.estate,
      p.ESTATE,
      p.label,
      p.LABEL,
      feature.id,
      p.id,
      p.geoid,
      p.GEOID,
    ].filter(Boolean),
  };
}

function buildSourceCandidates() {
  const candidates = [];

  for (const [index, record] of geographicIndex.entries()) {
    const coords = getCoordinates(record);

    if (!coords) continue;

    candidates.push({
      source: "geographic_index",
      sourceIndex: index,
      id: record.id || record.geoid || record.geoId || record.slug || "",
      name: getName(record),
      type: getType(record),
      island: getIsland(record),
      lat: coords.lat,
      lng: coords.lng,
      names: getCandidateNames(record),
    });
  }

  for (const [index, record] of historicSites.entries()) {
    const coords = getCoordinates(record);

    if (!coords) continue;

    candidates.push({
      source: "historic_sites",
      sourceIndex: index,
      id: record.id || record.siteId || record.slug || "",
      name: getName(record),
      type: getType(record) || "historicSite",
      island: getIsland(record),
      lat: coords.lat,
      lng: coords.lng,
      names: getCandidateNames(record),
    });
  }

  for (const file of ESTATE_GEOJSON_CANDIDATES) {
    if (!existsSync(file)) continue;

    const geojson = JSON.parse(readFileSync(file, "utf8"));

    for (const [index, feature] of (geojson.features || []).entries()) {
      const candidate = sourceCandidateFromGeoFeature(feature, index);

      if (candidate) {
        candidates.push(candidate);
      }
    }

    break;
  }

  return candidates;
}

function scoreCandidate(record: any, candidate: any) {
  const recordIsland = getIsland(record);
  const candidateIsland = getIsland(candidate);

  if (recordIsland && candidateIsland && recordIsland !== candidateIsland) {
    return null;
  }

  const recordType = normalize(getType(record));
  const candidateType = normalize(getType(candidate));

  const recordNames = getCandidateNames(record);
  const candidateNames = candidate.names || getCandidateNames(candidate);

  let bestScore = 0;
  let reason = "";
  let matchedRecordName = "";
  let matchedCandidateName = "";

  for (const recordName of recordNames) {
    const recordSlug = slug(recordName);
    const recordClean = cleanSlug(recordName);

    if (!recordClean || recordClean.length < 3) continue;

    for (const candidateName of candidateNames) {
      const candidateSlug = slug(candidateName);
      const candidateClean = cleanSlug(candidateName);

      if (!candidateClean || candidateClean.length < 3) continue;

      if (recordSlug === candidateSlug) {
        return {
          score: 1,
          reason: "exact_slug",
          matchedRecordName: recordName,
          matchedCandidateName: candidateName,
        };
      }

      if (recordClean === candidateClean) {
        bestScore = Math.max(bestScore, 0.98);
        reason = "exact_clean_slug";
        matchedRecordName = recordName;
        matchedCandidateName = candidateName;
      }

      if (
        recordClean.length >= 5 &&
        (candidateClean.includes(recordClean) || recordClean.includes(candidateClean))
      ) {
        bestScore = Math.max(bestScore, 0.92);
        reason = "contains_clean_slug";
        matchedRecordName = recordName;
        matchedCandidateName = candidateName;
      }

      const sim = similarity(recordName, candidateName);
      const overlap = tokenOverlap(recordName, candidateName);
      const score = Math.max(sim, overlap);

      if (score > bestScore) {
        bestScore = score;
        reason = score >= 0.84 ? "similarity_or_token_overlap" : "weak_similarity";
        matchedRecordName = recordName;
        matchedCandidateName = candidateName;
      }
    }
  }

  if (recordType && candidateType && recordType === candidateType) {
    bestScore += 0.01;
  }

  return {
    score: Math.min(1, Number(bestScore.toFixed(3))),
    reason,
    matchedRecordName,
    matchedCandidateName,
  };
}

function confidence(score: number) {
  if (score >= 1) return "exact";
  if (score >= 0.96) return "strong";
  if (score >= 0.88) return "review";
  if (score >= 0.76) return "weak";
  return "none";
}

function csvEscape(value: unknown) {
  const string = String(value ?? "");

  if (/[",\n]/.test(string)) {
    return `"${string.replace(/"/g, '""')}"`;
  }

  return string;
}

function main() {
  mkdirSync(path.join(ROOT, "reports"), { recursive: true });

  const sourceCandidates = buildSourceCandidates();

  const missingRecords = geographicIndex
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => isLocationLike(record) && !hasCoordinates(record));

  const proposals = missingRecords.map(({ record, index }) => {
    const scored = sourceCandidates
      .map((candidate) => {
        const result = scoreCandidate(record, candidate);

        if (!result) return null;

        return {
          ...candidate,
          score: result.score,
          reason: result.reason,
          matchedRecordName: result.matchedRecordName,
          matchedCandidateName: result.matchedCandidateName,
        };
      })
      .filter(Boolean)
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0] || null;

    return {
      index,
      id: record.id || record.geoid || record.geoId || record.slug || "",
      name: getName(record),
      type: getType(record),
      island: getIsland(record),
      confidence: confidence(best?.score || 0),
      bestScore: best?.score || 0,
      bestMatch: best
        ? {
            source: best.source,
            sourceIndex: best.sourceIndex,
            id: best.id,
            name: best.name,
            type: best.type,
            island: best.island,
            lat: best.lat,
            lng: best.lng,
            score: best.score,
            reason: best.reason,
            matchedRecordName: best.matchedRecordName,
            matchedCandidateName: best.matchedCandidateName,
          }
        : null,
      alternatives: scored.slice(1, 6).map((item) => ({
        source: item.source,
        sourceIndex: item.sourceIndex,
        id: item.id,
        name: item.name,
        type: item.type,
        island: item.island,
        lat: item.lat,
        lng: item.lng,
        score: item.score,
        reason: item.reason,
        matchedRecordName: item.matchedRecordName,
        matchedCandidateName: item.matchedCandidateName,
      })),
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    geographicIndexRecords: geographicIndex.length,
    missingCoordinateRecords: missingRecords.length,
    sourceCandidates: sourceCandidates.length,
    confidenceTotals: proposals.reduce((acc: Record<string, number>, proposal) => {
      acc[proposal.confidence] = (acc[proposal.confidence] || 0) + 1;
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

  const csvRows = [
    [
      "index",
      "name",
      "type",
      "island",
      "confidence",
      "score",
      "candidateSource",
      "candidateIndex",
      "candidateName",
      "lat",
      "lng",
      "reason",
    ],
    ...proposals.map((proposal) => [
      proposal.index,
      proposal.name,
      proposal.type,
      proposal.island,
      proposal.confidence,
      proposal.bestScore,
      proposal.bestMatch?.source || "",
      proposal.bestMatch?.sourceIndex ?? "",
      proposal.bestMatch?.name || "",
      proposal.bestMatch?.lat ?? "",
      proposal.bestMatch?.lng ?? "",
      proposal.bestMatch?.reason || "",
    ]),
  ];

  writeFileSync(
    CSV_OUT,
    csvRows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n"
  );

  console.log("Full geographic index coordinate candidate audit complete.");
  console.log(`Missing coordinate records: ${summary.missingCoordinateRecords}`);
  console.log(`Source candidates: ${summary.sourceCandidates}`);
  console.log(`JSON report: ${path.relative(ROOT, REPORT_OUT)}`);
  console.log(`CSV report: ${path.relative(ROOT, CSV_OUT)}`);
  console.table(summary.confidenceTotals);

  console.log("\nExact/strong candidates:");
  console.table(
    proposals
      .filter((proposal) => ["exact", "strong"].includes(proposal.confidence))
      .slice(0, 80)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
        candidate: proposal.bestMatch?.name,
        source: proposal.bestMatch?.source,
        lat: proposal.bestMatch?.lat,
        lng: proposal.bestMatch?.lng,
        score: proposal.bestScore,
        reason: proposal.bestMatch?.reason,
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
        type: proposal.type,
        island: proposal.island,
        candidate: proposal.bestMatch?.name,
        source: proposal.bestMatch?.source,
        lat: proposal.bestMatch?.lat,
        lng: proposal.bestMatch?.lng,
        score: proposal.bestScore,
        reason: proposal.bestMatch?.reason,
      }))
  );

  console.log("\nNo candidates:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "none")
      .slice(0, 80)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
      }))
  );
}

main();
