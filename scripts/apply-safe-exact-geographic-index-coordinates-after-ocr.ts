// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/applied-safe-exact-geographic-index-coordinates-after-ocr.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const SAFE_FIXES = [
  {
    index: 555,
    expectedName: "Cotton Grove Bay",
    expectedType: "estate",
    expectedIsland: "st_croix",
    candidate: "COTTON GROVE",
    lat: 17.7354068317233,
    lng: -64.63955741808715,
  },
  {
    index: 1229,
    expectedName: "Judith's Fancy",
    expectedType: "estate",
    expectedIsland: "st_croix",
    candidate: "Estate Judith's Fancy",
    lat: 17.776914,
    lng: -64.747497,
  },
  {
    index: 2558,
    expectedName: "Turtle Dove Cay",
    expectedType: "island",
    expectedIsland: "st_thomas",
    candidate: "TURTLE DOVE CAY",
    lat: 18.3086275618696,
    lng: -65.0003906549153,
  },
];

const BLOCKED = [
  { index: 229, name: "Buck Bay", candidate: "BUCK ISLAND", reason: "bay-to-island match is unsafe" },
  { index: 990, name: "Grove", candidate: "GROVE PLACE", reason: "generic historic fragment" },
  { index: 1107, name: "Hope Point", candidate: "HOPE", reason: "generic Hope match" },
];

function cleanText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function islandOf(record: any): string {
  return String(record?.island ?? record?.islands?.[0] ?? "");
}

function hasCoords(record: any): boolean {
  const c = record?.coordinates;
  return (
    c &&
    typeof c === "object" &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng)
  );
}

function findArrayBounds(text: string) {
  const markerAt = text.indexOf("export const geographicIndex");
  if (markerAt < 0) throw new Error("Could not find geographicIndex export.");

  const equalsAt = text.indexOf("=", markerAt);
  if (equalsAt < 0) throw new Error("Could not find geographicIndex assignment.");

  const open = text.indexOf("[", equalsAt);
  if (open < 0) throw new Error("Could not find geographicIndex array start.");

  let depth = 0;
  let inString: string | null = null;
  let escape = false;

  for (let i = open; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "[") depth++;
    if (ch === "]") depth--;

    if (depth === 0) return { start: open, end: i + 1 };
  }

  throw new Error("Could not find geographicIndex array end.");
}

function splitObjects(arrayText: string) {
  const objects: { start: number; end: number; text: string }[] = [];
  let depth = 0;
  let start = -1;
  let inString: string | null = null;
  let escape = false;

  for (let i = 0; i < arrayText.length; i++) {
    const ch = arrayText[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    }

    if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        objects.push({ start, end: i + 1, text: arrayText.slice(start, i + 1) });
        start = -1;
      }
    }
  }

  return objects;
}

function patchCoordinates(block: string, lat: number, lng: number) {
  const formatted = `coordinates: {\n    lat: ${lat},\n    lng: ${lng},\n  }`;

  const quotedFormatted = `"coordinates": {\n    "lat": ${lat},\n    "lng": ${lng}\n  }`;

  if (/"coordinates"\s*:\s*null/.test(block)) {
    return block.replace(/"coordinates"\s*:\s*null/, quotedFormatted);
  }

  if (/\bcoordinates\s*:\s*null/.test(block)) {
    return block.replace(/\bcoordinates\s*:\s*null/, formatted);
  }

  if (/coordinates\s*:\s*undefined/.test(block)) {
    return block.replace(/\bcoordinates\s*:\s*undefined/, formatted);
  }

  throw new Error("Source block does not contain coordinates null/undefined.");
}

mkdirSync(BACKUP_DIR, { recursive: true });
mkdirSync(path.dirname(REPORT_FILE), { recursive: true });

const source = readFileSync(TARGET_FILE, "utf8");
const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.safe-exact-after-ocr.${new Date().toISOString().replace(/[:.]/g, "-")}.ts`
);
writeFileSync(backupFile, source);

const bounds = findArrayBounds(source);
let arrayText = source.slice(bounds.start, bounds.end);
let objects = splitObjects(arrayText);

const applied: any[] = [];
const skipped: any[] = [];

for (const fix of SAFE_FIXES) {
  const record = geographicIndex[fix.index];

  if (!record) {
    skipped.push({ ...fix, reason: "record index not found" });
    continue;
  }

  const nameOk = cleanText(record.name) === cleanText(fix.expectedName);
  const typeOk = cleanText(record.type) === cleanText(fix.expectedType);
  const islandOk = islandOf(record) === fix.expectedIsland;

  if (!nameOk || !typeOk || !islandOk) {
    skipped.push({
      ...fix,
      reason: "runtime guard mismatch",
      actual: {
        name: record.name,
        type: record.type,
        island: islandOf(record),
        coordinates: record.coordinates,
      },
      guards: { nameOk, typeOk, islandOk },
    });
    continue;
  }

  if (hasCoords(record)) {
    skipped.push({
      ...fix,
      reason: "already has coordinates",
      actual: record.coordinates,
    });
    continue;
  }

  const block = objects[fix.index];

  if (!block) {
    skipped.push({ ...fix, reason: "source block not found" });
    continue;
  }

  const replacement = patchCoordinates(block.text, fix.lat, fix.lng);
  arrayText = arrayText.slice(0, block.start) + replacement + arrayText.slice(block.end);

  const delta = replacement.length - block.text.length;
  objects = objects.map((obj, i) =>
    i > fix.index
      ? { ...obj, start: obj.start + delta, end: obj.end + delta }
      : obj
  );

  applied.push({
    index: fix.index,
    name: record.name,
    type: record.type,
    island: islandOf(record),
    candidate: fix.candidate,
    lat: fix.lat,
    lng: fix.lng,
  });
}

const nextSource = source.slice(0, bounds.start) + arrayText + source.slice(bounds.end);
writeFileSync(TARGET_FILE, nextSource);

const report = {
  generatedAt: new Date().toISOString(),
  backupFile,
  applied,
  skipped,
  blocked: BLOCKED,
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

console.log("Safe exact post-OCR coordinate pass complete.");
console.log(`Applied: ${applied.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(applied);

if (skipped.length) {
  console.log("Skipped records:");
  console.table(skipped.map((s) => ({
    index: s.index,
    expectedName: s.expectedName,
    reason: s.reason,
    actualName: s.actual?.name,
    actualType: s.actual?.type,
    actualIsland: s.actual?.island,
  })));
}

console.log("Blocked unsafe exact matches:");
console.table(BLOCKED);

if (applied.length !== SAFE_FIXES.length) {
  process.exitCode = 1;
}
