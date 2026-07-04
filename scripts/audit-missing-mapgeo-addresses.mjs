import fs from "node:fs";
import path from "node:path";

const IN_FILE = "public/data/parcel-addresses.json";

const OUT_JSON = "generated/mapgeo/missing-mapgeo-addresses.json";
const OUT_CSV = "reports/missing-mapgeo-addresses.csv";
const OUT_BY_ESTATE = "reports/missing-mapgeo-addresses-by-estate.csv";
const OUT_BY_ZONE = "reports/missing-mapgeo-addresses-by-zone.csv";
const OUT_REPORT = "reports/mapgeo-address-coverage-report.json";

function clean(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function csv(value) {
  const text = clean(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function hasMapGeoPhysicalAddress(row) {
  return Boolean(
    clean(row.mapGeoPhysicalAddress) ||
      (row.addressQuality === "mapgeo_physical_address" && clean(row.address)),
  );
}

function displayFallback(row) {
  return (
    clean(row.displayLabel) ||
    clean(row.address) ||
    clean(row.estateName) ||
    clean(row.parcelId)
  );
}

function groupCount(rows, keyFn) {
  const map = new Map();

  for (const row of rows) {
    const key = keyFn(row) || "unknown";

    const current = map.get(key) || {
      key,
      total: 0,
      island: row.island || "",
      sampleParcelId: row.parcelId || "",
      sampleLabel: displayFallback(row),
    };

    current.total += 1;
    map.set(key, current);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

fs.mkdirSync("generated/mapgeo", { recursive: true });
fs.mkdirSync("reports", { recursive: true });

const rows = JSON.parse(fs.readFileSync(IN_FILE, "utf8"));

const addressed = rows.filter(hasMapGeoPhysicalAddress);
const missing = rows.filter((row) => !hasMapGeoPhysicalAddress(row));

const byIsland = {};
for (const row of rows) {
  const island = row.island || "unknown";
  byIsland[island] ||= {
    total: 0,
    addressed: 0,
    missing: 0,
    coveragePercent: 0,
  };

  byIsland[island].total += 1;

  if (hasMapGeoPhysicalAddress(row)) {
    byIsland[island].addressed += 1;
  } else {
    byIsland[island].missing += 1;
  }
}

for (const item of Object.values(byIsland)) {
  item.coveragePercent = Number(((item.addressed / item.total) * 100).toFixed(2));
}

const missingOutput = missing.map((row) => ({
  parcelId: row.parcelId,
  sourceParcelNo: row.sourceParcelNo,
  normalizedParcelId: row.normalizedParcelId,
  normalizedSearchKey: row.normalizedSearchKey,
  fallbackLabel: displayFallback(row),
  island: row.island || "",
  estateName: row.estateName || "",
  estateGeoid: row.estateGeoid || "",
  taxiZoneId: row.taxiZoneId || "",
  lat: row.lat ?? "",
  lng: row.lng ?? "",
  addressQuality: row.addressQuality || "",
  mapGeoMatched: row.mapGeoMatched === true,
  ownerName: row.ownerName || "",
  needsAddressReview: true,
  missingReason: "missing_mapgeo_physical_address",
}));

fs.writeFileSync(OUT_JSON, JSON.stringify(missingOutput, null, 2));

fs.writeFileSync(
  OUT_CSV,
  [
    [
      "parcelId",
      "sourceParcelNo",
      "normalizedParcelId",
      "normalizedSearchKey",
      "fallbackLabel",
      "island",
      "estateName",
      "estateGeoid",
      "taxiZoneId",
      "lat",
      "lng",
      "addressQuality",
      "mapGeoMatched",
      "ownerName",
      "missingReason",
    ].join(","),
    ...missingOutput.map((row) =>
      [
        row.parcelId,
        row.sourceParcelNo,
        row.normalizedParcelId,
        row.normalizedSearchKey,
        row.fallbackLabel,
        row.island,
        row.estateName,
        row.estateGeoid,
        row.taxiZoneId,
        row.lat,
        row.lng,
        row.addressQuality,
        row.mapGeoMatched,
        row.ownerName,
        row.missingReason,
      ]
        .map(csv)
        .join(","),
    ),
  ].join("\n"),
);

const byEstate = groupCount(
  missing,
  (row) => `${row.island || "unknown"}|${row.estateName || "unknown"}`,
).map((row) => {
  const [island, estateName] = row.key.split("|");
  return {
    island,
    estateName,
    missing: row.total,
    sampleParcelId: row.sampleParcelId,
    sampleLabel: row.sampleLabel,
  };
});

fs.writeFileSync(
  OUT_BY_ESTATE,
  [
    ["island", "estateName", "missing", "sampleParcelId", "sampleLabel"].join(","),
    ...byEstate.map((row) =>
      [
        row.island,
        row.estateName,
        row.missing,
        row.sampleParcelId,
        row.sampleLabel,
      ]
        .map(csv)
        .join(","),
    ),
  ].join("\n"),
);

const byZone = groupCount(
  missing,
  (row) => `${row.island || "unknown"}|${row.taxiZoneId || "unknown"}`,
).map((row) => {
  const [island, taxiZoneId] = row.key.split("|");
  return {
    island,
    taxiZoneId,
    missing: row.total,
    sampleParcelId: row.sampleParcelId,
    sampleLabel: row.sampleLabel,
  };
});

fs.writeFileSync(
  OUT_BY_ZONE,
  [
    ["island", "taxiZoneId", "missing", "sampleParcelId", "sampleLabel"].join(","),
    ...byZone.map((row) =>
      [
        row.island,
        row.taxiZoneId,
        row.missing,
        row.sampleParcelId,
        row.sampleLabel,
      ]
        .map(csv)
        .join(","),
    ),
  ].join("\n"),
);

const report = {
  generatedAt: new Date().toISOString(),
  source: IN_FILE,
  total: rows.length,
  addressed: addressed.length,
  missing: missing.length,
  coveragePercent: Number(((addressed.length / rows.length) * 100).toFixed(2)),
  byIsland,
  outputs: {
    json: OUT_JSON,
    csv: OUT_CSV,
    byEstate: OUT_BY_ESTATE,
    byZone: OUT_BY_ZONE,
  },
  topMissingEstates: byEstate.slice(0, 25),
  topMissingZones: byZone.slice(0, 25),
};

fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

console.log("MapGeo missing-address audit complete.");
console.log(JSON.stringify(report, null, 2));
