// @ts-nocheck

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/applied-safe-geographic-index-ocr-cleanups.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const SAFE_NAME_FIXES = [
  {
    index: 1675,
    currentName: "Mount Stkwart",
    suggestedName: "Mount Stewart",
    reason: "OCR cleanup: Stkwart -> Stewart",
  },
  {
    index: 2397,
    currentName: "Springfleld",
    suggestedName: "Springfield",
    reason: "OCR cleanup: fleld -> field",
  },
  {
    index: 2780,
    currentName: "Xary's Fancy",
    suggestedName: "Mary's Fancy",
    reason: "OCR cleanup: Xary -> Mary",
  },
  {
    index: 2566,
    currentName: "Turtle 40ve Cay",
    suggestedName: "Turtle Dove Cay",
    reason: "OCR cleanup: 40ve -> Dove",
  },
  {
    index: 1242,
    currentName: "Kalabasboom",
    suggestedName: "Calabash Boom",
    reason: "OCR cleanup: normalized estate name",
  },
  {
    index: 1633,
    currentName: "Moalpellier",
    suggestedName: "Montpellier",
    reason: "OCR cleanup: Moalpellier -> Montpellier",
  },
  {
    index: 2767,
    currentName: "Wwck and Rest",
    suggestedName: "Work & Rest",
    reason: "OCR cleanup: Wwck -> Work",
  },
  {
    index: 852,
    currentName: "Fredericks IZaab",
    suggestedName: "Frederikshaab",
    reason: "OCR cleanup: historic estate spelling",
  },
  {
    index: 1079,
    currentName: "Hnvensigt",
    suggestedName: "Havensight",
    reason: "OCR cleanup: Hnvensigt -> Havensight",
  },
  {
    index: 1527,
    currentName: "Lowelund",
    suggestedName: "Lovenlund",
    reason: "OCR cleanup: Lowelund -> Lovenlund",
  },
  {
    index: 1231,
    currentName: "Judy's Fancy",
    suggestedName: "Judith's Fancy",
    reason: "OCR cleanup: Judy -> Judith",
  },
  {
    index: 1507,
    currentName: "Longmat",
    suggestedName: "Langmath",
    reason: "OCR cleanup: Longmat -> Langmath",
  },
  {
    index: 555,
    currentName: "Cotkongxove Bay",
    suggestedName: "Cotton Grove Bay",
    reason: "OCR cleanup: Cotkongxove -> Cotton Grove",
  },
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeSingle(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function escapeBacktick(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function literalPattern(value: string) {
  return [
    escapeRegExp(JSON.stringify(value)),
    `'${escapeRegExp(escapeSingle(value))}'`,
    "`" + escapeRegExp(escapeBacktick(value)) + "`",
  ].join("|");
}

if (!existsSync(TARGET_FILE)) {
  throw new Error(`Missing ${TARGET_FILE}`);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const beforeByIndex = new Map(
  geographicIndex.map((record: any, index: number) => [index, record])
);

let source = readFileSync(TARGET_FILE, "utf8");
const beforeSource = source;

const applied = [];
const skipped = [];

for (const fix of SAFE_NAME_FIXES) {
  const runtimeRecord = beforeByIndex.get(fix.index);

  if (!runtimeRecord) {
    skipped.push({
      ...fix,
      status: "skipped",
      skipReason: "index_not_found_in_runtime_geographic_index",
    });
    continue;
  }

  if (runtimeRecord.name !== fix.currentName) {
    skipped.push({
      ...fix,
      runtimeName: runtimeRecord.name,
      status: "skipped",
      skipReason: "runtime_name_mismatch",
    });
    continue;
  }

  const pattern = new RegExp(
    `(["']?name["']?\\s*:\\s*)(${literalPattern(fix.currentName)})`,
    "g"
  );

  let replacements = 0;
  source = source.replace(pattern, (_match, prefix) => {
    replacements += 1;
    return `${prefix}${JSON.stringify(fix.suggestedName)}`;
  });

  if (replacements < 1) {
    skipped.push({
      ...fix,
      runtimeName: runtimeRecord.name,
      status: "skipped",
      skipReason: "source_name_property_not_found",
    });
    continue;
  }

  applied.push({
    ...fix,
    runtimeName: runtimeRecord.name,
    replacements,
    status: "applied",
  });
}

if (source !== beforeSource) {
  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.safe-ocr-cleanups.${timestamp()}.ts`
  );
  writeFileSync(backupFile, beforeSource);
  writeFileSync(TARGET_FILE, source);
}

const report = {
  generatedAt: new Date().toISOString(),
  targetFile: path.relative(ROOT, TARGET_FILE),
  reviewedAllowlist: SAFE_NAME_FIXES.length,
  applied: applied.length,
  skipped: skipped.length,
  appliedRecords: applied,
  skippedRecords: skipped,
};

writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

console.log("Safe geographic index OCR cleanups applied.");
console.log(`Reviewed allowlist: ${SAFE_NAME_FIXES.length}`);
console.log(`Applied: ${applied.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

console.log("\nApplied:");
console.table(
  applied.map((row) => ({
    index: row.index,
    currentName: row.currentName,
    suggestedName: row.suggestedName,
    replacements: row.replacements,
  }))
);

if (skipped.length) {
  console.log("\nSkipped:");
  console.table(
    skipped.map((row) => ({
      index: row.index,
      currentName: row.currentName,
      suggestedName: row.suggestedName,
      runtimeName: row.runtimeName,
      skipReason: row.skipReason,
    }))
  );
}
