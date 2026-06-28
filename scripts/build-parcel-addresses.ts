// scripts/build-parcel-addresses.ts

import fs from "node:fs";
import path from "node:path";

type IslandCode = "STT" | "STJ" | "STX" | "WAT";

type GeoJSONFeature = {
  type: "Feature";
  properties: Record<string, any>;
  geometry: any;
};

type GeoJSONCollection = {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
};

const INPUT = path.resolve("public/data/usvi-parcels.geojson");
const OUTPUT = path.resolve("public/data/usvi-parcels-addressed.geojson");

const ESTATE_POSTAL_CODES: Record<string, string> = {
  "STT:TUTU": "00802",
  "STT:SMITH BAY": "00802",
  "STT:RED HOOK": "00802",
  "STT:CHARLOTTE AMALIE": "00801",
  "STT:FRENCHTOWN": "00802",
  "STT:HAVENSIGHT": "00802",

  "STJ:CRUZ BAY": "00830",
  "STJ:CORAL BAY": "00830",

  "STX:CHRISTIANSTED": "00820",
  "STX:FREDERIKSTED": "00840",
  "STX:KINGSHILL": "00850",
};

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

function normalizeIsland(value?: string): IslandCode {
  const text = value?.toUpperCase().trim();

  if (text === "STT" || text?.includes("THOMAS")) return "STT";
  if (text === "STJ" || text?.includes("JOHN")) return "STJ";
  if (text === "STX" || text?.includes("CROIX")) return "STX";
  if (text === "WAT" || text?.includes("WATER")) return "WAT";

  return "STT";
}

function islandLabel(island: IslandCode): string {
  switch (island) {
    case "STT":
      return "St. Thomas";
    case "STJ":
      return "St. John";
    case "STX":
      return "St. Croix";
    case "WAT":
      return "Water Island";
  }
}

function pickProperty(props: Record<string, any>, keys: string[]): string | undefined {
  for (const key of keys) {
    const found = clean(props[key]);
    if (found) return found;
  }
  return undefined;
}

function getPostalCode(island: IslandCode, estateName?: string): string | undefined {
  if (!estateName) return undefined;
  return ESTATE_POSTAL_CODES[`${island}:${estateName.toUpperCase().trim()}`];
}

function getCentroidFromGeometry(geometry: any): { lat: number; lng: number } | undefined {
  const coords: number[][] = [];

  function walk(value: any) {
    if (!Array.isArray(value)) return;

    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      coords.push([value[0], value[1]]);
      return;
    }

    for (const item of value) walk(item);
  }

  walk(geometry?.coordinates);

  if (!coords.length) return undefined;

  const lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
  const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

  return { lat, lng };
}

function enrichParcel(feature: GeoJSONFeature): GeoJSONFeature {
  const props = feature.properties ?? {};

  const island = normalizeIsland(
    pickProperty(props, ["island", "islandCode", "ISLAND", "Island"])
  );

  const parcelId =
    pickProperty(props, [
      "parcelId",
      "parcel_id",
      "PARCELID",
      "PARCEL_ID",
      "parcel",
      "PARCEL",
      "pid",
      "PID",
      "OBJECTID",
    ]) ?? "Unknown Parcel";

  const estateName = pickProperty(props, [
    "estateName",
    "estate",
    "ESTATE",
    "Estate",
    "name",
    "NAME",
  ]);

  const quarterName = pickProperty(props, [
    "quarterName",
    "quarter",
    "QUARTER",
    "Quarter",
  ]);

  const postalCode = getPostalCode(island, estateName);
  const centroid = getCentroidFromGeometry(feature.geometry);

  const displayAddress = [
    estateName ? `Estate ${estateName}` : undefined,
    parcelId ? `Parcel ${parcelId}` : undefined,
    quarterName,
    islandLabel(island),
    postalCode ? `USVI ${postalCode}` : "USVI",
  ]
    .filter(Boolean)
    .join(", ");

  const searchableText = Array.from(
    new Set(
      [
        parcelId,
        estateName,
        estateName ? `Estate ${estateName}` : undefined,
        quarterName,
        islandLabel(island),
        postalCode,
        displayAddress,
      ]
        .filter(Boolean)
        .map(String)
    )
  );

  return {
    ...feature,
    properties: {
      ...props,
      parcelId,
      island,
      estateName,
      quarterName,
      postalCode,
      centroid,
      displayAddress,
      searchableText,
      addressSource: "generated-from-parcel-estate-quarter-island",
    },
  };
}

function main() {
  if (!fs.existsSync(INPUT)) {
    throw new Error(`Missing input file: ${INPUT}`);
  }

  const raw = fs.readFileSync(INPUT, "utf8");
  const geojson = JSON.parse(raw) as GeoJSONCollection;

  const enriched: GeoJSONCollection = {
    ...geojson,
    features: geojson.features.map(enrichParcel),
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));

  console.log("Parcel addresses built.");
  console.log(`Input: ${INPUT}`);
  console.log(`Output: ${OUTPUT}`);
  console.log(`Features: ${enriched.features.length}`);
}

main();