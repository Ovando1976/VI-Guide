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
const CANDIDATE_REPORT_FILE = path.join(
  ROOT,
  "reports/geographic-index-coordinate-candidates-full.json"
);
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-geographic-index-exact-coordinate-candidates.json"
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

function hasCoordinateProperty(objectText: string) {
  return (
    /\bcoordinates\s*:\s*\{/.test(objectText) ||
    /["']coordinates["']\s*:\s*\{/.test(objectText) ||
    /\blat\s*:\s*-?\d/.test(objectText) ||
    /\blng\s*:\s*-?\d/.test(objectText) ||
    /\blatitude\s*:\s*-?\d/.test(objectText) ||
    /\blongitude\s*:\s*-?\d/.test(objectText) ||
    /\bgeometry\s*:/.test(objectText) ||
    /["']geometry["']\s*:/.test(objectText)
  );
}

function setCoordinatesInObject(objectText: string, lat: number, lng: number) {
  if (hasCoordinateProperty(objectText)) return objectText;

  const coordLine = `"coordinates": { "lat": ${lat}, "lng": ${lng} },`;

  const nullPatterns = [
    /(^[ \t]*["']coordinates["']\s*:\s*)null\s*,?/m,
    /(^[ \t]*coordinates\s*:\s*)null\s*,?/m,
    /(^[ \t]*["']center["']\s*:\s*)null\s*,?/m,
    /(^[ \t]*center\s*:\s*)null\s*,?/m,
    /(^[ \t]*["']centroid["']\s*:\s*)null\s*,?/m,
    /(^[ \t]*centroid\s*:\s*)null\s*,?/m,
  ];

  for (const pattern of nullPatterns) {
    if (pattern.test(objectText)) {
      return objectText.replace(pattern, `$1{ "lat": ${lat}, "lng": ${lng} },`);
    }
  }

  const nameMatch =
    objectText.match(/^[ \t]*(["']name["']|name)\s*:\s*["'][^"']*["']\s*,?\n/m) ||
    objectText.match(/^[ \t]*(["']title["']|title)\s*:\s*["'][^"']*["']\s*,?\n/m) ||
    objectText.match(/^[ \t]*(["']id["']|id)\s*:\s*["'][^"']*["']\s*,?\n/m);

  const indent = nameMatch?.[0]?.match(/^[ \t]*/)?.[0] || "    ";
  const line = `${indent}${coordLine}\n`;

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

  const exactCandidates = candidateReport.proposals.filter(
    (proposal: any) =>
      proposal.bestMatch &&
      proposal.bestMatch.reason === "exact_slug" &&
      Number.isFinite(proposal.bestMatch.lat) &&
      Number.isFinite(proposal.bestMatch.lng)
  );

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findArrayWithObjectCount(text, geographicIndex.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.exact-coordinate-candidates.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const applied = [];
  const skipped = [];

  const replacements = exactCandidates
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
      const afterObject = setCoordinatesInObject(
        beforeObject,
        proposal.bestMatch.lat,
        proposal.bestMatch.lng
      );

      if (afterObject === beforeObject) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "already_has_coordinates_or_no_change",
        });
        return null;
      }

      applied.push({
        index: proposal.index,
        id: proposal.id,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
        coordinates: {
          lat: proposal.bestMatch.lat,
          lng: proposal.bestMatch.lng,
        },
        candidate: {
          source: proposal.bestMatch.source,
          sourceIndex: proposal.bestMatch.sourceIndex,
          name: proposal.bestMatch.name,
          id: proposal.bestMatch.id,
          reason: proposal.bestMatch.reason,
          score: proposal.bestScore,
        },
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
        exactCandidates: exactCandidates.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Exact geographic index coordinate candidates applied.");
  console.log(`Exact candidates: ${exactCandidates.length}`);
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
      lat: record.coordinates.lat,
      lng: record.coordinates.lng,
      candidate: record.candidate.name,
      source: record.candidate.source,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();
