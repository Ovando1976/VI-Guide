// @ts-nocheck

import { geographicIndex } from "../src/data/core/geographicIndex";

function hasCoordinates(record: any) {
  if (typeof record?.lat === "number" && typeof record?.lng === "number") return true;

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

  if (record?.geometry) return true;

  return false;
}

function isLocationLike(record: any) {
  const type = String(record?.type || record?.kind || record?.featureType || "").toLowerCase();

  if (
    [
      "estate",
      "historic",
      "historic_site",
      "historic-site",
      "point",
      "bay",
      "cay",
      "beach",
      "road",
      "gut",
      "hill",
      "mountain",
      "valley",
      "plantation",
      "town",
      "place",
    ].includes(type)
  ) {
    return true;
  }

  return Boolean(record?.island || record?.name || record?.title);
}

const missing = geographicIndex
  .map((record, index) => ({ index, record }))
  .filter(({ record }) => isLocationLike(record) && !hasCoordinates(record))
  .map(({ index, record }) => ({
    index,
    name: record.name || record.title || record.label || "",
    type: record.type || record.kind || record.featureType || "",
    island: record.island || record.islandCode || "",
  }));

console.table({
  totalRecords: geographicIndex.length,
  missingCoordinates: missing.length,
});

console.table(missing.slice(0, 80));

const applied = await import("../reports/applied-island-safe-geographic-index-coordinates.json", {
  with: { type: "json" },
}).catch(() => null);

if (applied?.default?.appliedRecords) {
  const stillMissing = applied.default.appliedRecords.filter((record: any) =>
    missing.some((issue) => issue.index === record.index)
  );

  console.log("\nApplied records still missing:");
  console.table(
    stillMissing.map((record: any) => ({
      index: record.index,
      name: record.name,
      island: record.island,
      lat: record.coordinates.lat,
      lng: record.coordinates.lng,
    }))
  );
}
