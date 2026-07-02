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
    reason: "OCR cleanup: Xary's -> Mary's",
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
    reason: "OCR cleanup: Kalabasboom -> Calabash Boom",
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
    reason: "OCR cleanup: IZaab -> shaab",
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
    reason: "OCR cleanup: Judy's -> Judith's",
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
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function findArrayStart(text: string): number {
  const marker = text.indexOf("geographicIndex");
  if (marker < 0) throw new Error("Could not find geographicIndex marker.");

  const start = text.indexOf("[", marker);
  if (start < 0) throw new Error("Could not find geographicIndex array start.");

  return start;
}

function findObjectBlocks(text: string) {
  const arrayStart = findArrayStart(text);
  const blocks = [];

  let depth = 0;
  let objectStart = -1;
  let quote: string | null = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = arrayStart; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") {
      if (depth === 0) objectStart = i;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0 && objectStart >= 0) {
        blocks.push({ start: objectStart, end: i });
        objectStart = -1;
      }

      continue;
    }

    if (char === "]" && depth === 0 && blocks.length > 0) {
      break;
    }
  }

  return blocks;
}

function replaceNameLine(block: string, nextName: string) {
  const lines = block.split("\n");
  const nameLineIndex = lines.findIndex((line) =>
    /^\s*(?:"name"|name)\s*:/.test(line)
  );

  if (nameLineIndex < 0) {
    return {
      changed: false,
      block,
      reason: "missing_name_line",
    };
  }

  const oldLine = lines[nameLineIndex];
  const indent = oldLine.match(/^\s*/)?.[0] ?? "";
  const trailingComma = oldLine.trimEnd().endsWith(",") ? "," : "";

  lines[nameLineIndex] = `${indent}name: ${JSON.stringify(nextName)}${trailingComma}`;

  return {
    changed: true,
    block: lines.join("\n"),
    reason: "name_replaced",
  };
}

function insertAliasIfMissing(block: string, oldName: string) {
  if (/(^|\n)\s*(?:"aliases"|aliases)\s*:/.test(block)) {
    return block;
  }

  const lines = block.split("\n");
  const nameLineIndex = lines.findIndex((line) =>
    /^\s*(?:"name"|name)\s*:/.test(line)
  );

  if (nameLineIndex < 0) return block;

  const indent = lines[nameLineIndex].match(/^\s*/)?.[0] ?? "  ";
  lines.splice(nameLineIndex + 1, 0, `${indent}aliases: [${JSON.stringify(oldName)}],`);

  return lines.join("\n");
}

function insertCleanupNoteIfMissing(block: string, oldName: string, reason: string) {
  if (block.includes("ocrCorrectedFrom")) return block;

  const lines = block.split("\n");
  const nameLineIndex = lines.findIndex((line) =>
    /^\s*(?:"name"|name)\s*:/.test(line)
  );

  if (nameLineIndex < 0) return block;

  const indent = lines[nameLineIndex].match(/^\s*/)?.[0] ?? "  ";

  lines.splice(
    nameLineIndex + 1,
    0,
    `${indent}ocrCorrectedFrom: ${JSON.stringify(oldName)},`,
    `${indent}ocrCorrectionReason: ${JSON.stringify(reason)},`
  );

  return lines.join("\n");
}

if (!existsSync(TARGET_FILE)) {
  throw new Error(`Missing target file: ${TARGET_FILE}`);
}

mkdirSync(BACKUP_DIR, { recursive: true });

const originalText = readFileSync(TARGET_FILE, "utf8");
const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.safe-ocr-cleanups.${timestampSlug()}.ts`
);

writeFileSync(backupFile, originalText);

const blocks = findObjectBlocks(originalText);
if (blocks.length !== geographicIndex.length) {
  throw new Error(
    `Object block count mismatch. Blocks: ${blocks.length}; geographicIndex records: ${geographicIndex.length}`
  );
}

const appliedRecords = [];
const skippedRecords = [];
const replacements = [];

for (const fix of SAFE_NAME_FIXES) {
  const record = geographicIndex[fix.index];

  if (!record) {
    skippedRecords.push({
      ...fix,
      status: "skipped",
      reason: "missing_record_at_index",
    });
    continue;
  }

  if (record.name !== fix.currentName) {
    skippedRecords.push({
      ...fix,
      foundName: record.name,
      status: "skipped",
      reason: "current_name_mismatch",
    });
    continue;
  }

  const blockInfo = blocks[fix.index];
  if (!blockInfo) {
    skippedRecords.push({
      ...fix,
      status: "skipped",
      reason: "missing_source_block",
    });
    continue;
  }

  let block = originalText.slice(blockInfo.start, blockInfo.end + 1);

  if (!new RegExp(`name\\s*:\\s*["'\`]${escapeRegExp(fix.currentName)}`).test(block)) {
    skippedRecords.push({
      ...fix,
      status: "skipped",
      reason: "source_block_name_mismatch",
    });
    continue;
  }

  const replaced = replaceNameLine(block, fix.suggestedName);

  if (!replaced.changed) {
    skippedRecords.push({
      ...fix,
      status: "skipped",
      reason: replaced.reason,
    });
    continue;
  }

  block = replaced.block;
  block = insertAliasIfMissing(block, fix.currentName);
  block = insertCleanupNoteIfMissing(block, fix.currentName, fix.reason);

  replacements.push({
    start: blockInfo.start,
    end: blockInfo.end + 1,
    nextBlock: block,
  });

  appliedRecords.push({
    ...fix,
    id: record.id ?? "",
    type: record.type ?? "",
    island: record.island ?? "",
    status: "applied",
  });
}

let nextText = originalText;

for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
  nextText =
    nextText.slice(0, replacement.start) +
    replacement.nextBlock +
    nextText.slice(replacement.end);
}

writeFileSync(TARGET_FILE, nextText);

const report = {
  generatedAt: new Date().toISOString(),
  targetFile: path.relative(ROOT, TARGET_FILE),
  backupFile: path.relative(ROOT, backupFile),
  reviewedAllowlist: SAFE_NAME_FIXES.length,
  applied: appliedRecords.length,
  skipped: skippedRecords.length,
  appliedRecords,
  skippedRecords,
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

console.log("Safe geographic index OCR cleanups applied.");
console.log(`Reviewed allowlist: ${report.reviewedAllowlist}`);
console.log(`Applied: ${report.applied}`);
console.log(`Skipped: ${report.skipped}`);
console.log(`Backup: ${report.backupFile}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

console.table(
  appliedRecords.map((record) => ({
    index: record.index,
    from: record.currentName,
    to: record.suggestedName,
    type: record.type,
    island: record.island,
  }))
);

if (skippedRecords.length) {
  console.log("\nSkipped:");
  console.table(skippedRecords);
}
