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
const REPORT_FILE = path.join(ROOT, "reports/geographic-index-coordinate-candidates.json");
const APPLY_REPORT_FILE = path.join(
  ROOT,
  "reports/applied-island-safe-geographic-index-coordinates.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

type ObjSpan = {
  start: number;
  end: number;
};

type ArrayCandidate = {
  start: number;
  end: number;
  spans: ObjSpan[];
};

function hasUsviCoordinate(record: any): boolean {
  if (typeof record?.lat === "number" && typeof record?.lng === "number") {
    return true;
  }

  if (
    typeof record?.coordinates?.lat === "number" &&
    typeof record?.coordinates?.lng === "number"
  ) {
    return true;
  }

  if (
    typeof record?.center?.lat === "number" &&
    typeof record?.center?.lng === "number"
  ) {
    return true;
  }

  if (
    typeof record?.centroid?.lat === "number" &&
    typeof record?.centroid?.lng === "number"
  ) {
    return true;
  }

  return Boolean(record?.geometry);
}

function isWordChar(ch: string) {
  return /[A-Za-z0-9_$]/.test(ch);
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

function findGeographicIndexArray(text: string, expectedRecords: number): ArrayCandidate {
  const positions = bracketPositionsOutsideStrings(text);
  const candidates: ArrayCandidate[] = [];

  for (const start of positions) {
    const end = findMatchingBracket(text, start);
    if (end < 0) continue;

    const spans = findTopLevelObjectSpans(text, start, end);

    if (spans.length > 0) {
      candidates.push({ start, end, spans });
    }

    if (spans.length === expectedRecords) {
      return { start, end, spans };
    }
  }

  const closest = candidates
    .map((candidate) => ({
      start: candidate.start,
      end: candidate.end,
      count: candidate.spans.length,
      distance: Math.abs(candidate.spans.length - expectedRecords),
      preview: text.slice(Math.max(0, candidate.start - 80), candidate.start + 80),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  console.log("\nClosest array candidates found:");
  console.table(
    closest.map((candidate) => ({
      start: candidate.start,
      count: candidate.count,
      distance: candidate.distance,
      preview: candidate.preview.replace(/\s+/g, " ").slice(0, 120),
    }))
  );

  throw new Error(
    `Could not find source array with ${expectedRecords} top-level object records.`
  );
}

function insertCoordinates(objectText: string, lat: number, lng: number) {
  const coordinateLine = "coordinates: { lat: " + lat + ", lng: " + lng + " },";

  if (/\bcoordinates\s*:\s*\{/.test(objectText)) {
    return objectText;
  }

  if (/\blat\s*:/.test(objectText) && /\blng\s*:/.test(objectText)) {
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

    return objectText.replace("{\n", "{\n" + propIndent + coordinateLine + "\n");
  }

  return objectText.replace("{", "{ " + coordinateLine + " ");
}

function main() {
  if (!existsSync(INDEX_FILE)) {
    throw new Error(`Missing geographic index file: ${INDEX_FILE}`);
  }

  if (!existsSync(REPORT_FILE)) {
    throw new Error(`Missing candidate report: ${REPORT_FILE}`);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });

  const report = JSON.parse(readFileSync(REPORT_FILE, "utf8"));

  const safeProposals = report.proposals.filter((proposal: any) => {
    const confidenceOk = ["exact", "strong"].includes(proposal.confidence);
    const match = proposal.bestMatch;

    if (!confidenceOk || !match) return false;

    if (
      proposal.island &&
      match.sourceIsland &&
      proposal.island !== match.sourceIsland
    ) {
      return false;
    }

    return (
      typeof match.coordinates?.lat === "number" &&
      typeof match.coordinates?.lng === "number"
    );
  });

  const text = readFileSync(INDEX_FILE, "utf8");
  const arrayCandidate = findGeographicIndexArray(text, geographicIndex.length);
  const spans = arrayCandidate.spans;

  console.log("Located geographicIndex source array.");
  console.table({
    records: geographicIndex.length,
    objectSpans: spans.length,
    arrayStart: arrayCandidate.start,
    arrayEnd: arrayCandidate.end,
  });

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.island-safe-coordinates.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const applied: any[] = [];
  const skipped: any[] = [];

  const replacements = safeProposals
    .map((proposal: any) => {
      const record = geographicIndex[proposal.index];
      const span = spans[proposal.index];

      if (!record || !span) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "record_or_span_not_found",
        });
        return null;
      }

      if (hasUsviCoordinate(record)) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "already_has_coordinates",
        });
        return null;
      }

      const match = proposal.bestMatch;
      const lat = match.coordinates.lat;
      const lng = match.coordinates.lng;

      const before = text.slice(span.start, span.end);
      const after = insertCoordinates(before, lat, lng);

      if (before === after) {
        skipped.push({
          index: proposal.index,
          name: proposal.name,
          reason: "no_text_change",
        });
        return null;
      }

      applied.push({
        index: proposal.index,
        name: proposal.name,
        island: proposal.island,
        confidence: proposal.confidence,
        score: proposal.bestScore,
        match: match.sourceName,
        sourceIsland: match.sourceIsland,
        sourceFile: match.sourceFile,
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
        safeCandidates: safeProposals.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("\nIsland-safe geographic index coordinates applied.");
  console.log(`Safe candidates: ${safeProposals.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, APPLY_REPORT_FILE)}`);

  console.table(
    applied.map((item) => ({
      index: item.index,
      name: item.name,
      island: item.island,
      confidence: item.confidence,
      match: item.match,
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
