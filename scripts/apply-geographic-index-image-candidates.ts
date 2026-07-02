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
const CANDIDATE_REPORT_FILE = path.join(ROOT, "reports/geographic-index-image-candidates.json");
const APPLY_REPORT_FILE = path.join(ROOT, "reports/applied-geographic-index-image-candidates.json");
const BACKUP_DIR = path.join(ROOT, "reports/backups");

type ObjSpan = {
  start: number;
  end: number;
};

function pathExistsFromPublic(publicPath: string) {
  if (!publicPath || typeof publicPath !== "string") return false;

  const clean = publicPath.split("?")[0].trim();
  if (!clean.startsWith("/")) return false;

  return existsSync(path.join(ROOT, "public", clean.slice(1)));
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
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
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
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
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
      if (objectDepth === 0 && bracketDepth === 0) objectStart = i;
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
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
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

function findArrayWithObjectCount(text: string, expectedRecords: number) {
  let best = { start: -1, end: -1, spans: [] as ObjSpan[] };

  for (const start of bracketPositionsOutsideStrings(text)) {
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

function setImageInObject(objectText: string, imagePath: string) {
  const imageLiteral = JSON.stringify(imagePath);

  const propPatterns = [
    /(^[ \t]*["']imageUrl["']\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*imageUrl\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*["']image["']\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*image\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*["']localImage["']\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*localImage\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*["']thumbnail["']\s*:\s*)(["'][^"']*["'])/m,
    /(^[ \t]*thumbnail\s*:\s*)(["'][^"']*["'])/m,
  ];

  for (const pattern of propPatterns) {
    if (pattern.test(objectText)) {
      return objectText.replace(pattern, `$1${imageLiteral}`);
    }
  }

  const nameMatch =
    objectText.match(/^[ \t]*(["']name["']|name)\s*:\s*["'][^"']*["']\s*,?\n/m) ||
    objectText.match(/^[ \t]*(["']title["']|title)\s*:\s*["'][^"']*["']\s*,?\n/m) ||
    objectText.match(/^[ \t]*(["']id["']|id)\s*:\s*["'][^"']*["']\s*,?\n/m);

  const indent = nameMatch?.[0]?.match(/^[ \t]*/)?.[0] || "    ";
  const line = `${indent}"imageUrl": ${imageLiteral},\n`;

  if (nameMatch && typeof nameMatch.index === "number") {
    const insertAt = nameMatch.index + nameMatch[0].length;
    return objectText.slice(0, insertAt) + line + objectText.slice(insertAt);
  }

  return objectText.replace("{\n", "{\n" + line);
}

function main() {
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Missing file: ${INDEX_FILE}`);
  }

  if (!existsSync(CANDIDATE_REPORT_FILE)) {
    throw new Error(`Missing candidate report: ${CANDIDATE_REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const candidateReport = JSON.parse(readFileSync(CANDIDATE_REPORT_FILE, "utf8"));

  const safeCandidates = candidateReport.proposals.filter(
    (proposal: any) =>
      ["exact", "strong"].includes(proposal.confidence) &&
      proposal.bestMatch?.publicPath &&
      pathExistsFromPublic(proposal.bestMatch.publicPath)
  );

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findArrayWithObjectCount(text, geographicIndex.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.image-candidates.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const applied = [];
  const skipped = [];

  const replacements = safeCandidates
    .map((proposal: any) => {
      const span = spans[proposal.index];

      if (!span) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "record_span_not_found",
        });
        return null;
      }

      const beforeObject = text.slice(span.start, span.end);
      const afterObject = setImageInObject(beforeObject, proposal.bestMatch.publicPath);

      if (afterObject === beforeObject) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "no_change",
        });
        return null;
      }

      applied.push({
        index: proposal.index,
        id: proposal.id,
        geoid: proposal.geoid,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
        imageUrl: proposal.bestMatch.publicPath,
        confidence: proposal.confidence,
        score: proposal.bestScore,
        reason: proposal.bestMatch.reason,
        matchedOn: proposal.bestMatch.matchedOn,
      });

      return {
        start: span.start,
        end: span.end,
        replacement: afterObject,
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
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        candidateReport: path.relative(ROOT, CANDIDATE_REPORT_FILE),
        safeCandidates: safeCandidates.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
        deferredNoCandidate: candidateReport.proposals
          .filter((proposal: any) => proposal.confidence === "none")
          .map((proposal: any) => ({
            index: proposal.index,
            id: proposal.id,
            name: proposal.name,
            type: proposal.type,
            island: proposal.island,
          })),
      },
      null,
      2
    )
  );

  console.log("Geographic index image candidates applied.");
  console.log(`Safe candidates: ${safeCandidates.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, APPLY_REPORT_FILE)}`);

  console.table(
    applied.map((record) => ({
      index: record.index,
      name: record.name,
      type: record.type,
      island: record.island,
      image: record.imageUrl,
      confidence: record.confidence,
      score: record.score,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();
