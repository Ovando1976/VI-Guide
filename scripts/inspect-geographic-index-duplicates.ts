// @ts-nocheck

import { writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();
const REPORT_FILE = path.join(ROOT, "reports/geographic-index-duplicates.json");

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown) {
  return stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getName(record: any) {
  return record.name || record.title || record.label || record.term || "";
}

function getType(record: any) {
  return record.type || record.kind || record.featureType || "";
}

function getIsland(record: any) {
  return record.island || record.islandCode || "";
}

function getCoords(record: any) {
  if (
    typeof record?.coordinates?.lat === "number" &&
    typeof record?.coordinates?.lng === "number"
  ) {
    return record.coordinates;
  }

  if (typeof record?.lat === "number" && typeof record?.lng === "number") {
    return { lat: record.lat, lng: record.lng };
  }

  if (
    typeof record?.center?.lat === "number" &&
    typeof record?.center?.lng === "number"
  ) {
    return record.center;
  }

  if (
    typeof record?.centroid?.lat === "number" &&
    typeof record?.centroid?.lng === "number"
  ) {
    return record.centroid;
  }

  return null;
}

function hasUsefulData(record: any) {
  return Boolean(
    record.description ||
      record.summary ||
      record.history ||
      record.relatedRecords ||
      record.relatedDictionaryEntries ||
      record.relatedArchives ||
      record.image ||
      record.imageUrl ||
      record.localImage ||
      record.source ||
      record.sources
  );
}

const groups = new Map();

for (let index = 0; index < geographicIndex.length; index += 1) {
  const record = geographicIndex[index];
  const name = getName(record);
  const type = getType(record);
  const island = getIsland(record);

  const key = `${normalize(name)}::${normalize(type)}::${normalize(island)}`;

  if (!normalize(name)) continue;

  if (!groups.has(key)) groups.set(key, []);

  groups.get(key).push({
    index,
    id: record.id || record.geoid || record.slug || "",
    name,
    type,
    island,
    coordinates: getCoords(record),
    hasUsefulData: hasUsefulData(record),
    source: record.source || record.sourceName || "",
    aliases: record.aliases || record.alternateNames || [],
  });
}

const duplicates = [...groups.entries()]
  .filter(([, records]) => records.length > 1)
  .map(([key, records]) => ({
    key,
    count: records.length,
    records,
  }))
  .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));

writeFileSync(
  REPORT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalDuplicateGroups: duplicates.length,
      duplicates,
    },
    null,
    2
  )
);

console.log("Geographic index duplicate inspection complete.");
console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);
console.log(`Duplicate groups: ${duplicates.length}`);

console.table(
  duplicates.slice(0, 30).map((group) => ({
    key: group.key,
    count: group.count,
    indexes: group.records.map((record) => record.index).join(", "),
    names: [...new Set(group.records.map((record) => record.name))].join(" | "),
    type: group.records[0]?.type || "",
    island: group.records[0]?.island || "",
  }))
);

console.log("\nFull duplicate records:");
for (const group of duplicates.slice(0, 10)) {
  console.log(`\n${group.key}`);
  console.table(group.records);
}
