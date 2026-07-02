// @ts-nocheck

import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const REPORT_JSON = path.join(ROOT, "reports/geographic-index-ocr-cleanup-next.json");
const REPORT_MD = path.join(ROOT, "reports/geographic-index-ocr-cleanup-next.md");

mkdirSync(path.join(ROOT, "reports"), { recursive: true });

const suspiciousPatterns = [
  /[A-Z][a-z]*[A-Z][a-z]+/,       // mixed OCR casing inside word
  /\b[Bb]lg\b/,
  /\b[Ff]aat\b/,
  /\b[Ee]sp[Bb]rance\b/,
  /\b[Bb]ordeouo\b/,
  /\b[Bb]orpenfrei\b/,
  /\b[Cc]ahritahorn\b/,
  /\b[Cc]abriteberg P o C t\b/,
  /\b[Cc]aetelpolnt\b/,
  /\b[Bb]taZley\b/,
  /\b[Bb]twmphfar\b/,
  /\b[Ff]ointe\b/,
  /\b[Nn]ordoueete\b/,
  /\b[Ff]redertksfort\b/,
  /\b[Ff]rederikalort\b/,
  /\b[Ff]orturrr\b/,
  /\b[Ee]ostcnd\b/,
  /\b[Ee]niqhed\b/,
  /\b[Ee]upert\b/,
  /\b[Dd]etlcr\b/,
  /\b[Dd]oill\b/,
  /\bIIiZl\b/,
  /\b[Ff]iigrlsk\b/,
  /\bKlrke\b/,
  /\bH i l l\b/,
  /\bP o i n t\b/,
  /\bP d n t\b/,
  /\bPasw ge\b/,
  /\bChannd\b/,
];

const safeSuggestions = new Map([
  ["Blg Faat Cay", "Big Flat Cay"],
  ["Bonne EspBrance", "Bonne Esperance"],
  ["Bordeouo plantation", "Bordeaux plantation"],
  ["Borpenfrei", "Borgenfrei"],
  ["Buona Viata", "Buona Vista"],
  ["Busna Eaperanza", "Buena Esperanza"],
  ["Cabriteberg P o C t", "Cabriteberg Point"],
  ["Cahritahorn Point", "Cabritahorn Point"],
  ["Caetelpolnt", "Castle Point"],
  ["Fointe dol Nordoueete", "Pointe du Nordoueste"],
  ["Fredertksfort", "Frederiksfort"],
  ["Frederikalort", "Frederiksfort"],
  ["Flag H i l l", "Flag Hill"],
  ["Frederik P o i n t", "Frederik Point"],
  ["Flanagan Pasw ge", "Flanagan Passage"],
  ["Durloe Channd", "Durloe Channel"],
  ["E'ostcnd Cape", "Eastend Cape"],
]);

const rows = geographicIndex
  .map((record: any, index: number) => {
    const name = String(record.name || "");
    const suggestion = safeSuggestions.get(name) || null;
    const suspicious = suspiciousPatterns.some((pattern) => pattern.test(name));

    if (!suspicious && !suggestion) return null;

    return {
      index,
      id: record.id,
      name,
      suggestedName: suggestion,
      type: record.type,
      island: record.island,
      coordinates: record.coordinates ?? null,
      description: String(record.description || "").slice(0, 240),
      confidence: suggestion ? "safe_review" : "needs_manual_review",
    };
  })
  .filter(Boolean);

const safe = rows.filter((row) => row.confidence === "safe_review");
const manual = rows.filter((row) => row.confidence === "needs_manual_review");

writeFileSync(
  REPORT_JSON,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: rows.length,
      safeReview: safe.length,
      needsManualReview: manual.length,
      rows,
    },
    null,
    2
  )
);

const md = [
  "# Geographic Index OCR Cleanup Next",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Total candidates: ${rows.length}`,
  `Safe review candidates: ${safe.length}`,
  `Manual review candidates: ${manual.length}`,
  "",
  "## Safe review candidates",
  "",
  "| index | current | suggested | type | island |",
  "|---:|---|---|---|---|",
  ...safe.map(
    (row) =>
      `| ${row.index} | ${row.name} | ${row.suggestedName} | ${row.type} | ${row.island} |`
  ),
  "",
  "## Manual review candidates",
  "",
  "| index | current | type | island |",
  "|---:|---|---|---|",
  ...manual.slice(0, 120).map(
    (row) => `| ${row.index} | ${row.name} | ${row.type} | ${row.island} |`
  ),
  "",
].join("\n");

writeFileSync(REPORT_MD, md);

console.log("OCR cleanup audit complete.");
console.log(`Total candidates: ${rows.length}`);
console.log(`Safe review candidates: ${safe.length}`);
console.log(`Manual review candidates: ${manual.length}`);
console.log(`JSON report: ${path.relative(ROOT, REPORT_JSON)}`);
console.log(`Markdown report: ${path.relative(ROOT, REPORT_MD)}`);

console.log("\nSafe review candidates:");
console.table(
  safe.map((row) => ({
    index: row.index,
    name: row.name,
    suggestedName: row.suggestedName,
    type: row.type,
    island: row.island,
  }))
);

console.log("\nManual review sample:");
console.table(
  manual.slice(0, 40).map((row) => ({
    index: row.index,
    name: row.name,
    type: row.type,
    island: row.island,
  }))
);
