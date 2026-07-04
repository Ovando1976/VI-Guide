import fs from "node:fs";
import path from "node:path";

const BASE_FILE = "public/data/parcel-addresses.json";
const MAPGEO_GEOJSON = "public/data/usvi-parcels-mapgeo-enriched.geojson";

const OUT_FILE = "public/data/parcel-addresses.json";
const OUT_BACKUP = "public/data/parcel-addresses.before-mapgeo-merge.json";
const OUT_REPORT = "reports/mapgeo-parcel-merge-report.json";

function clean(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function key(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function first(...values) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function parcelKeys(record) {
  return [
    record.parcelId,
    record.sourceParcelNo,
    record.normalizedParcelId,
    record.normalizedSearchKey,
    record.sourceParcelId,
    record.PARCEL_ID,
    record.PARCELID,
    record.PARCELNO,
    record.MAP_PAR_ID,
    record.MAP_PARID,
    record.PID,
    record.PIN,
    record.id,
  ]
    .map(key)
    .filter(Boolean);
}

function extractPhysicalAddress(props) {
  return first(
    props.mapGeoPhysicalAddress,
    props.mapGeoAddress,
    props.situsAddress,
    props.situs_address,
    props.SITUS_ADDRESS,
    props.siteAddress,
    props.SITE_ADDRESS,
    props.PROPERTY_ADDRESS,
    props.propertyAddress,
    props.PROP_ADDR,
    props.PHYSICAL_ADDRESS,
    props.LOCATION,
    props.location,
    props.Location,
  );
}

function extractMailingAddress(props) {
  return first(
    props.mapGeoOwnerMailingAddress,
    props.ownerMailingAddress,
    props.mailingAddress,
    props.MAILING_ADDRESS,
    props.MAIL_ADDR,
    props.address,
    props.ADDRESS,
    props.Address,
  );
}

function extractOwnerName(props) {
  return first(
    props.mapGeoOwnerName,
    props.ownerName,
    props.owner,
    props.OWNER,
    props.OWNER_NAME,
    props.OWN_NAME,
  );
}

function stripEmpty(value) {
  if (Array.isArray(value)) {
    return value.map(stripEmpty).filter((item) => item !== undefined && item !== "");
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== "")
        .map(([k, item]) => [k, stripEmpty(item)]),
    );
  }

  return value;
}

if (!fs.existsSync(BASE_FILE)) {
  throw new Error(`Missing ${BASE_FILE}`);
}

if (!fs.existsSync(MAPGEO_GEOJSON)) {
  throw new Error(`Missing ${MAPGEO_GEOJSON}`);
}

const baseRows = JSON.parse(fs.readFileSync(BASE_FILE, "utf8"));
const geo = JSON.parse(fs.readFileSync(MAPGEO_GEOJSON, "utf8"));
const features = geo.features || [];

fs.copyFileSync(BASE_FILE, OUT_BACKUP);

const mapgeoByKey = new Map();

for (const feature of features) {
  const props = feature.properties || {};

  for (const k of parcelKeys(props)) {
    if (!mapgeoByKey.has(k)) {
      mapgeoByKey.set(k, props);
    }
  }
}

let matched = 0;
let physicalAddressed = 0;
let mailingAddressed = 0;
let ownerNamed = 0;

const merged = baseRows.map((row) => {
  const props = parcelKeys(row)
    .map((k) => mapgeoByKey.get(k))
    .find(Boolean);

  if (!props) {
    return stripEmpty({
      ...row,
      mapGeoMatched: false,
    });
  }

  matched += 1;

  const physicalAddress = extractPhysicalAddress(props);
  const mailingAddress = extractMailingAddress(props);
  const ownerName = extractOwnerName(props);

  if (physicalAddress) physicalAddressed += 1;
  if (mailingAddress) mailingAddressed += 1;
  if (ownerName) ownerNamed += 1;

  const displayLabel =
    physicalAddress ||
    row.displayLabel ||
    row.address ||
    row.parcelId;

  return stripEmpty({
    ...row,

    address: physicalAddress || row.address,
    displayLabel,

    ownerName: ownerName || row.ownerName,

    mapGeoMatched: true,
    mapGeoPhysicalAddress: physicalAddress || undefined,
    mapGeoOwnerMailingAddress: mailingAddress || undefined,
    mapGeoOwnerName: ownerName || undefined,
    mapGeoImportedAt: new Date().toISOString(),
    mapGeoSource: MAPGEO_GEOJSON,

    addressQuality: physicalAddress
      ? "mapgeo_physical_address"
      : row.addressQuality,

    needsAddressReview: physicalAddress ? false : row.needsAddressReview,
  });
});

fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));

const report = {
  generatedAt: new Date().toISOString(),
  baseFile: BASE_FILE,
  backup: OUT_BACKUP,
  mapgeoGeojson: MAPGEO_GEOJSON,
  baseRows: baseRows.length,
  mapgeoFeatures: features.length,
  mapgeoLookupKeys: mapgeoByKey.size,
  matched,
  unmatched: baseRows.length - matched,
  physicalAddressed,
  mailingAddressed,
  ownerNamed,
  output: OUT_FILE,
  samplePhysicalAddresses: merged
    .filter((r) => r.mapGeoPhysicalAddress)
    .slice(0, 25)
    .map((r) => ({
      parcelId: r.parcelId,
      address: r.mapGeoPhysicalAddress,
      label: r.displayLabel,
      island: r.island,
      estateName: r.estateName,
      taxiZoneId: r.taxiZoneId,
    })),
};

fs.mkdirSync(path.dirname(OUT_REPORT), { recursive: true });
fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

console.log("MapGeo parcel merge complete.");
console.log(JSON.stringify(report, null, 2));
