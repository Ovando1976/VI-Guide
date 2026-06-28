import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { geographicIndexItems, type GeographicIndexItem } from "../src/data/core/geographicIndex";

type AuditIssue = {
  severity: "high" | "medium" | "low";
  category:
    | "duplicate-name"
    | "cross-island-name"
    | "cross-type-name"
    | "ocr-looking-name"
    | "missing-island"
    | "missing-feature-type"
    | "missing-coordinates"
    | "estate-missing-estate-id"
    | "dictionary-place-risk"
    | "manual-review";
  title: string;
  records: GeographicIndexItem[];
  notes?: string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeName(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/[’']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    if (!key) continue;

    const rows = map.get(key) ?? [];
    rows.push(item);
    map.set(key, rows);
  }

  return map;
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function looksLikeOcr(value: string) {
  const text = clean(value);

  if (/[A-Za-z]\d|\d[A-Za-z]/.test(text)) return true;
  if (/[A-Z][a-z]+[A-Z][a-z]+/.test(text)) return true;
  if (/\b[Aa]f[a-z]/.test(text)) return true;
  if (/\b[Aa]n8e\b/.test(text)) return true;
  if (/\bPohrt\b/i.test(text)) return true;
  if (/\bBail\b/i.test(text)) return true;
  if (/\bG u t\b/i.test(text)) return true;
  if (/\s{2,}/.test(value)) return true;
  if (/[{}[\]|]/.test(text)) return true;

  return false;
}

function isProbablyPlaceDictionaryEntry(item: GeographicIndexItem) {
  if (item.source !== "dictionary") return false;

  const type = normalizeName(item.type || item.featureType || item.category);
  const name = normalizeName(item.name);

  const placeTypes = [
    "estate",
    "bay",
    "point",
    "cay",
    "gut",
    "hill",
    "mountain",
    "town",
    "village",
    "harbor",
    "road",
    "quarter",
    "plantation",
    "fort",
    "battery",
  ];

  return placeTypes.some((word) => type.includes(word) || name.includes(word));
}

const items = geographicIndexItems;
const issues: AuditIssue[] = [];

const byName = groupBy(items, (item) => normalizeName(item.displayName || item.name));

for (const [name, records] of byName.entries()) {
  if (records.length <= 1) continue;

  const islands = unique(records.map((item) => item.island || "missing"));
  const types = unique(records.map((item) => item.featureType || item.type || item.source));

  issues.push({
    severity: "medium",
    category: "duplicate-name",
    title: `Duplicate display/base name: ${name}`,
    records,
    notes: `Found ${records.length} records. Islands: ${islands.join(", ")}. Types: ${types.join(", ")}.`,
  });

  if (islands.length > 1) {
    issues.push({
      severity: "low",
      category: "cross-island-name",
      title: `Same name exists across islands: ${name}`,
      records,
      notes: `This may be valid. Do not merge unless island/type/quarter prove it is the same feature.`,
    });
  }

  if (types.length > 1) {
    issues.push({
      severity: "medium",
      category: "cross-type-name",
      title: `Same name exists across feature types: ${name}`,
      records,
      notes: `This needs identity separation, for example town vs estate vs harbor.`,
    });
  }
}

const missingIsland = items.filter((item) => !item.island);
if (missingIsland.length) {
  issues.push({
    severity: "medium",
    category: "missing-island",
    title: "Records missing island",
    records: missingIsland,
    notes: `${missingIsland.length} records have no island.`,
  });
}

const missingFeatureType = items.filter((item) => !item.featureType);
if (missingFeatureType.length) {
  issues.push({
    severity: "medium",
    category: "missing-feature-type",
    title: "Records missing featureType",
    records: missingFeatureType,
    notes: `${missingFeatureType.length} records have no featureType.`,
  });
}

const missingCoordinates = items.filter((item) =>
  ["estate", "historicSite", "beach", "civicPlace"].includes(item.source) &&
  !item.coordinates,
);

if (missingCoordinates.length) {
  issues.push({
    severity: "low",
    category: "missing-coordinates",
    title: "Mappable records missing coordinates",
    records: missingCoordinates,
    notes: `${missingCoordinates.length} mappable records have no coordinates.`,
  });
}

const estateMissingEstateId = items.filter(
  (item) => item.source === "estate" && !item.estateId,
);

if (estateMissingEstateId.length) {
  issues.push({
    severity: "high",
    category: "estate-missing-estate-id",
    title: "Estate records missing estateId",
    records: estateMissingEstateId,
    notes: `${estateMissingEstateId.length} estate records have no estateId.`,
  });
}

const ocrLooking = items.filter((item) =>
  looksLikeOcr([item.name, item.canonicalName, item.displayName].filter(Boolean).join(" ")),
);

if (ocrLooking.length) {
  issues.push({
    severity: "high",
    category: "ocr-looking-name",
    title: "OCR-looking names",
    records: ocrLooking,
    notes: `${ocrLooking.length} records look like OCR errors or historical text fragments.`,
  });
}

const dictionaryPlaceRisks = items.filter(isProbablyPlaceDictionaryEntry);

if (dictionaryPlaceRisks.length) {
  issues.push({
    severity: "medium",
    category: "dictionary-place-risk",
    title: "Dictionary entries that may be real geographic features",
    records: dictionaryPlaceRisks,
    notes: `${dictionaryPlaceRisks.length} dictionary entries may need canonical place mapping.`,
  });
}

const manualReview = items.filter((item) =>
  /manual review|possible ocr|do not auto-merge|flag/i.test(
    [item.canonicalNotes, item.description].filter(Boolean).join(" "),
  ),
);

if (manualReview.length) {
  issues.push({
    severity: "high",
    category: "manual-review",
    title: "Records explicitly marked for manual review",
    records: manualReview,
    notes: `${manualReview.length} records are marked for manual review.`,
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  totals: {
    records: items.length,
    issues: issues.length,
    high: issues.filter((item) => item.severity === "high").length,
    medium: issues.filter((item) => item.severity === "medium").length,
    low: issues.filter((item) => item.severity === "low").length,
  },
  issueCountsByCategory: issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {}),
};

const jsonReport = {
  summary,
  issues: issues.map((issue) => ({
    ...issue,
    records: issue.records.map((record) => ({
      id: record.id,
      source: record.source,
      name: record.name,
      canonicalName: record.canonicalName,
      displayName: record.displayName,
      baseName: record.baseName,
      featureType: record.featureType,
      island: record.island,
      type: record.type,
      category: record.category,
      estateId: record.estateId,
      estateName: record.estateName,
      coordinates: record.coordinates,
      aliases: record.aliases,
      canonicalNotes: record.canonicalNotes,
    })),
  })),
};

function recordLine(record: GeographicIndexItem) {
  return `- \`${record.id}\` — **${record.name}** | ${record.source} | ${
    record.featureType || record.type || "unknown"
  } | ${record.island || "missing island"}`;
}

const markdown = [
  "# Geographic Index Audit",
  "",
  `Generated: ${summary.generatedAt}`,
  "",
  "## Summary",
  "",
  `- Records: ${summary.totals.records}`,
  `- Issues: ${summary.totals.issues}`,
  `- High: ${summary.totals.high}`,
  `- Medium: ${summary.totals.medium}`,
  `- Low: ${summary.totals.low}`,
  "",
  "## Issue Counts",
  "",
  ...Object.entries(summary.issueCountsByCategory).map(
    ([category, count]) => `- ${category}: ${count}`,
  ),
  "",
  "## Issues",
  "",
  ...issues.flatMap((issue, index) => [
    `### ${index + 1}. ${issue.title}`,
    "",
    `Severity: **${issue.severity}**`,
    "",
    issue.notes || "",
    "",
    ...issue.records.slice(0, 30).map(recordLine),
    issue.records.length > 30 ? `- ...and ${issue.records.length - 30} more` : "",
    "",
  ]),
].join("\n");

const jsonPath = resolve("generated/geographic-index-audit.json");
const mdPath = resolve("generated/geographic-index-audit.md");

mkdirSync(dirname(jsonPath), { recursive: true });

writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
writeFileSync(mdPath, markdown);

console.log("Geographic index audit complete:");
console.log(summary);
console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);