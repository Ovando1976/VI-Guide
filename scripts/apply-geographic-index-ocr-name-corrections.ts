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
const REPORT_FILE = path.join(ROOT, "reports/geographic-index-ocr-name-candidates.json");
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-geographic-index-ocr-name-corrections.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

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

function findGeographicIndexArray(text: string, expectedRecords: number) {
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

    if (spans.length === expectedRecords) {
      return { start, end, spans };
    }

    if (spans.length > best.spans.length) {
      best = { start, end, spans };
    }
  }

  throw new Error(
    `Could not find geographicIndex array. Closest object count: ${best.spans.length}; expected ${expectedRecords}`
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceName(objectText: string, originalName: string, proposedName: string) {
  const originalLiteral = JSON.stringify(originalName);
  const proposedLiteral = JSON.stringify(proposedName);

  const quotedNamePattern = new RegExp(
    `(["']name["']\\s*:\\s*)${escapeRegExp(originalLiteral)}`
  );

  if (quotedNamePattern.test(objectText)) {
    return objectText.replace(quotedNamePattern, `$1${proposedLiteral}`);
  }

  const bareNamePattern = new RegExp(
    `(\\bname\\s*:\\s*)${escapeRegExp(originalLiteral)}`
  );

  if (bareNamePattern.test(objectText)) {
    return objectText.replace(bareNamePattern, `$1${proposedLiteral}`);
  }

  return objectText;
}

function insertOrReplaceCoordinates(objectText: string, lat: number, lng: number) {
  const coordinateLine = `"coordinates": { "lat": ${lat}, "lng": ${lng} },`;

  if (/["']coordinates["']\s*:\s*\{/.test(objectText)) {
    return objectText;
  }

  if (/\bcoordinates\s*:\s*\{/.test(objectText)) {
    return objectText;
  }

  if (/["']coordinates["']\s*:\s*null\s*,?/.test(objectText)) {
    return objectText.replace(
      /["']coordinates["']\s*:\s*null\s*,?/,
      coordinateLine
    );
  }

  if (/\bcoordinates\s*:\s*null\s*,?/.test(objectText)) {
    return objectText.replace(
      /\bcoordinates\s*:\s*null\s*,?/,
      coordinateLine
    );
  }

  if (objectText.includes("\n")) {
    const indentMatch = objectText.match(/\{\n([ \t]+)/);
    const propIndent = indentMatch?.[1] || "  ";

    return objectText.replace("{\n", `{\n${propIndent}${coordinateLine}\n`);
  }

  return objectText.replace("{", `{ ${coordinateLine} `);
}

function main() {
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Missing file: ${INDEX_FILE}`);
  }

  if (!existsSync(REPORT_FILE)) {
    throw new Error(`Missing OCR report: ${REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const report = JSON.parse(readFileSync(REPORT_FILE, "utf8"));

  const strongCorrections = report.proposals.filter(
    (proposal: any) =>
      proposal.confidence === "strong_correction" &&
      proposal.bestMatch &&
      proposal.island &&
      proposal.bestMatch.sourceIsland &&
      proposal.island === proposal.bestMatch.sourceIsland &&
      typeof proposal.bestMatch.coordinates?.lat === "number" &&
      typeof proposal.bestMatch.coordinates?.lng === "number"
  );

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findGeographicIndexArray(text, geographicIndex.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.ocr-name-corrections.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const applied = [];
  const skipped = [];

  const replacements = strongCorrections
    .map((proposal: any) => {
      const record = geographicIndex[proposal.index];
      const span = spans[proposal.index];

      if (!record || !span) {
        skipped.push({
          index: proposal.index,
          originalName: proposal.originalName,
          reason: "record_or_span_not_found",
        });
        return null;
      }

      const match = proposal.bestMatch;
      const lat = match.coordinates.lat;
      const lng = match.coordinates.lng;

      const before = text.slice(span.start, span.end);

      let after = before;
      after = replaceName(after, proposal.originalName, match.proposedName);
      after = insertOrReplaceCoordinates(after, lat, lng);

      if (after === before) {
        skipped.push({
          index: proposal.index,
          originalName: proposal.originalName,
          proposedName: match.proposedName,
          reason: "no_text_change",
        });
        return null;
      }

      applied.push({
        index: proposal.index,
        originalName: proposal.originalName,
        proposedName: match.proposedName,
        island: proposal.island,
        sourceName: match.sourceName,
        sourceIsland: match.sourceIsland,
        sourceFile: match.sourceFile,
        score: proposal.bestScore,
        coordinates: { lat, lng },
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
    APPLY_REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceReport: path.relative(ROOT, REPORT_FILE),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        strongCandidates: strongCorrections.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
        reviewDeferred: report.proposals
          .filter((proposal: any) => proposal.confidence === "review")
          .map((proposal: any) => ({
            index: proposal.index,
            originalName: proposal.originalName,
            proposedName: proposal.bestMatch?.proposedName,
            island: proposal.island,
            sourceName: proposal.bestMatch?.sourceName,
            sourceIsland: proposal.bestMatch?.sourceIsland,
            score: proposal.bestScore,
          })),
      },
      null,
      2
    )
  );

  console.log("Geographic OCR/name corrections applied.");
  console.log(`Strong candidates: ${strongCorrections.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, APPLY_REPORT_FILE)}`);

  console.table(
    applied.map((item) => ({
      index: item.index,
      original: item.originalName,
      proposed: item.proposedName,
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
