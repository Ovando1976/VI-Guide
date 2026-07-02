// @ts-nocheck

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const REPORT_JSON = path.join(ROOT, "reports/geographic-index-ocr-cleanup-batch-2.json");
const REPORT_MD = path.join(ROOT, "reports/geographic-index-ocr-cleanup-batch-2.md");

mkdirSync(path.join(ROOT, "reports"), { recursive: true });

const TARGET_INDICES = [
  62, 72, 74, 79, 118, 119, 123, 133, 155, 173,
  224, 225, 228, 239, 280, 283, 297, 301,
  417, 502, 839, 840, 841, 848, 849, 1986, 2067
];

const suggestions = new Map([
  [72, { suggestedName: "Scotch Reef", confidence: "strong_review", reason: "Bcotch is likely OCR for Scotch." }],
  [74, { suggestedName: "Beaching Spit", confidence: "strong_review", reason: "Beaehing is likely OCR for Beaching." }],
  [79, { suggestedName: "Red Hook Bay", confidence: "manual_review", reason: "Bedhook may be OCR for Red Hook; verify description first." }],
  [118, { suggestedName: "Beverhoudt Plantation", confidence: "manual_review", reason: "May be Beverhoudt, but record type/island need verification." }],
  [119, { suggestedName: "Beverhoudt Point", confidence: "manual_review", reason: "May be Beverhoudt, but record type/island need verification." }],
  [224, { suggestedName: null, confidence: "probably_fragment", reason: "Name is only Bt; likely fragment, not a map record." }],
  [225, { suggestedName: "Staley Point", confidence: "manual_review", reason: "BtaZley may be Staley; verify description." }],
  [228, { suggestedName: null, confidence: "manual_review", reason: "Btwmphfar Bay needs description review." }],
  [280, { suggestedName: "Casey Point", confidence: "manual_review", reason: "Caeey may be Casey; verify description." }],
  [283, { suggestedName: "Cabritaberg", confidence: "manual_review", reason: "CahrZtaberg may be Cabritaberg; verify description/island." }],
  [417, { suggestedName: "Centerline Road", confidence: "strong_review", reason: "Cehterline is likely OCR for Centerline." }],
  [502, { suggestedName: "Compagnies Plantagie", confidence: "manual_review", reason: "Likely Dutch/Danish plantation wording; verify exact spelling." }],
  [839, { suggestedName: "Frederiksted Harbor", confidence: "manual_review", reason: "Looks like OCR for Frederiksted Harbor; verify description." }],
  [840, { suggestedName: "Frederik's Knoll", confidence: "manual_review", reason: "Looks like OCR for Frederik's Knoll; verify description." }],
  [841, { suggestedName: "Frederiksted", confidence: "manual_review", reason: "Looks like OCR for Frederiksted; verify description." }],
  [848, { suggestedName: "Frederik's Harbor", confidence: "manual_review", reason: "Looks like OCR for Frederik's Harbor; verify exact entry." }],
  [849, { suggestedName: "Frederiksted", confidence: "manual_review", reason: "Looks like OCR for Frederiksted; verify exact entry." }],
  [1986, { suggestedName: "Frederik's Batterie", confidence: "manual_review", reason: "Looks like OCR for Frederik's Batterie/Battery; verify St. Thomas fort record." }],
  [2067, { suggestedName: "Rada de Frederiksted", confidence: "manual_review", reason: "Looks like Spanish/Danish harbor phrase for Frederiksted roadstead; verify." }],
]);

const rows = TARGET_INDICES.map((index) => {
  const record: any = geographicIndex[index];
  const suggestion = suggestions.get(index) || {
    suggestedName: null,
    confidence: "manual_review",
    reason: "Needs description review before changing.",
  };

  return {
    index,
    id: record?.id,
    name: record?.name,
    suggestedName: suggestion.suggestedName,
    confidence: suggestion.confidence,
    reason: suggestion.reason,
    type: record?.type,
    island: record?.island,
    coordinates: record?.coordinates ?? null,
    description: String(record?.description || "").replace(/\s+/g, " ").slice(0, 500),
    routes: record?.routes ?? null,
  };
});

const strong = rows.filter((row) => row.confidence === "strong_review");
const manual = rows.filter((row) => row.confidence !== "strong_review");

writeFileSync(
  REPORT_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: rows.length,
      strongReview: strong.length,
      manualReview: manual.length,
      rows,
    },
    null,
    2
  ) + "\n"
);

const md = [
  "# Geographic Index OCR Cleanup Batch 2 Proposal",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Total reviewed: ${rows.length}`,
  `Strong review: ${strong.length}`,
  `Manual review: ${manual.length}`,
  "",
  "## Strong review",
  "",
  "| index | current | suggested | type | island | reason | description |",
  "|---:|---|---|---|---|---|---|",
  ...strong.map(
    (row) =>
      `| ${row.index} | ${row.name} | ${row.suggestedName || ""} | ${row.type} | ${row.island} | ${row.reason} | ${row.description.replaceAll("|", "/")} |`
  ),
  "",
  "## Manual review",
  "",
  "| index | current | suggested | type | island | reason | description |",
  "|---:|---|---|---|---|---|---|",
  ...manual.map(
    (row) =>
      `| ${row.index} | ${row.name} | ${row.suggestedName || ""} | ${row.type} | ${row.island} | ${row.reason} | ${row.description.replaceAll("|", "/")} |`
  ),
  "",
].join("\n");

writeFileSync(REPORT_MD, md);

console.log("OCR cleanup batch 2 audit complete.");
console.log(`Total reviewed: ${rows.length}`);
console.log(`Strong review: ${strong.length}`);
console.log(`Manual review: ${manual.length}`);
console.log(`JSON report: ${path.relative(ROOT, REPORT_JSON)}`);
console.log(`Markdown report: ${path.relative(ROOT, REPORT_MD)}`);

console.log("\nStrong review candidates:");
console.table(
  strong.map((row) => ({
    index: row.index,
    name: row.name,
    suggestedName: row.suggestedName,
    type: row.type,
    island: row.island,
    reason: row.reason,
  }))
);

console.log("\nManual review candidates:");
console.table(
  manual.map((row) => ({
    index: row.index,
    name: row.name,
    suggestedName: row.suggestedName,
    type: row.type,
    island: row.island,
    reason: row.reason,
  }))
);
