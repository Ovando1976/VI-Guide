// scripts/attach-estates-to-parcels.ts

import fs from "node:fs";
import path from "node:path";
import * as turf from "@turf/turf";

type Feature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, any>>;
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, any>>;

const PARCELS_PATH = path.resolve("public/data/usvi-parcels-addressed.geojson");
const ESTATES_PATH = path.resolve("public/data/usvi-estates.geojson");
const OUTPUT_PATH = path.resolve("public/data/usvi-parcels-addressed-estates.geojson");

function clean(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

function islandLabel(code?: string): string {
  switch (clean(code)?.toUpperCase()) {
    case "STT":
      return "St. Thomas";
    case "STJ":
      return "St. John";
    case "STX":
      return "St. Croix";
    case "WAT":
      return "Water Island";
    default:
      return "U.S. Virgin Islands";
  }
}

function normalizeIsland(value?: string): string {
  const text = clean(value)?.toUpperCase() ?? "";

  if (text === "STT" || text.includes("THOMAS")) return "STT";
  if (text === "STJ" || text.includes("JOHN")) return "STJ";
  if (text === "STX" || text.includes("CROIX")) return "STX";
  if (text === "WAT" || text.includes("WATER")) return "WAT";

  return "STT";
}

function pick(props: Record<string, any>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = clean(props[key]);
    if (value) return value;
  }
  return undefined;
}

function getCentroid(feature: Feature): { lat: number; lng: number } | undefined {
  const existing = feature.properties?.centroid;

  if (
    existing &&
    typeof existing.lat === "number" &&
    typeof existing.lng === "number"
  ) {
    return existing;
  }

  const center = turf.centroid(feature);
  const [lng, lat] = center.geometry.coordinates;

  return { lat, lng };
}

function buildAddress(props: Record<string, any>) {
  const island = normalizeIsland(props.island);
  const islandName = islandLabel(island);

  const parcelId = clean(props.parcelId) ?? clean(props.sourceParcelNo);
  const estateName = clean(props.estateName);
  const quarterName = clean(props.quarterName);
  const postalCode = clean(props.postalCode);

  const displayAddress = [
    estateName ? `Estate ${estateName}` : undefined,
    parcelId ? `Parcel ${parcelId}` : undefined,
    quarterName,
    islandName,
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
        islandName,
        postalCode,
        displayAddress,
      ]
        .filter(Boolean)
        .map(String)
    )
  );

  return { displayAddress, searchableText };
}

function estateInfo(estate: Feature) {
  const p = estate.properties ?? {};

  return {
    estateName:
      pick(p, [
        "estateName",
        "estate",
        "ESTATE",
        "Estate",
        "name",
        "NAME",
        "fullName",
        "FULLNAME",
      ]) ?? "Unknown Estate",

    quarterName: pick(p, [
      "quarterName",
      "quarter",
      "QUARTER",
      "Quarter",
      "district",
      "DISTRICT",
    ]),

    island: normalizeIsland(
      pick(p, ["island", "islandCode", "ISLAND", "Island"])
    ),

    estateGeoid: pick(p, ["geoid", "GEOID", "estateGeoid", "ESTATE_GEOID"]),
  };
}

function main() {
  const parcels = JSON.parse(fs.readFileSync(PARCELS_PATH, "utf8")) as FeatureCollection;
  const estates = JSON.parse(fs.readFileSync(ESTATES_PATH, "utf8")) as FeatureCollection;

  const estateFeatures = estates.features.filter((f) => f.geometry);

  let matched = 0;
  let unmatched = 0;

  for (const parcel of parcels.features) {
    const props = parcel.properties ?? {};
    parcel.properties = props;

    const centroid = getCentroid(parcel);
    if (!centroid) {
      unmatched++;
      continue;
    }

    props.centroid = centroid;

    const point = turf.point([centroid.lng, centroid.lat]);
    const parcelIsland = normalizeIsland(props.island);

    const candidates = estateFeatures.filter((estate) => {
      const info = estateInfo(estate);
      return info.island === parcelIsland || !info.island;
    });

    let found: Feature | undefined;

    for (const estate of candidates.length ? candidates : estateFeatures) {
      if (
  estate.geometry &&
  (estate.geometry.type === "Polygon" || estate.geometry.type === "MultiPolygon") &&
  turf.booleanPointInPolygon(
    point,
    estate as GeoJSON.Feature<
      GeoJSON.Polygon | GeoJSON.MultiPolygon,
      Record<string, any>
    >
  )
) {
        found = estate;
        break;
      }
    }

    if (found) {
      const info = estateInfo(found);

      props.estateName = info.estateName;
      props.quarterName = info.quarterName;
      props.estateGeoid = info.estateGeoid;
      props.island = parcelIsland;
      props.addressSource = "parcel-centroid-estate-spatial-join";

      matched++;
    } else {
      props.addressSource = "generated-parcel-only-no-estate-match";
      unmatched++;
    }

    const address = buildAddress(props);
    props.displayAddress = address.displayAddress;
    props.searchableText = address.searchableText;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(parcels, null, 2));

  console.log("Attached estates to parcels.");
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log(`Parcels: ${parcels.features.length}`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);
}

main();