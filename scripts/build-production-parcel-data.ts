import fs from "node:fs";
import path from "node:path";

const INPUT = path.resolve("public/data/usvi-parcels-mapgeo-enriched.geojson");

const OUT_MAP = path.resolve("public/data/usvi-parcels-map.geojson");
const OUT_INDEX = path.resolve("public/data/usvi-parcels.index.json");
const OUT_RECORDS = path.resolve("public/data/usvi-property-records.json");

type Feature = {
  type: "Feature";
  properties: Record<string, any>;
  geometry: any;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: Feature[];
};

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text || undefined;
}

function getCentroid(props: Record<string, any>) {
  const c = props.mapGeoCentroid ?? props.centroid;

  if (c?.type === "Point" && Array.isArray(c.coordinates)) {
    return {
      lng: Number(c.coordinates[0]),
      lat: Number(c.coordinates[1]),
    };
  }

  if (typeof c?.lat === "number" && typeof c?.lng === "number") {
    return c;
  }

  return null;
}

function inferQuarter(address?: string) {
  if (!address) return undefined;

  const text = address.toUpperCase();

  const matches = [
    "WEST END",
    "WESTEND",
    "LITTLE NORTHSIDE",
    "GREAT NORTHSIDE",
    "NEW QUARTER",
    "KINGS QUARTER",
    "QUEENS QUARTER",
    "EAST END",
    "SOUTHSIDE",
    "FRENCH BAY",
    "CRUZ BAY",
    "CORAL BAY",
    "CHRISTIANSTED",
    "FREDERIKSTED",
  ];

  return matches.find((q) => text.includes(q));
}

function buildSearchText(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .map(clean)
        .filter(Boolean)
        .map((v) => v as string)
    )
  );
}

function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Missing input file: ${INPUT}`);
  }

  const geojson = JSON.parse(fs.readFileSync(INPUT, "utf8")) as FeatureCollection;

  const index: any[] = [];
  const records: Record<string, any> = {};
  const mapFeatures: Feature[] = [];

  for (const feature of geojson.features) {
    const p = feature.properties ?? {};

    const parcelId = clean(p.parcelId ?? p.propertyId ?? p.sourceParcelNo);
    if (!parcelId) continue;

    const address = clean(p.mapGeoAddress ?? p.displayAddress ?? p.address);
    const ownerName = clean(p.ownerName);
    const island = clean(p.island);
    const estateName = clean(p.estateName);
    const quarterName = clean(p.quarterName) ?? inferQuarter(address);
    const centroid = getCentroid(p);

    const label = address ?? `Parcel ${parcelId}`;

    const searchText = buildSearchText([
      parcelId,
      label,
      address,
      ownerName,
      island,
      estateName,
      quarterName,
    ]);

    if (!records[parcelId]) {
      records[parcelId] = {
        parcelId,
        propertyId: parcelId,
        label,
        address,
        ownerName,
        island,
        estateName,
        quarterName,
        centroid,
        mapGeoRecordCount: p.mapGeoRecordCount ?? null,
        mapGeoSearchRank: p.mapGeoSearchRank ?? null,
        addressSource: p.addressSource ?? "mapgeo-direct-api",
        searchableText: searchText,
      };

      index.push({
        parcelId,
        label,
        address,
        ownerName,
        island,
        estateName,
        quarterName,
        lat: centroid?.lat ?? null,
        lng: centroid?.lng ?? null,
        searchableText: searchText,
      });
    }

    mapFeatures.push({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        parcelId,
        propertyId: parcelId,
        label,
        address,
        ownerName,
        island,
        estateName,
        quarterName,
        centroid,
      },
    });
  }

  const mapGeojson: FeatureCollection = {
    type: "FeatureCollection",
    features: mapFeatures,
  };

  fs.writeFileSync(OUT_MAP, JSON.stringify(mapGeojson));
  fs.writeFileSync(OUT_INDEX, JSON.stringify(index, null, 2));
  fs.writeFileSync(OUT_RECORDS, JSON.stringify(records, null, 2));

  console.log("Production parcel data built.");
  console.log(`Map features: ${mapFeatures.length}`);
  console.log(`Index records: ${index.length}`);
  console.log(`Property records: ${Object.keys(records).length}`);
  console.log(`Wrote ${OUT_MAP}`);
  console.log(`Wrote ${OUT_INDEX}`);
  console.log(`Wrote ${OUT_RECORDS}`);
}

main();
