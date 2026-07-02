// @ts-nocheck

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();

const TRIAGE_FILE = path.join(
  ROOT,
  "reports/geographic-index-missing-coordinate-triage.json"
);

const CANDIDATE_REPORT_FILE = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates-full.json"
);

const OUT_JSON = path.join(
  ROOT,
  "reports/geographic-index-ocr-cleanup-candidates.json"
);

const OUT_CSV = path.join(
  ROOT,
  "reports/geographic-index-ocr-cleanup-candidates.csv"
);

const OUT_MD = path.join(
  ROOT,
  "reports/geographic-index-ocr-cleanup-candidates.md"
);

function readJson(file: string) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }

  return JSON.parse(readFileSync(file, "utf8"));
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function compact(value: unknown): string {
  return normalize(value).replace(/\s+/g, "");
}

function titleCase(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const upperAcronyms = new Set(["USVI", "VI", "NPS", "NARA"]);

  return raw
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\bUsvi\b/g, "USVI")
    .replace(/\bVi\b/g, "VI")
    .replace(/\bSt\b/g, "St.")
    .replace(/\bAnd\b/g, "and")
    .replace(/\bOf\b/g, "of")
    .replace(/\bThe\b/g, "the")
    .replace(/\bNps\b/g, "NPS")
    .replace(/\bNara\b/g, "NARA")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\b([A-Z]{2,})\b/g, (word) =>
      upperAcronyms.has(word) ? word : word
    )
    .trim();
}

function tokens(value: unknown): string[] {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function isGenericName(value: unknown): boolean {
  const clean = normalize(value);
  const parts = tokens(value);

  const generic = new Set([
    "bay",
    "hill",
    "point",
    "gut",
    "road",
    "harbor",
    "reef",
    "bank",
    "church",
    "school",
    "estate",
    "plantation",
    "island",
    "cay",
    "fort",
    "battery",
    "creek",
    "spring",
    "channel",
    "mountain",
    "records",
    "maps",
  ]);

  if (!clean) return true;
  if (parts.length === 1 && generic.has(parts[0])) return true;
  if (parts.length <= 1 && clean.length <= 3) return true;

  return false;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  const curr = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

function similarity(a: unknown, b: unknown): number {
  const left = compact(a);
  const right = compact(b);

  if (!left || !right) return 0;
  if (left === right) return 1;

  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function tokenOverlap(a: unknown, b: unknown): number {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  if (!left.size || !right.size) return 0;

  let hits = 0;
  for (const token of left) {
    if (right.has(token)) hits += 1;
  }

  return hits / Math.max(left.size, right.size);
}

function hasWeirdOcr(value: unknown): boolean {
  const raw = String(value ?? "");
  const clean = normalize(raw);
  const noSpaces = compact(raw);

  if (!raw.trim()) return true;
  if (raw.length <= 2) return true;

  const patterns = [
    /[A-Z][a-z]*[A-Z][a-z]*[A-Z]/,
    /[a-z][A-Z][a-z]/,
    /\d/,
    /[&@#$%^*_+=<>[\]{}|\\]/,
    /\b[a-z]\s+[a-z]\s+[a-z]\b/i,
    /\bctu\b/i,
    /\bzz\b/i,
    /\bizaab\b/i,
    /\beecoc/i,
    /\bflourke\b/i,
    /\braltpond\b/i,
    /\bcaakly\b/i,
    /\bpolnt\b/i,
    /\bpudt\b/i,
    /\beill\b/i,
    /\bstkwart\b/i,
    /\bmoalpellier\b/i,
    /\bhnvensigt\b/i,
    /\bcahrit/i,
    /\bespbrance/i,
    /\bbcotch/i,
    /\bbta/i,
    /\bbtwmphfar/i,
    /\bbuhvun/i,
    /\bboP/i,
    /\bcotkong/i,
    /\bfredericks izaab/i,
    /\bkalabasboom/i,
    /\blongmat/i,
    /\blowelund/i,
    /\bowrettbay/i,
  ];

  if (patterns.some((pattern) => pattern.test(raw))) return true;

  const letters = (noSpaces.match(/[a-z]/g) ?? []).length;
  const vowels = (noSpaces.match(/[aeiou]/g) ?? []).length;

  if (letters >= 8 && vowels / letters < 0.22) return true;

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.some((part) => part.length >= 9 && !/[aeiou]/.test(part))) {
    return true;
  }

  return false;
}

function hasCoordinateShape(record: any): boolean {
  const coordinates = record?.coordinates;
  const centroid = record?.centroid;

  if (
    coordinates &&
    typeof coordinates === "object" &&
    Number.isFinite(Number(coordinates.lat)) &&
    Number.isFinite(Number(coordinates.lng))
  ) {
    return true;
  }

  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]))
  ) {
    return true;
  }

  if (
    centroid &&
    typeof centroid === "object" &&
    Number.isFinite(Number(centroid.lat)) &&
    Number.isFinite(Number(centroid.lng))
  ) {
    return true;
  }

  if (
    Number.isFinite(Number(record?.lat)) &&
    Number.isFinite(Number(record?.lng))
  ) {
    return true;
  }

  return false;
}

function candidateName(record: any): string {
  return (
    record.bestMatch?.name ??
    record.candidate?.name ??
    record.match?.name ??
    record.candidateName ??
    ""
  );
}

function candidateSource(record: any): string {
  return (
    record.bestMatch?.source ??
    record.candidate?.source ??
    record.match?.source ??
    record.candidateSource ??
    ""
  );
}

function candidateReason(record: any): string {
  return (
    record.bestMatch?.reason ??
    record.candidate?.reason ??
    record.match?.reason ??
    record.reason ??
    ""
  );
}

function countBy(rows: any[], keyFn: (row: any) => string) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

const triage = readJson(TRIAGE_FILE);
const candidateReport = readJson(CANDIDATE_REPORT_FILE);

const triageRows = triage.rows ?? [];
const proposalRows = candidateReport.proposals ?? [];

const proposalByIndex = new Map(
  proposalRows.map((proposal: any) => [Number(proposal.index), proposal])
);

const canonicalPool = geographicIndex
  .map((record: any, index: number) => ({
    index,
    id: record.id ?? "",
    name: record.name ?? "",
    type: record.type ?? "",
    island: record.island ?? "",
    hasCoordinates: hasCoordinateShape(record),
  }))
  .filter((record) => {
    if (!record.name) return false;
    if (isGenericName(record.name)) return false;
    if (hasWeirdOcr(record.name)) return false;

    const type = normalize(record.type);
    if (["archive record", "archive_record"].includes(type)) return false;

    return true;
  });

function bestPoolMatch(target: any) {
  const sameIslandPool = canonicalPool.filter((candidate) => {
    if (!target.island || !candidate.island) return true;
    return target.island === candidate.island;
  });

  let best = null;

  for (const candidate of sameIslandPool) {
    if (candidate.index === Number(target.index)) continue;

    const sim = similarity(target.name, candidate.name);
    const overlap = tokenOverlap(target.name, candidate.name);
    const coordBonus = candidate.hasCoordinates ? 0.03 : 0;
    const score = Math.max(sim, overlap * 0.92) + coordBonus;

    if (!best || score > best.score) {
      best = {
        ...candidate,
        score: Number(score.toFixed(3)),
        similarity: Number(sim.toFixed(3)),
        tokenOverlap: Number(overlap.toFixed(3)),
      };
    }
  }

  return best;
}

function classifyCandidate(row: any) {
  const proposed = String(row.suggestedName ?? "");
  const raw = String(row.name ?? "");

  if (!proposed || isGenericName(proposed)) return "none";

  const sim = similarity(raw, proposed);
  const overlap = tokenOverlap(raw, proposed);
  const weird = hasWeirdOcr(raw);

  if (weird && sim >= 0.86) return "strong";
  if (weird && sim >= 0.78 && overlap >= 0.25) return "strong";
  if (weird && sim >= 0.72) return "review";
  if (sim >= 0.82 && overlap >= 0.25) return "review";
  if (row.candidateConfidence && row.candidateConfidence !== "none") {
    return "review";
  }

  return "none";
}

const targetRows = triageRows.filter((row: any) => {
  if (row.bucket === "ocr_or_name_cleanup_first") return true;

  const proposal = proposalByIndex.get(Number(row.index));
  const candidate = candidateName(proposal ?? row);

  if (!candidate) return false;
  if (isGenericName(candidate)) return false;
  if (row.bucket === "review_candidate" && hasWeirdOcr(row.name)) return true;

  return false;
});

const rows = targetRows.map((row: any) => {
  const proposal = proposalByIndex.get(Number(row.index)) ?? {};
  const existingCandidateName = candidateName(proposal) || row.candidateName || "";
  const poolMatch = bestPoolMatch(row);

  const candidateFromReportScore = existingCandidateName
    ? similarity(row.name, existingCandidateName)
    : 0;

  const poolScore = poolMatch?.score ?? 0;

  const chosen =
    existingCandidateName && candidateFromReportScore >= Math.max(0.72, poolScore - 0.03)
      ? {
          name: existingCandidateName,
          source: candidateSource(proposal) || row.candidateSource || "candidate_report",
          reason: candidateReason(proposal) || row.reason || "candidate_report_match",
          score: Number(candidateFromReportScore.toFixed(3)),
        }
      : poolMatch
        ? {
            name: poolMatch.name,
            source: "geographic_index_pool",
            reason: "best_same_island_name_similarity",
            score: poolMatch.score,
          }
        : {
            name: "",
            source: "",
            reason: "",
            score: 0,
          };

  const suggestedName = titleCase(chosen.name);
  const candidateConfidence = proposal.confidence ?? row.confidence ?? "none";

  const record = {
    index: Number(row.index),
    id: row.id ?? geographicIndex[Number(row.index)]?.id ?? "",
    currentName: row.name ?? geographicIndex[Number(row.index)]?.name ?? "",
    suggestedName,
    type: row.type ?? geographicIndex[Number(row.index)]?.type ?? "",
    island: row.island ?? geographicIndex[Number(row.index)]?.island ?? "",
    bucket: row.bucket ?? "",
    candidateConfidence,
    cleanupConfidence: "none",
    score: chosen.score,
    source: chosen.source,
    reason: chosen.reason,
    originalCandidateName: existingCandidateName,
    poolCandidateName: poolMatch?.name ?? "",
    poolScore: poolMatch?.score ?? 0,
    hasWeirdOcr: hasWeirdOcr(row.name),
  };

  record.cleanupConfidence = classifyCandidate(record);

  return record;
});

const filteredRows = rows
  .filter((row) => row.cleanupConfidence !== "none")
  .sort((a, b) => {
    const rank = { strong: 0, review: 1, none: 2 };
    return (
      (rank[a.cleanupConfidence] ?? 9) -
        (rank[b.cleanupConfidence] ?? 9) ||
      b.score - a.score ||
      a.index - b.index
    );
  });

const report = {
  generatedAt: new Date().toISOString(),
  sourceFiles: {
    triage: path.relative(ROOT, TRIAGE_FILE),
    coordinateCandidates: path.relative(ROOT, CANDIDATE_REPORT_FILE),
  },
  summary: {
    targetRows: targetRows.length,
    proposedRows: filteredRows.length,
    byCleanupConfidence: countBy(filteredRows, (row) => row.cleanupConfidence),
    byIsland: countBy(filteredRows, (row) => row.island || "unknown"),
    byType: countBy(filteredRows, (row) => row.type || "unknown"),
  },
  strong: filteredRows.filter((row) => row.cleanupConfidence === "strong"),
  review: filteredRows.filter((row) => row.cleanupConfidence === "review"),
  rows: filteredRows,
};

writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

const csvHeaders = [
  "index",
  "id",
  "currentName",
  "suggestedName",
  "type",
  "island",
  "cleanupConfidence",
  "score",
  "source",
  "reason",
  "candidateConfidence",
  "originalCandidateName",
  "poolCandidateName",
  "poolScore",
];

const csvRows = [
  csvHeaders.join(","),
  ...filteredRows.map((row) =>
    csvHeaders.map((header) => csvEscape(row[header])).join(",")
  ),
];

writeFileSync(OUT_CSV, `${csvRows.join("\n")}\n`);

const md = [
  "# Geographic Index OCR Cleanup Candidates",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- OCR/name target rows: ${report.summary.targetRows}`,
  `- Proposed cleanup rows: ${report.summary.proposedRows}`,
  "",
  "## By cleanup confidence",
  "",
  "| Confidence | Count |",
  "|---|---:|",
  ...Object.entries(report.summary.byCleanupConfidence)
    .sort((a: any, b: any) => b[1] - a[1])
    .map(([confidence, count]) => `| ${confidence} | ${count} |`),
  "",
  "## Strong candidates",
  "",
  "| Index | Current name | Suggested name | Type | Island | Score | Reason |",
  "|---:|---|---|---|---|---:|---|",
  ...report.strong.map(
    (row) =>
      `| ${row.index} | ${row.currentName} | ${row.suggestedName} | ${row.type} | ${row.island} | ${row.score} | ${row.reason} |`
  ),
  "",
  "## Review candidates",
  "",
  "| Index | Current name | Suggested name | Type | Island | Score | Reason |",
  "|---:|---|---|---|---|---:|---|",
  ...report.review.slice(0, 160).map(
    (row) =>
      `| ${row.index} | ${row.currentName} | ${row.suggestedName} | ${row.type} | ${row.island} | ${row.score} | ${row.reason} |`
  ),
  "",
].join("\n");

writeFileSync(OUT_MD, md);

console.log("Geographic index OCR cleanup candidate audit complete.");
console.log(`Target OCR/name rows: ${report.summary.targetRows}`);
console.log(`Proposed cleanup rows: ${report.summary.proposedRows}`);

console.log("\nBy cleanup confidence:");
console.table(report.summary.byCleanupConfidence);

console.log("\nStrong candidates:");
console.table(
  report.strong.slice(0, 80).map((row) => ({
    index: row.index,
    currentName: row.currentName,
    suggestedName: row.suggestedName,
    type: row.type,
    island: row.island,
    score: row.score,
    reason: row.reason,
  }))
);

console.log("\nReview candidates:");
console.table(
  report.review.slice(0, 80).map((row) => ({
    index: row.index,
    currentName: row.currentName,
    suggestedName: row.suggestedName,
    type: row.type,
    island: row.island,
    score: row.score,
    reason: row.reason,
  }))
);

console.log(`\nJSON report: ${path.relative(ROOT, OUT_JSON)}`);
console.log(`CSV report: ${path.relative(ROOT, OUT_CSV)}`);
console.log(`Markdown report: ${path.relative(ROOT, OUT_MD)}`);
