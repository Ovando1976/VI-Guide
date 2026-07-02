// @ts-nocheck

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/merged-remaining-geographic-index-duplicates.json"
);
const BACKUP_DIR = path.join(ROOT, "reports/backups");

type AnyRecord = Record<string, any>;

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

function islandOf(record: AnyRecord): string {
  if (record.island) return String(record.island);
  if (Array.isArray(record.islands) && record.islands[0]) return String(record.islands[0]);
  return "";
}

function duplicateKey(record: AnyRecord): string {
  return [
    cleanText(record.name),
    cleanText(record.type),
    cleanText(islandOf(record)),
  ].join("||");
}

function hasCoords(record: AnyRecord): boolean {
  const c = record.coordinates ?? record.coords ?? record.centroid;
  if (!c) return false;

  if (Array.isArray(c)) {
    return Number.isFinite(Number(c[0])) && Number.isFinite(Number(c[1]));
  }

  if (typeof c === "object") {
    return (
      Number.isFinite(Number(c.lat)) &&
      Number.isFinite(Number(c.lng ?? c.lon ?? c.longitude))
    );
  }

  return false;
}

function scoreRecord(record: AnyRecord): number {
  let score = 0;
  if (hasCoords(record)) score += 1000;
  if (record.imageUrl || record.image || record.photoUrl) score += 100;
  if (record.description) score += Math.min(String(record.description).length, 500);
  if (record.source) score += 25;
  if (record.id && !String(record.id).includes("gdvi")) score += 10;
  return score;
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values.flat(Infinity)) {
    const text = String(value ?? "").trim();
    if (!text) continue;
    const key = cleanText(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }

  return out;
}

function mergeGroup(group: AnyRecord[]): AnyRecord {
  const sorted = [...group].sort((a, b) => scoreRecord(b) - scoreRecord(a));
  const keeper = { ...sorted[0] };

  const aliases = uniqueStrings([
    keeper.aliases ?? [],
    ...group.map((record) => record.aliases ?? []),
    ...group.map((record) => record.name).filter((name) => name !== keeper.name),
  ]);

  if (aliases.length) keeper.aliases = aliases;

  if (!hasCoords(keeper)) {
    const withCoords = group.find(hasCoords);
    if (withCoords) {
      keeper.coordinates = withCoords.coordinates ?? withCoords.coords ?? withCoords.centroid;
    }
  }

  for (const field of ["imageUrl", "image", "photoUrl", "source", "quarter", "quarterGroup"]) {
    if (!keeper[field]) {
      const found = group.find((record) => record[field]);
      if (found) keeper[field] = found[field];
    }
  }

  const descriptions = uniqueStrings(group.map((record) => record.description));
  if (descriptions.length) {
    keeper.description = descriptions.sort((a, b) => b.length - a.length)[0];
    if (descriptions.length > 1) {
      keeper.mergedDescriptions = descriptions;
    }
  }

  keeper.mergedDuplicateIds = uniqueStrings([
    keeper.mergedDuplicateIds ?? [],
    ...group.map((record) => record.mergedDuplicateIds ?? []),
    ...group.map((record) => record.id),
  ]);

  keeper.mergedDuplicateCount = group.length;

  return keeper;
}

const rows = geographicIndex.map((record: AnyRecord, index: number) => ({
  index,
  record,
  key: duplicateKey(record),
}));

const groups = new Map<string, typeof rows>();

for (const row of rows) {
  if (!row.key || row.key.startsWith("||")) continue;
  const list = groups.get(row.key) ?? [];
  list.push(row);
  groups.set(row.key, list);
}

const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);

const mergedKeys = new Map<string, AnyRecord>();
for (const group of duplicateGroups) {
  mergedKeys.set(group[0].key, mergeGroup(group.map((row) => row.record)));
}

const emitted = new Set<string>();
const nextIndex: AnyRecord[] = [];

for (const row of rows) {
  if (mergedKeys.has(row.key)) {
    if (emitted.has(row.key)) continue;
    nextIndex.push(mergedKeys.get(row.key));
    emitted.add(row.key);
  } else {
    nextIndex.push(row.record);
  }
}

mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
mkdirSync(BACKUP_DIR, { recursive: true });

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.merge-remaining-duplicates.${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.ts`
);

const beforeText = readFileSync(TARGET_FILE, "utf8");
writeFileSync(backupFile, beforeText);

const header = `// Generated geographic index.
// Remaining duplicate name/type/island rows merged by scripts/merge-remaining-geographic-index-duplicates.ts.

export type GeographicIndexRecord = {
  id?: string;
  name?: string;
  type?: string;
  island?: string;
  islands?: string[];
  description?: string;
  coordinates?: unknown;
  coords?: unknown;
  centroid?: unknown;
  aliases?: string[];
  imageUrl?: string;
  image?: string;
  photoUrl?: string;
  source?: unknown;
  quarter?: string;
  quarterGroup?: string;
  [key: string]: unknown;
};

export const geographicIndex: GeographicIndexRecord[] = `;

writeFileSync(TARGET_FILE, `${header}${JSON.stringify(nextIndex, null, 2)};\n`);

const report = {
  generatedAt: new Date().toISOString(),
  beforeCount: geographicIndex.length,
  afterCount: nextIndex.length,
  duplicateGroups: duplicateGroups.length,
  removedRecords: geographicIndex.length - nextIndex.length,
  backupFile: path.relative(ROOT, backupFile),
  groups: duplicateGroups.map((group) => ({
    key: group[0].key,
    count: group.length,
    rows: group.map((row) => ({
      index: row.index,
      id: row.record.id,
      name: row.record.name,
      type: row.record.type,
      island: islandOf(row.record),
      hasCoordinates: hasCoords(row.record),
      score: scoreRecord(row.record),
    })),
  })),
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

console.log("Remaining geographic index duplicate merge complete.");
console.log({
  beforeCount: report.beforeCount,
  afterCount: report.afterCount,
  duplicateGroups: report.duplicateGroups,
  removedRecords: report.removedRecords,
});
console.table(
  report.groups.map((group) => ({
    key: group.key,
    count: group.count,
    rows: group.rows.map((row) => row.index).join(", "),
    names: group.rows.map((row) => row.name).join(" | "),
  }))
);
