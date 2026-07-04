import fs from "node:fs";
import path from "node:path";

const IN_FILE = "public/data/parcel-addresses.json";
const OUT_DIR = "public/data/parcels";
const OUT_REPORT = "reports/parcel-runtime-index-report.json";

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function stripEmpty(value) {
  if (Array.isArray(value)) {
    return value.map(stripEmpty).filter((item) => item !== undefined && item !== "");
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== "")
        .map(([key, item]) => [key, stripEmpty(item)]),
    );
  }

  return value;
}

function distanceMiles(a, b) {
  const R = 3958.8;
  const lat1 = (Number(a.lat) * Math.PI) / 180;
  const lat2 = (Number(b.lat) * Math.PI) / 180;
  const dLat = ((Number(b.lat) - Number(a.lat)) * Math.PI) / 180;
  const dLng = ((Number(b.lng) - Number(a.lng)) * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

if (!fs.existsSync(IN_FILE)) {
  throw new Error(`Missing ${IN_FILE}`);
}

const rows = JSON.parse(fs.readFileSync(IN_FILE, "utf8"));

const anchors = rows.filter(
  (r) =>
    r.taxiZoneId &&
    Number.isFinite(Number(r.lat)) &&
    Number.isFinite(Number(r.lng)) &&
    r.island,
);

let nearestZoneFilled = 0;

for (const row of rows) {
  if (row.taxiZoneId) continue;
  if (!Number.isFinite(Number(row.lat)) || !Number.isFinite(Number(row.lng))) continue;

  let best = null;

  for (const anchor of anchors) {
    const miles = distanceMiles(row, anchor);
    if (!best || miles < best.miles) {
      best = { anchor, miles };
    }
  }

  if (best) {
    row.taxiZoneId = best.anchor.taxiZoneId;
    row.island = best.anchor.island;
    row.nearestZoneMiles = Number(best.miles.toFixed(3));
    row.zoneFilledByNearest = true;
    row.needsZoneReview = false;
    row.confidence = Math.max(Number(row.confidence || 0), 65);
    nearestZoneFilled += 1;
  }
}

const runtimeRows = rows
  .map((r) =>
    stripEmpty({
      parcelId: r.parcelId,
      sourceParcelNo: r.sourceParcelNo,
      normalizedParcelId: r.normalizedParcelId,
      normalizedSearchKey: r.normalizedSearchKey,

      address: r.address,
      displayLabel: r.displayLabel,
      mapGeoPhysicalAddress: r.mapGeoPhysicalAddress,

      island: r.island,
      estateName: r.estateName,
      estateGeoid: r.estateGeoid,
      lat: r.lat,
      lng: r.lng,
      taxiZoneId: r.taxiZoneId,
      addressQuality: r.addressQuality,

      ownerName: r.ownerName,
      mapGeoMatched: r.mapGeoMatched || undefined,
      zoneFilledByNearest: r.zoneFilledByNearest || undefined,
      nearestZoneMiles: r.nearestZoneMiles,
    }),
  )
  .sort((a, b) =>
    `${a.island || ""} ${a.displayLabel || a.address || a.parcelId}`.localeCompare(
      `${b.island || ""} ${b.displayLabel || b.address || b.parcelId}`,
    ),
  );

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(OUT_REPORT), { recursive: true });

const byIsland = runtimeRows.reduce((acc, row) => {
  const island = row.island || "unknown";
  acc[island] ||= [];
  acc[island].push(row);
  return acc;
}, {});

for (const [island, islandRows] of Object.entries(byIsland)) {
  fs.writeFileSync(
    path.join(OUT_DIR, `${island}.json`),
    JSON.stringify(islandRows, null, 2),
  );
}

fs.writeFileSync(
  path.join(OUT_DIR, "all.json"),
  JSON.stringify(runtimeRows, null, 2),
);

const report = {
  generatedAt: new Date().toISOString(),
  source: IN_FILE,
  total: runtimeRows.length,
  nearestZoneFilled,
  withAddress: runtimeRows.filter((r) => r.address || r.mapGeoPhysicalAddress).length,
  withMapGeoPhysicalAddress: runtimeRows.filter((r) => r.mapGeoPhysicalAddress).length,
  withTaxiZone: runtimeRows.filter((r) => r.taxiZoneId).length,
  missingTaxiZone: runtimeRows.filter((r) => !r.taxiZoneId).length,
  byIsland: Object.fromEntries(
    Object.entries(byIsland).map(([island, islandRows]) => [island, islandRows.length]),
  ),
  files: Object.fromEntries(
    Object.entries(byIsland).map(([island]) => [
      island,
      `public/data/parcels/${island}.json`,
    ]),
  ),
  allFile: "public/data/parcels/all.json",
};

fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

console.log("Parcel runtime index built.");
console.log(JSON.stringify(report, null, 2));
