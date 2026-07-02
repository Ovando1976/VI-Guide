// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();

const INDEX_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const DUPLICATES_REPORT_FILE = path.join(ROOT, "reports/geographic-index-duplicates.json");
const OCR_APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-geographic-index-ocr-name-corrections.json"
);
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/merged-geographic-index-ocr-duplicates.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

type ObjSpan = {
  start: number;
  end: number;
};

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown) {
  return stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findMatchingBracket(text: string, openIndex: number) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") depth += 1;

    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findTopLevelObjectSpans(text: string, arrayStart: number, arrayEnd: number): ObjSpan[] {
  const spans: ObjSpan[] = [];

  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let objectDepth = 0;
  let bracketDepth = 0;
  let objectStart = -1;

  for (let i = arrayStart + 1; i < arrayEnd; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }

    if (ch === "]") {
      bracketDepth -= 1;
      continue;
    }

    if (ch === "{") {
      if (objectDepth === 0 && bracketDepth === 0) {
        objectStart = i;
      }

      objectDepth += 1;
      continue;
    }

    if (ch === "}") {
      objectDepth -= 1;

      if (objectDepth === 0 && bracketDepth === 0 && objectStart >= 0) {
        spans.push({ start: objectStart, end: i + 1 });
        objectStart = -1;
      }
    }
  }

  return spans;
}

function bracketPositionsOutsideStrings(text: string): number[] {
  const positions: number[] = [];

  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      if (ch === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (ch === "*" && next === "/") {
        blockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = "";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      lineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      blockComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "[") positions.push(i);
  }

  return positions;
}

function findGeographicIndexArray(text: string, expectedRecords: number) {
  const positions = bracketPositionsOutsideStrings(text);

  for (const start of positions) {
    const end = findMatchingBracket(text, start);
    if (end < 0) continue;

    const spans = findTopLevelObjectSpans(text, start, end);
    if (spans.length === expectedRecords) return { start, end, spans };
  }

  throw new Error(`Could not find geographicIndex array with ${expectedRecords} records.`);
}

function parseAliasesFromObjectText(objectText: string): string[] {
  const match = objectText.match(/["']aliases["']\s*:\s*$begin:math:display$\(\[\\s\\S\]\*\?\)$end:math:display$/);
  if (!match) return [];

  const rawItems = match[1].match(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g) || [];

  return rawItems
    .map((item) => {
      try {
        return JSON.parse(item.replace(/^'/, '"').replace(/'$/, '"'));
      } catch {
        return item.slice(1, -1);
      }
    })
    .filter(Boolean);
}

function upsertAliases(objectText: string, aliasesToAdd: string[]) {
  const existingAliases = parseAliasesFromObjectText(objectText);
  const allAliases = [...existingAliases];

  for (const alias of aliasesToAdd) {
    if (!alias) continue;

    if (!allAliases.some((existing) => normalize(existing) === normalize(alias))) {
      allAliases.push(alias);
    }
  }

  const aliasLine = `"aliases": ${JSON.stringify(allAliases)},`;

  if (/["']aliases["']\s*:\s*$begin:math:display$\[\\s\\S\]\*\?$end:math:display$\s*,?/.test(objectText)) {
    return objectText.replace(/["']aliases["']\s*:\s*$begin:math:display$\[\\s\\S\]\*\?$end:math:display$\s*,?/, aliasLine);
  }

  if (objectText.includes("\n")) {
    const indentMatch = objectText.match(/\{\n([ \t]+)/);
    const propIndent = indentMatch?.[1] || "  ";
    return objectText.replace("{\n", `{\n${propIndent}${aliasLine}\n`);
  }

  return objectText.replace("{", `{ ${aliasLine} `);
}

function deletionRange(text: string, span: ObjSpan) {
  let start = span.start;
  let end = span.end;

  while (end < text.length && /\s/.test(text[end])) end += 1;

  if (text[end] === ",") {
    end += 1;
    while (end < text.length && /[ \t]/.test(text[end])) end += 1;
    if (text[end] === "\n") end += 1;
    return { start, end };
  }

  let before = start - 1;
  while (before >= 0 && /[ \t]/.test(text[before])) before -= 1;

  if (text[before] === ",") {
    start = before;
    while (start > 0 && text[start - 1] !== "\n") start -= 1;
  }

  return { start, end };
}

function main() {
  if (!existsSync(INDEX_FILE)) throw new Error(`Missing file: ${INDEX_FILE}`);
  if (!existsSync(DUPLICATES_REPORT_FILE)) {
    throw new Error(`Missing duplicate report: ${DUPLICATES_REPORT_FILE}`);
  }
  if (!existsSync(OCR_APPLY_REPORT_FILE)) {
    throw new Error(`Missing OCR apply report: ${OCR_APPLY_REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const duplicateReport = JSON.parse(readFileSync(DUPLICATES_REPORT_FILE, "utf8"));
  const ocrApplyReport = JSON.parse(readFileSync(OCR_APPLY_REPORT_FILE, "utf8"));

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findGeographicIndexArray(text, geographicIndex.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.ocr-duplicate-merge.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const plans = [];

  for (const applied of ocrApplyReport.appliedRecords || []) {
    const group = duplicateReport.duplicates.find((item: any) =>
      item.records.some((record: any) => record.index === applied.index)
    );

    if (!group) continue;

    const source = group.records.find((record: any) => record.index === applied.index);
    const target = group.records.find((record: any) => record.index !== applied.index);

    if (!source || !target) continue;

    plans.push({
      sourceIndex: source.index,
      sourceId: source.id,
      sourceName: source.name,
      targetIndex: target.index,
      targetId: target.id,
      targetName: target.name,
      island: source.island,
      aliasesToAdd: [applied.originalName, applied.proposedName, source.name].filter(Boolean),
    });
  }

  const replacements = [];
  const merged = [];
  const skipped = [];

  for (const plan of plans) {
    const sourceSpan = spans[plan.sourceIndex];
    const targetSpan = spans[plan.targetIndex];

    if (!sourceSpan || !targetSpan) {
      skipped.push({ ...plan, reason: "missing_source_or_target_span" });
      continue;
    }

    const targetBefore = text.slice(targetSpan.start, targetSpan.end);
    const targetAfter = upsertAliases(targetBefore, plan.aliasesToAdd);

    if (targetAfter !== targetBefore) {
      replacements.push({
        start: targetSpan.start,
        end: targetSpan.end,
        replacement: targetAfter,
      });
    }

    const remove = deletionRange(text, sourceSpan);

    replacements.push({
      start: remove.start,
      end: remove.end,
      replacement: "",
    });

    merged.push(plan);
  }

  replacements.sort((a, b) => b.start - a.start);

  let nextText = text;

  for (const replacement of replacements) {
    nextText =
      nextText.slice(0, replacement.start) +
      replacement.replacement +
      nextText.slice(replacement.end);
  }

  writeFileSync(INDEX_FILE, nextText);

  writeFileSync(
    APPLY_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        sourceDuplicateReport: path.relative(ROOT, DUPLICATES_REPORT_FILE),
        sourceOcrApplyReport: path.relative(ROOT, OCR_APPLY_REPORT_FILE),
        planned: plans.length,
        merged: merged.length,
        skipped: skipped.length,
        mergedRecords: merged,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Geographic OCR duplicate records merged.");
  console.log(`Planned: ${plans.length}`);
  console.log(`Merged: ${merged.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, APPLY_REPORT_FILE)}`);

  console.table(
    merged.map((item) => ({
      removeIndex: item.sourceIndex,
      remove: item.sourceId,
      keepIndex: item.targetIndex,
      keep: item.targetId,
      aliasesAdded: item.aliasesToAdd.join(" | "),
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();
