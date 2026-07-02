// @ts-nocheck

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const ESTATE_FILE_CANDIDATES = [
  "public/geo/usvi-estates.geojson",
  "public/data/usvi-estates.geojson",
  "public/data/estates.geojson",
].map((file) => path.join(ROOT, file));

const ESTATE_FILE = ESTATE_FILE_CANDIDATES.find((file) => existsSync(file));

if (!ESTATE_FILE) {
  throw new Error("Could not find estates GeoJSON file.");
}

const BACKUP_DIR = path.join(ROOT, "reports/backups");
const REPORT_FILE = path.join(ROOT, "reports/merged-duplicate-estate-geojson-features.json");

function norm(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getName(feature: any) {
  const p = feature.properties || {};
  return p.name || p.NAME || p.estate || p.ESTATE || p.label || p.LABEL || "";
}

function getType(feature: any) {
  const p = feature.properties || {};
  return p.type || p.TYPE || p.kind || p.KIND || "estate";
}

function getIsland(feature: any) {
  const p = feature.properties || {};
  return p.island || p.ISLAND || p.islandCode || p.ISLAND_CODE || p.quarterIsland || "";
}

function getFeatureId(feature: any) {
  const p = feature.properties || {};
  return (
    feature.id ||
    p.id ||
    p.geoid ||
    p.GEOID ||
    p.OBJECTID ||
    p.objectid ||
    p.OBJECTID_1 ||
    p.FID ||
    ""
  );
}

function duplicateKey(feature: any) {
  return `${norm(getName(feature))}::${norm(getType(feature))}::${norm(getIsland(feature))}`;
}

function geometryToPolygons(geometry: any) {
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates || [];
  }

  return [];
}

function mergeGeometries(features: any[]) {
  const polygonCoordinates = features.flatMap((feature) =>
    geometryToPolygons(feature.geometry)
  );

  if (polygonCoordinates.length === 0) {
    return features[0].geometry;
  }

  if (polygonCoordinates.length === 1) {
    return {
      type: "Polygon",
      coordinates: polygonCoordinates[0],
    };
  }

  return {
    type: "MultiPolygon",
    coordinates: polygonCoordinates,
  };
}

function unique(values: any[]) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ""))];
}

function main() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const backupFile = path.join(
    BACKUP_DIR,
    `usvi-estates.duplicate-merge.${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.geojson`
  );

  const geojson = JSON.parse(readFileSync(ESTATE_FILE, "utf8"));
  copyFileSync(ESTATE_FILE, backupFile);

  const groups = new Map();

  geojson.features.forEach((feature: any, index: number) => {
    const key = duplicateKey(feature);

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ index, feature });
  });

  const duplicateGroups = [...groups.entries()]
    .filter(([key, records]) => records.length > 1)
    .map(([key, records]) => ({ key, records }));

  const removeIndexes = new Set();
  const mergedGroups = [];

  for (const group of duplicateGroups) {
    const sorted = [...group.records].sort((a, b) => a.index - b.index);
    const keep = sorted[0];
    const removed = sorted.slice(1);

    const mergedFeature = keep.feature;
    const allFeatures = sorted.map((record) => record.feature);

    mergedFeature.geometry = mergeGeometries(allFeatures);

    const existingMergedIds = Array.isArray(mergedFeature.properties?.mergedFeatureIds)
      ? mergedFeature.properties.mergedFeatureIds
      : [];

    const existingMergedIndexes = Array.isArray(mergedFeature.properties?.mergedFeatureIndexes)
      ? mergedFeature.properties.mergedFeatureIndexes
      : [];

    mergedFeature.properties = {
      ...(mergedFeature.properties || {}),
      duplicateMergeKey: group.key,
      mergedFeatureIds: unique([
        getFeatureId(keep.feature),
        ...removed.map((record) => getFeatureId(record.feature)),
        ...existingMergedIds,
      ]),
      mergedFeatureIndexes: unique([
        keep.index,
        ...removed.map((record) => record.index),
        ...existingMergedIndexes,
      ]),
      mergedDuplicateCount: sorted.length,
      mergedDuplicateNames: unique(sorted.map((record) => getName(record.feature))),
    };

    for (const record of removed) {
      removeIndexes.add(record.index);
    }

    mergedGroups.push({
      key: group.key,
      keptIndex: keep.index,
      keptId: getFeatureId(keep.feature),
      removed: removed.map((record) => ({
        index: record.index,
        id: getFeatureId(record.feature),
        name: getName(record.feature),
      })),
      mergedGeometryType: mergedFeature.geometry?.type || null,
      mergedFeatureIds: mergedFeature.properties.mergedFeatureIds,
    });
  }

  geojson.features = geojson.features.filter((feature: any, index: number) => !removeIndexes.has(index));

  writeFileSync(ESTATE_FILE, JSON.stringify(geojson, null, 2) + "\n");

  writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        updatedFile: path.relative(ROOT, ESTATE_FILE),
        backupFile: path.relative(ROOT, backupFile),
        duplicateGroups: duplicateGroups.length,
        removedFeatures: removeIndexes.size,
        featureCountAfter: geojson.features.length,
        mergedGroups,
      },
      null,
      2
    )
  );

  console.log("Duplicate estate GeoJSON features merged.");
  console.log(`Updated file: ${path.relative(ROOT, ESTATE_FILE)}`);
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`Removed features: ${removeIndexes.size}`);
  console.log(`Feature count after: ${geojson.features.length}`);
  console.log(`Backup: ${path.relative(ROOT, backupFile)}`);
  console.log(`Report: ${path.relative(ROOT, REPORT_FILE)}`);

  console.table(
    mergedGroups.map((group) => ({
      key: group.key,
      keptIndex: group.keptIndex,
      keptId: group.keptId,
      removed: group.removed.map((record) => `${record.index}:${record.id}`).join(" | "),
      geometry: group.mergedGeometryType,
    }))
  );
}

main();
