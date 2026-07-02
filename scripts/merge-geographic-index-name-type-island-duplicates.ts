// @ts-nocheck

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const TARGET_FILE = path.join(ROOT, "src/data/core/geographicIndex.ts");
const REPORT_FILE = path.join(
  ROOT,
  "reports/merged-geographic-index-name-type-island-duplicates.json"
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

function duplicateKey(record: AnyRecord): string {
  return [
    cleanText(record.name),
    cleanText(record.type),
    cleanText(record.island ?? record.islands?.[0] ?? ""),
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

function mergeRecords(group: AnyRecord[]): AnyRecord {
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

  keeper.mergedDuplicateIds = uniqueStrings(group.map((record) => record.id));
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
  const existing = groups.get(row.key) ?? [];
  existing.push(row);
  groups.set(row.key, existing);
}

const duplicateGroups = [...groups.values()].filter((group) => group.length > 1);

const mergedByKey = new Map<string, AnyRecord>();
const removedIndexes = new Set<number>();

for (const group of duplicateGroups) {
  const merged = mergeRecords(group.map((row) => row.record));
  mergedByKey.set(group[0].key, merged);

  const sorted = [...group].sort(
    (a, b) => scoreRecord(b.record) - scoreRecord(a.record)
  );

  for (const row of sorted.slice(1)) {
    removedIndexes.add(row.index);
  }
}

const emittedKeys = new Set<string>();
const nextIndex: AnyRecord[] = [];

for (const row of rows) {
  if (removedIndexes.has(row.index)) continue;

  if (mergedByKey.has(row.key)) {
    if (emittedKeys.has(row.key)) continue;
    nextIndex.push(mergedByKey.get(row.key));
    emittedKeys.add(row.key);
    continue;
  }

  nextIndex.push(row.record);
}

mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
mkdirSync(BACKUP_DIR, { recursive: true });

const backupFile = path.join(
  BACKUP_DIR,
  `geographicIndex.merge-name-type-island-duplicates.${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}.ts`
);

const beforeText = await import("node:fs").then((fs) =>
  fs.readFileSync(TARGET_FILE, "utf8")
);

writeFileSync(backupFile, beforeText);

const header = `// Generated geographic index.
// Duplicate name/type/island rows were safely merged by scripts/merge-geographic-index-name-type-island-duplicates.ts.

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

const output = `${header}${JSON.stringify(nextIndex, null, 2)};\n`;

writeFileSync(TARGET_FILE, output);

const report = {
  generatedAt: new Date().toISOString(),
  beforeCount: geographicIndex.length,
  afterCount: nextIndex.length,
  mergedGroups: duplicateGroups.length,
  removedRecords: removedIndexes.size,
  backupFile: path.relative(ROOT, backupFile),
  groups: duplicateGroups.map((group) => ({
    key: group[0].key,
    count: group.length,
    keptName: mergeRecords(group.map((row) => row.record)).name,
    rows: group.map((row) => ({
      index: row.index,
      id: row.record.id,
      name: row.record.name,
      type: row.record.type,
      island: row.record.island,
      hasCoordinates: hasCoords(row.record),
      score: scoreRecord(row.record),
    })),
  })),
};

writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

console.log("Geographic index duplicate merge complete.");
console.log(`Before: ${report.beforeCount}`);
console.log(`After: ${report.afterCount}`);
console.log(`Merged duplicate groups: ${report.mergedGroups}`);
console.log(`Removed duplicate records: ${report.removedRecords}`);
console.log(`Backup: ${report.backupFile}`);
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.table(
  report.groups.map((group) => ({
    keptName: group.keptName,
    count: group.count,
    rows: group.rows.map((row) => row.index).join(", "),
  }))
);
