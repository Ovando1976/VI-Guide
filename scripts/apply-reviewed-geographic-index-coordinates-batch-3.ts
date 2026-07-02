// @ts-nocheck

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/applied-reviewed-geographic-index-coordinates-batch-3.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

const SAFE_FIXES = [
  { index: 593, expectedName: "Crown Bay Cruise Port", expectedType: "port", expectedIsland: "st_thomas", candidate: "Crown Bay", lat: 18.3516443841391, lng: -64.97518249799175 },
  { index: 808, expectedName: "Flat Cays", expectedType: "point", expectedIsland: "st_thomas", candidate: "Flat Cay", lat: 18.3176615035053, lng: -64.9888146529801 },
  { index: 869, expectedName: "French Bay or Frenchbay", expectedType: "bay", expectedIsland: "st_thomas", candidate: "French Bay", lat: 18.31958030255245, lng: -64.9084111427579 },
  { index: 873, expectedName: "Frenchbay", expectedType: "estate", expectedIsland: "st_thomas", candidate: "French Bay", lat: 18.31958030255245, lng: -64.9084111427579 },
  { index: 1359, expectedName: "Lagrange Garden", expectedType: "estate", expectedIsland: "st_croix", candidate: "Lagrange", lat: 17.71823717741445, lng: -64.87445690853116 },
  { index: 1646, expectedName: "Morningstar", expectedType: "estate", expectedIsland: "st_croix", candidate: "MORNING STAR", lat: 17.76267907047465, lng: -64.76127587077406 },
  { index: 1769, expectedName: "Northstar", expectedType: "estate", expectedIsland: "st_croix", candidate: "NORTH STAR", lat: 17.7643827657991, lng: -64.8181934288463 },
  { index: 1774, expectedName: "Nugent", expectedType: "estate", expectedIsland: "st_croix", candidate: "CASTLE NUGENT", lat: 17.719562371093147, lng: -64.6797022059518 },
  { index: 1776, expectedName: "Nulliberg", expectedType: "estate", expectedIsland: "st_thomas", candidate: "NULLYBERG", lat: 18.326305680630853, lng: -64.89736067271285 },
  { index: 1861, expectedName: "Parasol Hill", expectedType: "estate", expectedIsland: "st_croix", candidate: "PARASOL", lat: 17.7558796915945, lng: -64.8170085737669 },
  { index: 1932, expectedName: "Pless plantation", expectedType: "estate", expectedIsland: "st_croix", candidate: "PLESSEN (North)", lat: 17.73430006364915, lng: -64.82762389166996 },
  { index: 1933, expectedName: "Plessen", expectedType: "estate", expectedIsland: "st_croix", candidate: "PLESSEN (North)", lat: 17.73430006364915, lng: -64.82762389166996 },
  { index: 1995, expectedName: "Princess", expectedType: "estate", expectedIsland: "st_croix", candidate: "LA GRANDE PRINCESSE", lat: 17.757271983688298, lng: -64.73523993211084 },
  { index: 1999, expectedName: "Princess School", expectedType: "estate", expectedIsland: "st_croix", candidate: "LA GRANDE PRINCESSE", lat: 17.757271983688298, lng: -64.73523993211084 },
  { index: 2017, expectedName: "Prosperity Clarden", expectedType: "estate", expectedIsland: "st_croix", candidate: "PROSPERITY", lat: 17.728048607641753, lng: -64.877872164136 },
  { index: 2019, expectedName: "Prosperity Gut", expectedType: "estate", expectedIsland: "st_croix", candidate: "PROSPERITY", lat: 17.728048607641753, lng: -64.877872164136 },
  { index: 2040, expectedName: "Punch Hill", expectedType: "estate", expectedIsland: "st_croix", candidate: "PUNCH", lat: 17.73965896466005, lng: -64.86899338708506 },
  { index: 2042, expectedName: "Punch Valley", expectedType: "estate", expectedIsland: "st_croix", candidate: "PUNCH", lat: 17.73965896466005, lng: -64.86899338708506 },
  { index: 2076, expectedName: "Ramgoat Cay", expectedType: "island", expectedIsland: "st_john", candidate: "RAM GOAT CAY", lat: 18.3551160406748, lng: -64.78944480445855 },
  { index: 2088, expectedName: "Rattan", expectedType: "estate", expectedIsland: "st_croix", candidate: "RATTAN & BELVEDERE", lat: 17.749739825071998, lng: -64.74981364350225 },
  { index: 2119, expectedName: "Reef Bay Petroglyphs", expectedType: "archaeological-site", expectedIsland: "st_john", candidate: "REEF BAY", lat: 18.3241492592502, lng: -64.7379062541914 },
  { index: 2120, expectedName: "Reef Bay Quarter", expectedType: "estate", expectedIsland: "st_john", candidate: "REEF BAY", lat: 18.3241492592502, lng: -64.7379062541914 },
  { index: 2142, expectedName: "Richmond Jail", expectedType: "estate", expectedIsland: "st_croix", candidate: "RICHMOND", lat: 17.7454392029822, lng: -64.71220412944331 },
  { index: 2175, expectedName: "Rosendal", expectedType: "estate", expectedIsland: "st_thomas", candidate: "ST JOSEPH & ROSENDAHL", lat: 18.35369715902085, lng: -64.91366486842695 },
  { index: 2268, expectedName: "Santa Maria Gut", expectedType: "bay", expectedIsland: "st_thomas", candidate: "Santa Maria Bay", lat: 18.359333337383298, lng: -64.98905345449211 },
  { index: 2269, expectedName: "Santa Maria Hill", expectedType: "estate", expectedIsland: "st_thomas", candidate: "SANTA MARIA", lat: 18.359333337383298, lng: -64.98905345449211 },
  { index: 2270, expectedName: "Santa Maria Ridge", expectedType: "estate", expectedIsland: "st_thomas", candidate: "SANTA MARIA", lat: 18.359333337383298, lng: -64.98905345449211 },
  { index: 2271, expectedName: "Santa Maria Trail", expectedType: "estate", expectedIsland: "st_thomas", candidate: "SANTA MARIA", lat: 18.359333337383298, lng: -64.98905345449211 },
  { index: 2272, expectedName: "Santa Xaria Point", expectedType: "bay", expectedIsland: "st_thomas", candidate: "Santa Maria Bay", lat: 18.359333337383298, lng: -64.98905345449211 },
  { index: 2300, expectedName: "Sevenhills", expectedType: "estate", expectedIsland: "st_croix", candidate: "SEVEN HILLS", lat: 17.7462147534703, lng: -64.6477516565729 },
  { index: 2333, expectedName: "Smith’s Field", expectedType: "estate", expectedIsland: "st_thomas", candidate: "SMITH BAY", lat: 18.335278251441, lng: -64.86171891676014 },
  { index: 2334, expectedName: "Smithbay", expectedType: "estate", expectedIsland: "st_thomas", candidate: "SMITH BAY", lat: 18.335278251441, lng: -64.86171891676014 },
  { index: 2379, expectedName: "Sprat", expectedType: "estate", expectedIsland: "st_croix", candidate: "SPRATT HALL", lat: 17.74306767792325, lng: -64.88348586636539 },
  { index: 2494, expectedName: "The Grange", expectedType: "estate", expectedIsland: "st_croix", candidate: "GRANGE (North)", lat: 17.7313643710483, lng: -64.72092022272085 },
];

const BLOCKED = [
  { index: 229, name: "Buck Bay", candidate: "BUCK ISLAND", reason: "bay-to-island match is unsafe" },
  { index: 990, name: "Grove", candidate: "GROVE PLACE", reason: "generic historic fragment" },
  { index: 1107, name: "Hope Point", candidate: "HOPE", reason: "generic Hope match" },
  { index: 77, name: "Beck Grove", candidate: "GROVE PLACE", reason: "generic Grove match" },
  { index: 397, name: "Catharina's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { index: 400, name: "Catherine's Hope", candidate: "HOPE", reason: "generic Hope match" },
  { index: 566, name: "Cottongrove Hill", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { index: 1811, name: "Orangegrove", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { index: 1812, name: "Orangegrove Road", candidate: "GROVE PLACE", reason: "wrong Grove candidate" },
  { index: 2490, name: "Thatch Hill", candidate: "Thatch Cay", reason: "hill-to-cay match is unsafe" },
];

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function countChar(line: string, char: string) {
  return [...line].filter((c) => c === char).length;
}

function findArrayBounds(text: string) {
  const markerAt = text.indexOf("export const geographicIndex");
  if (markerAt < 0) throw new Error("Could not find geographicIndex export.");

  const equalsAt = text.indexOf("=", markerAt);
  if (equalsAt < 0) throw new Error("Could not find geographicIndex assignment.");

  const open = text.indexOf("[", equalsAt);
  if (open < 0) throw new Error("Could not find geographicIndex array start.");

  let inString = false;
  let quote = "";
  let escaped = false;
  let depth = 0;

  for (let i = open; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === "[") depth++;
    if (ch === "]") depth--;

    if (depth === 0) return { start: open, end: i };
  }

  throw new Error("Could not find geographicIndex array end.");
}

function splitTopLevelObjects(text: string, bounds: { start: number; end: number }) {
  const objects = [];
  let inString = false;
  let quote = "";
  let escaped = false;
  let depth = 0;
  let objectStart = -1;

  for (let i = bounds.start + 1; i < bounds.end; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) objectStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && objectStart >= 0) {
        objects.push({ start: objectStart, end: i + 1 });
        objectStart = -1;
      }
    }
  }

  return objects;
}

function removeProperty(block: string, prop: string) {
  const propRe = new RegExp(`^\\s*["']?${prop}["']?\\s*:`);
  const lines = block.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!propRe.test(line)) {
      out.push(line);
      continue;
    }

    let depth = countChar(line, "{") - countChar(line, "}");
    while (depth > 0 && i + 1 < lines.length) {
      i++;
      depth += countChar(lines[i], "{") - countChar(lines[i], "}");
    }
  }

  return out.join("\n");
}

function patchBlock(block: string, fix: any) {
  let next = block;

  for (const prop of [
    "coordinates",
    "lat",
    "lng",
    "coordinateSource",
    "coordinateConfidence",
    "coordinateCandidate",
    "coordinateReason",
  ]) {
    next = removeProperty(next, prop);
  }

  const lines = next.split("\n");
  const closeIndex = lines.map((line) => line.trim()).lastIndexOf("}");
  if (closeIndex < 0) throw new Error(`Could not find object close for ${fix.expectedName}`);

  let previous = closeIndex - 1;
  while (previous >= 0 && !lines[previous].trim()) previous--;

  if (previous >= 0 && !lines[previous].trim().endsWith(",")) {
    lines[previous] = `${lines[previous]},`;
  }

  const indentMatch = lines.find((line) => /^\s+["']?\w+["']?\s*:/.test(line));
  const indent = indentMatch?.match(/^(\s+)/)?.[1] ?? "  ";

  const insert = [
    `${indent}"coordinates": { "lat": ${fix.lat}, "lng": ${fix.lng} },`,
    `${indent}"lat": ${fix.lat},`,
    `${indent}"lng": ${fix.lng},`,
    `${indent}"coordinateSource": "reviewed_geographic_index_coordinate_batch_3",`,
    `${indent}"coordinateConfidence": "reviewed",`,
    `${indent}"coordinateCandidate": ${JSON.stringify(fix.candidate)},`,
    `${indent}"coordinateReason": "reviewed_safe_candidate"`,
  ];

  lines.splice(closeIndex, 0, ...insert);
  return lines.join("\n");
}

mkdirSync(BACKUP_DIR, { recursive: true });

let source = readFileSync(TARGET_FILE, "utf8");
const before = source;
const bounds = findArrayBounds(source);
const objects = splitTopLevelObjects(source, bounds);

const replacements: { start: number; end: number; text: string }[] = [];
const applied: any[] = [];
const skipped: any[] = [];

for (const fix of SAFE_FIXES) {
  const runtime = geographicIndex[fix.index];

  if (!runtime) {
    skipped.push({ ...fix, reason: "runtime record missing" });
    continue;
  }

  if (
    runtime.name !== fix.expectedName ||
    runtime.type !== fix.expectedType ||
    runtime.island !== fix.expectedIsland
  ) {
    skipped.push({
      ...fix,
      reason: "runtime guard mismatch",
      actualName: runtime.name,
      actualType: runtime.type,
      actualIsland: runtime.island,
    });
    continue;
  }

  if (runtime.coordinates && typeof runtime.coordinates.lat === "number" && typeof runtime.coordinates.lng === "number") {
    skipped.push({ ...fix, reason: "already has coordinates" });
    continue;
  }

  const objectBounds = objects[fix.index];
  if (!objectBounds) {
    skipped.push({ ...fix, reason: "source object missing" });
    continue;
  }

  const oldBlock = source.slice(objectBounds.start, objectBounds.end);
  const newBlock = patchBlock(oldBlock, fix);

  replacements.push({ start: objectBounds.start, end: objectBounds.end, text: newBlock });
  applied.push({
    index: fix.index,
    name: fix.expectedName,
    type: fix.expectedType,
    island: fix.expectedIsland,
    candidate: fix.candidate,
    lat: fix.lat,
    lng: fix.lng,
  });
}

for (const r of replacements.sort((a, b) => b.start - a.start)) {
  source = source.slice(0, r.start) + r.text + source.slice(r.end);
}

if (source !== before) {
  writeFileSync(
    path.join(BACKUP_DIR, `geographicIndex.reviewed-coordinate-batch-3.${timestamp()}.ts`),
    before
  );
  writeFileSync(TARGET_FILE, source);
}

writeFileSync(
  REPORT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      reviewedAllowlist: SAFE_FIXES.length,
      applied: applied.length,
      skipped: skipped.length,
      appliedRecords: applied,
      skippedRecords: skipped,
      blockedRecords: BLOCKED,
    },
    null,
    2
  ) + "\n"
);

console.log("Reviewed geographic index coordinate batch 3 complete.");
console.log(`Applied: ${applied.length}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(applied);
if (skipped.length) {
  console.log("Skipped records:");
  console.table(skipped);
}
console.log("Blocked unsafe/generic matches:");
console.table(BLOCKED);
if (skipped.length) process.exitCode = 1;
