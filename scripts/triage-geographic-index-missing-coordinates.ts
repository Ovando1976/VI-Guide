// @ts-nocheck

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();

const CANDIDATE_REPORT_FILE = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates-full.json"
);

const DATA_CLEANLINESS_REPORT_FILE = path.join(
  ROOT,
  "reports/data-cleanliness-report.json"
);

const OUT_JSON = path.join(
  ROOT,
  "reports/geographic-index-missing-coordinate-triage.json"
);

const OUT_CSV = path.join(
  ROOT,
  "reports/geographic-index-missing-coordinate-triage.csv"
);

const OUT_MD = path.join(
  ROOT,
  "reports/geographic-index-missing-coordinate-triage.md"
);

type Bucket =
  | "review_candidate"
  | "research_clean_name_no_candidate"
  | "ocr_or_name_cleanup_first"
  | "low_priority_non_map_record"
  | "generic_fragment_do_not_coordinate";

function readJson(file: string) {
  if (!existsSync(file)) {
    throw new Error(`Missing required report: ${file}`);
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

function hasWeirdOcr(value: unknown): boolean {
  const raw = String(value ?? "");
  const clean = normalize(raw);
  const noSpaces = compact(raw);

  if (!raw.trim()) return true;
  if (raw.length <= 2) return true;

  const weirdPatterns = [
    /[A-Z][a-z]*[A-Z][a-z]*[A-Z]/,
    /[a-z][A-Z][a-z]/,
    /\d/,
    /[&@#$%^*_+=<>[\]{}|\\]/,
    /\b[a-z]\s+[a-z]\s+[a-z]\b/i,
    /\bctu\b/i,
    /\bzz\b/i,
    /\bz\b/i,
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
    /\bctuc/i,
    /\bcahrit/i,
    /\bcabriteberg p o c t/i,
    /\bespbrance/i,
    /\bbcotch/i,
    /\bbta/i,
    /\bbtwmphfar/i,
    /\bbuhvun/i,
    /\bboP/i,
  ];

  if (weirdPatterns.some((pattern) => pattern.test(raw))) return true;

  const vowels = (noSpaces.match(/[aeiou]/g) ?? []).length;
  const letters = (noSpaces.match(/[a-z]/g) ?? []).length;
  if (letters >= 8 && vowels / letters < 0.22) return true;

  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.some((token) => token.length >= 9 && !/[aeiou]/.test(token))) {
    return true;
  }

  return false;
}

function isGenericFragment(record: any): boolean {
  const name = normalize(record.name);
  const tokens = name.split(/\s+/).filter(Boolean);
  const type = normalize(record.type);

  const genericNames = new Set([
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
  ]);

  if (!name) return true;
  if (tokens.length === 1 && genericNames.has(tokens[0])) return true;
  if (tokens.length <= 1 && name.length <= 4) return true;

  if (
    ["dictionaryentry", "historic"].includes(type) &&
    tokens.length <= 2 &&
    tokens.every((token) => genericNames.has(token))
  ) {
    return true;
  }

  return false;
}

function isLowPriorityNonMapRecord(record: any): boolean {
  const type = normalize(record.type);
  const name = normalize(record.name);

  if (type === "archive record" || type === "archive_record") return true;

  if (type === "dictionaryentry" || type === "dictionary entry") {
    const mapWords = [
      "bay",
      "point",
      "hill",
      "gut",
      "estate",
      "plantation",
      "island",
      "cay",
      "reef",
      "harbor",
      "fort",
      "battery",
      "church",
      "school",
      "road",
      "creek",
      "spring",
      "channel",
    ];

    return !mapWords.some((word) => name.includes(word));
  }

  return false;
}

function classify(record: any): Bucket {
  const confidence = String(record.confidence ?? "none");

  if (isGenericFragment(record)) {
    return "generic_fragment_do_not_coordinate";
  }

  if (hasWeirdOcr(record.name)) {
    return "ocr_or_name_cleanup_first";
  }

  if (confidence !== "none") {
    return "review_candidate";
  }

  if (isLowPriorityNonMapRecord(record)) {
    return "low_priority_non_map_record";
  }

  return "research_clean_name_no_candidate";
}

function countBy<T extends Record<string, any>>(
  rows: T[],
  keyFn: (row: T) => string
): Record<string, number> {
  return rows.reduce((acc, row) => {
    const key = keyFn(row);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function candidateName(record: any): string {
  return (
    record.bestMatch?.name ??
    record.candidate?.name ??
    record.match?.name ??
    ""
  );
}

function candidateReason(record: any): string {
  return (
    record.bestMatch?.reason ??
    record.candidate?.reason ??
    record.match?.reason ??
    ""
  );
}

function candidateSource(record: any): string {
  return (
    record.bestMatch?.source ??
    record.candidate?.source ??
    record.match?.source ??
    ""
  );
}

function candidateLat(record: any): unknown {
  return record.bestMatch?.lat ?? record.candidate?.lat ?? record.match?.lat ?? "";
}

function candidateLng(record: any): unknown {
  return record.bestMatch?.lng ?? record.candidate?.lng ?? record.match?.lng ?? "";
}

const candidateReport = readJson(CANDIDATE_REPORT_FILE);
const dataCleanlinessReport = existsSync(DATA_CLEANLINESS_REPORT_FILE)
  ? readJson(DATA_CLEANLINESS_REPORT_FILE)
  : null;

const officialMissingCoordinateIssueIndexes = new Set(
  (dataCleanlinessReport?.issues ?? [])
    .filter(
      (issue: any) =>
        issue.source === "geographic_index" &&
        issue.issue === "missing_coordinates"
    )
    .map((issue: any) => Number(issue.index))
);

const byIndex = new Map(
  geographicIndex.map((record: any, index: number) => [index, record])
);

const proposals = (candidateReport.proposals ?? []).map((proposal: any) => {
  const sourceRecord = byIndex.get(Number(proposal.index)) ?? {};
  const merged = {
    ...sourceRecord,
    ...proposal,
    name: proposal.name ?? sourceRecord.name,
    type: proposal.type ?? sourceRecord.type,
    island: proposal.island ?? sourceRecord.island,
  };

  const bucket = classify(merged);

  return {
    index: Number(merged.index),
    id: merged.id ?? sourceRecord.id ?? "",
    name: merged.name ?? "",
    type: merged.type ?? "",
    island: merged.island ?? "",
    confidence: merged.confidence ?? "none",
    bucket,
    officialAuditSampled: officialMissingCoordinateIssueIndexes.has(
      Number(merged.index)
    ),
    candidateName: candidateName(merged),
    candidateSource: candidateSource(merged),
    candidateLat: candidateLat(merged),
    candidateLng: candidateLng(merged),
    reason: candidateReason(merged),
  };
});

const byBucket = countBy(proposals, (row) => row.bucket);
const byConfidence = countBy(proposals, (row) => row.confidence);
const byTypeIsland = countBy(
  proposals,
  (row) => `${row.type || "unknown"}::${row.island || "unknown"}`
);

const reviewCandidates = proposals
  .filter((row) => row.bucket === "review_candidate")
  .sort((a, b) => {
    const confidenceRank: Record<string, number> = {
      exact: 0,
      review: 1,
      weak: 2,
      none: 3,
    };

    return (
      (confidenceRank[a.confidence] ?? 9) -
        (confidenceRank[b.confidence] ?? 9) ||
      a.index - b.index
    );
  });

const cleanNoCandidate = proposals
  .filter((row) => row.bucket === "research_clean_name_no_candidate")
  .sort((a, b) => a.index - b.index);

const ocrFirst = proposals
  .filter((row) => row.bucket === "ocr_or_name_cleanup_first")
  .sort((a, b) => a.index - b.index);

const report = {
  generatedAt: new Date().toISOString(),
  sourceOfTruth: "reports/geographic-index-coordinate-candidates-full.json",
  notes: [
    "This triage report intentionally uses the full coordinate candidate audit proposals as the missing-coordinate source of truth.",
    "Do not independently re-detect missing coordinates here; that caused overcounting because geographicIndex supports multiple coordinate shapes.",
    "The official data-cleanliness audit is stricter and may report a smaller high-value issue count.",
  ],
  summary: {
    candidateReportMissingCoordinateRecords:
      candidateReport.summary?.missingCoordinateRecords ?? proposals.length,
    triagedRecords: proposals.length,
    officialDataCleanlinessMissingCoordinates:
      dataCleanlinessReport?.issueGroups?.find(
        (group: any) =>
          group.source === "geographic_index" &&
          group.issue === "missing_coordinates"
      )?.count ?? null,
    officialDataCleanlinessSampledIssues:
      officialMissingCoordinateIssueIndexes.size,
    byBucket,
    byConfidence,
    byTypeIsland,
    reviewCandidateCount: reviewCandidates.length,
    cleanNoCandidateCount: cleanNoCandidate.length,
    ocrOrNameCleanupFirstCount: ocrFirst.length,
  },
  reviewCandidates,
  cleanNoCandidate,
  ocrOrNameCleanupFirst: ocrFirst,
  rows: proposals,
};

writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

const csvHeaders = [
  "index",
  "id",
  "name",
  "type",
  "island",
  "confidence",
  "bucket",
  "officialAuditSampled",
  "candidateName",
  "candidateSource",
  "candidateLat",
  "candidateLng",
  "reason",
];

const csvRows = [
  csvHeaders.join(","),
  ...proposals.map((row) =>
    csvHeaders.map((header) => csvEscape(row[header])).join(",")
  ),
];

writeFileSync(OUT_CSV, `${csvRows.join("\n")}\n`);

const md = [
  "# Geographic Index Missing Coordinate Triage",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  "## Summary",
  "",
  `- Candidate-audit missing coordinate records: ${report.summary.candidateReportMissingCoordinateRecords}`,
  `- Triaged records: ${report.summary.triagedRecords}`,
  `- Official data-cleanliness missing coordinates: ${report.summary.officialDataCleanlinessMissingCoordinates}`,
  `- Official sampled missing-coordinate issues: ${report.summary.officialDataCleanlinessSampledIssues}`,
  "",
  "## By bucket",
  "",
  "| Bucket | Count |",
  "|---|---:|",
  ...Object.entries(byBucket)
    .sort((a: any, b: any) => b[1] - a[1])
    .map(([bucket, count]) => `| ${bucket} | ${count} |`),
  "",
  "## By confidence",
  "",
  "| Confidence | Count |",
  "|---|---:|",
  ...Object.entries(byConfidence)
    .sort((a: any, b: any) => b[1] - a[1])
    .map(([confidence, count]) => `| ${confidence} | ${count} |`),
  "",
  "## Best remaining review candidates",
  "",
  "| Index | Name | Type | Island | Confidence | Candidate | Reason |",
  "|---:|---|---|---|---|---|---|",
  ...reviewCandidates
    .slice(0, 120)
    .map(
      (row) =>
        `| ${row.index} | ${row.name} | ${row.type} | ${row.island} | ${row.confidence} | ${row.candidateName} | ${row.reason} |`
    ),
  "",
  "## Clean high-value records with no candidate",
  "",
  "| Index | Name | Type | Island |",
  "|---:|---|---|---|",
  ...cleanNoCandidate
    .slice(0, 120)
    .map((row) => `| ${row.index} | ${row.name} | ${row.type} | ${row.island} |`),
  "",
  "## OCR/name cleanup first",
  "",
  "| Index | Name | Type | Island |",
  "|---:|---|---|---|",
  ...ocrFirst
    .slice(0, 120)
    .map((row) => `| ${row.index} | ${row.name} | ${row.type} | ${row.island} |`),
  "",
].join("\n");

writeFileSync(OUT_MD, md);

console.log("Geographic index missing-coordinate triage complete.");
console.log(`Source of truth: ${CANDIDATE_REPORT_FILE}`);
console.log(`Triaged records: ${proposals.length}`);
console.log(
  `Candidate-audit missing coordinate records: ${report.summary.candidateReportMissingCoordinateRecords}`
);
console.log(
  `Official data-cleanliness missing coordinates: ${report.summary.officialDataCleanlinessMissingCoordinates}`
);

console.log("\nBy bucket:");
console.table(byBucket);

console.log("\nBy confidence:");
console.table(byConfidence);

console.log("\nBest remaining review candidates:");
console.table(
  reviewCandidates.slice(0, 40).map((row) => ({
    index: row.index,
    name: row.name,
    type: row.type,
    island: row.island,
    confidence: row.confidence,
    candidate: row.candidateName,
    reason: row.reason,
  }))
);

console.log("\nClean high-value no-candidate records:");
console.table(
  cleanNoCandidate.slice(0, 40).map((row) => ({
    index: row.index,
    name: row.name,
    type: row.type,
    island: row.island,
  }))
);

console.log(`\nJSON report: ${path.relative(ROOT, OUT_JSON)}`);
console.log(`CSV report: ${path.relative(ROOT, OUT_CSV)}`);
console.log(`Markdown report: ${path.relative(ROOT, OUT_MD)}`);
