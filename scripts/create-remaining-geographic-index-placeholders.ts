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
const PLACEHOLDER_DIR = path.join(ROOT, "public/images/geographicIndex/placeholders");
const BACKUP_DIR = path.join(ROOT, "reports/backups");
const REPORT_FILE = path.join(
  ROOT,
  "reports/created-remaining-geographic-index-placeholders.json"
);

const REMAINING = [
  {
    index: 822,
    name: "Fort Nt",
    type: "historic",
    island: "st_thomas",
  },
  {
    index: 2406,
    name: "St",
    type: "historic",
    island: "st_croix",
  },
];

type ObjSpan = {
  start: number;
  end: number;
};

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slug(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[’‘]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function islandLabel(island: string) {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  if (island === "water_island") return "Water Island";
  return "U.S. Virgin Islands";
}

function typeLabel(type: string) {
  if (type === "historic") return "Historic Record";
  if (type === "beach") return "Beach Record";
  if (type === "estate") return "Estate Record";
  return "Geographic Record";
}

function xmlEscape(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function makeSvg(item: any) {
  const title = xmlEscape(item.name);
  const island = xmlEscape(islandLabel(item.island));
  const type = xmlEscape(typeLabel(item.type));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7e9ca"/>
      <stop offset="55%" stop-color="#e3c88f"/>
      <stop offset="100%" stop-color="#b98445"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="68%">
      <stop offset="0%" stop-color="#fff7da" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#6f3f1d" stop-opacity="0.14"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#paper)"/>
  <rect x="44" y="44" width="1112" height="712" rx="34" fill="url(#glow)" stroke="#70451f" stroke-width="5"/>
  <path d="M156 204 C304 130 438 218 598 158 C748 102 884 168 1038 122" fill="none" stroke="#70451f" stroke-width="7" opacity="0.24"/>
  <path d="M160 606 C320 530 472 648 612 582 C752 516 890 580 1040 520" fill="none" stroke="#70451f" stroke-width="7" opacity="0.2"/>
  <circle cx="600" cy="226" r="86" fill="none" stroke="#70451f" stroke-width="9" opacity="0.45"/>
  <path d="M600 152 L622 214 L690 216 L636 256 L656 322 L600 284 L544 322 L564 256 L510 216 L578 214 Z" fill="#70451f" opacity="0.42"/>
  <text x="600" y="365" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#332212">${title}</text>
  <text x="600" y="430" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="4" fill="#5e3719">${type}</text>
  <text x="600" y="500" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="#4b3018">${island}</text>
  <text x="600" y="620" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#70451f" opacity="0.82">Fallback image · replace after OCR cleanup or source verification</text>
</svg>
`;
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

  mkdirSync(PLACEHOLDER_DIR, { recursive: true });
  mkdirSync(BACKUP_DIR, { recursive: true });

  const text = readFileSync(INDEX_FILE, "utf8");
  const array = findArrayWithObjectCount(text, geographicIndex.length);
  const spans = array.spans;

  const backupFile = path.join(
    BACKUP_DIR,
    `geographicIndex.remaining-image-placeholders.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.ts`
  );

  copyFileSync(INDEX_FILE, backupFile);

  const applied = [];
  const skipped = [];

  const replacements = REMAINING.map((item) => {
    const record = geographicIndex[item.index];
    const span = spans[item.index];

    if (!record || !span) {
      skipped.push({ ...item, reason: "record_or_span_not_found" });
      return null;
    }

    const fileName = `${slug(item.name)}-${item.index}.svg`;
    const absPlaceholder = path.join(PLACEHOLDER_DIR, fileName);
    const publicPath = `/images/geographicIndex/placeholders/${fileName}`;

    writeFileSync(absPlaceholder, makeSvg(item));

    const beforeObject = text.slice(span.start, span.end);
    const afterObject = setImageInObject(beforeObject, publicPath);

    if (afterObject === beforeObject) {
      skipped.push({ ...item, publicPath, reason: "no_change" });
      return null;
    }

    applied.push({
      ...item,
      publicPath,
      placeholderFile: path.relative(ROOT, absPlaceholder),
      actualRecordName: record.name || record.title || record.id,
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
    REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, INDEX_FILE),
        backupFile: path.relative(ROOT, backupFile),
        placeholderDir: path.relative(ROOT, PLACEHOLDER_DIR),
        attempted: REMAINING.length,
        applied: applied.length,
        skipped: skipped.length,
        appliedRecords: applied,
        skippedRecords: skipped,
      },
      null,
      2
    )
  );

  console.log("Remaining geographic index placeholders created.");
  console.log(`Attempted: ${REMAINING.length}`);
  console.log(`Applied: ${applied.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

  console.table(
    applied.map((item) => ({
      index: item.index,
      name: item.name,
      image: item.publicPath,
      file: item.placeholderFile,
    }))
  );

  if (skipped.length) {
    console.log("\nSkipped:");
    console.table(skipped);
  }
}

main();
