// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const INDEX_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-island-safe-geographic-index-coordinates.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");
const REPAIR_REPORT_FILE = path.join(
  ROOT,
  "reports/repaired-geographic-index-coordinate-duplicates.json"
);

type ObjSpan = {
  start: number;
  end: number;
};

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

function findTopLevelObjectSpans(
  text: string,
  arrayStart: number,
  arrayEnd: number
): ObjSpan[] {
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

    if (ch === "[") {
      positions.push(i);
    }
  }

  return positions;
}

function findLargestObjectArray(text: string) {
  const positions = bracketPositionsOutsideStrings(text);
  let best = {
    start: -1,
    end: -1,
    spans: [] as ObjSpan[],
  };

  for (const start of positions) {
    const end = findMatchingBracket(text, start);
    if (end < 0) continue;

    const spans = findTopLevelObjectSpans(text, start, end);

    if (spans.length > best.spans.length) {
      best = { start, end, spans };
    }
  }

  if (!best.spans.length) {
    throw new Error("Could not find geographicIndex object array.");
  }

  return best;
}

function repairObjectText(objectText: string) {
  if (!/\bcoordinates\s*:\s*\{/.test(objectText)) {
    return objectText;
  }

  return objectText.replace(
    /\n[ \t]*["']coordinates["']\s*:\s*null\s*,?/g,
    ""
  );
}

function main() {
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Missing file: ${INDEX_FILE}`);
  }

  if (!existsSync(APPLY_REPORT_FILE)) {
    throw new Error(`Missing apply report: ${APPLY_REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const text = readFileSync(INDEX_FILE, "utf8");
  const applyReport = JSON.parse(readFileSync(APPLY_REPORT_FILE, "utf8"));
  const appliedRecords = applyReport.appliedRecords || [];

  const array = findLargestObjectArray(text);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.duplicate-coordinate-repair.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const repaired = [];
  const skipped = [];

  const replacements = appliedRecords
    .map((record: any) => {
      const span = spans[record.index];

      if (!span) {
        skipped.push({
          index: record.index,
          name: record.name,
          reason: "span_not_found",
        });
        return null;
      }

      const before = text.slice(span.start, span.end);
      const after = repairObjectText(before);

      if (before === after) {
        skipped.push({
          index: record.index,
          name: record.name,
          reason: "no_duplicate_coordinates_null_found",
        });
        return null;
      }

      repaired.push({
        index: record.index,
        name: record.name,
        island: record.island,
        coordinates: record.coordinates,
      });

      return {
        start: span.start,
        end: span.end,
        replacement: after,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.start - a.start);

  let nextText = text;

  for (const replacement of replacements) {
    nextText =
      nextText.slice(0, replacement.start) +
      replacement.replacement +
      nextText.slice(replacement.end);
  }

  writeFileSync(INDEX_FILE, nextText);

  writeFileSync(
    REPAIR_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        sourceApplyReport: path.relative(ROOT, APPLY_REPORT_FILE),
        attempted: appliedRecords.length,
        repaired: repaired.length,
        skipped: skipped.length,
        repairedRecords: repaired,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Geographic index duplicate coordinate placeholders repaired.");
  console.log(`Attempted: ${appliedRecords.length}`);
  console.log(`Repaired: ${repaired.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPAIR_REPORT_FILE)}`);

  console.table(
    repaired.map((item) => ({
      index: item.index,
      name: item.name,
      island: item.island,
      lat: item.coordinates.lat,
      lng: item.coordinates.lng,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();
