// scripts/backfill-estate-coordinates.ts

import fs from "node:fs";
import path from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  fs.readFileSync("serviceAccountKey.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const geojsonPath = path.resolve("public/geo/usvi-estates.geojson");
const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/estate/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getIslandCode(value: string) {
  const v = value.toLowerCase();

  if (v.includes("thomas") || v === "stt") return "st_thomas";
  if (v.includes("john") || v === "stj") return "st_john";
  if (v.includes("croix") || v === "stx") return "st_croix";
  if (v.includes("water")) return "water_island";

  return "unknown";
}

function polygonCentroid(coords: number[][][]) {
  const ring = coords[0];

  let lng = 0;
  let lat = 0;

  for (const point of ring) {
    lng += point[0];
    lat += point[1];
  }

  return {
    lng: lng / ring.length,
    lat: lat / ring.length,
  };
}

function getCentroid(feature: any) {
  const geometry = feature.geometry;

  if (!geometry) return null;

  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    return { lat, lng };
  }

  if (geometry.type === "Polygon") {
    return polygonCentroid(geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return polygonCentroid(geometry.coordinates[0]);
  }

  return null;
}

async function main() {
  const estateFeatures = geojson.features
    .map((feature: any) => {
      const props = feature.properties || {};

      const name =
        props.ESTATE ||
        props.Estate ||
        props.estate ||
        props.NAME ||
        props.name ||
        props.fullName ||
        "";

      const island =
        props.ISLAND ||
        props.Island ||
        props.island ||
        props.COUNTY ||
        props.county ||
        "";

      const centroid = getCentroid(feature);

      if (!name || !centroid) return null;

      return {
        name: String(name).trim(),
        normalizedName: normalize(String(name)),
        island: getIslandCode(String(island)),
        quarter:
          props.QUARTER ||
          props.Quarter ||
          props.quarter ||
          props.quarterName ||
          "",
        centroid,
      };
    })
    .filter(Boolean);

  const snap = await db.collection("estates").get();

  let updated = 0;
  let missing = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    const estateName =
      data.estateName ||
      data.baseName ||
      data.fullName ||
      data.name ||
      data.title ||
      data.raw?.ESTATE ||
      "";

    const island = getIslandCode(
      data.island || data.islandCode || data.county || data.raw?.ISLAND || ""
    );

    const match = estateFeatures.find(
      (estate: any) =>
        estate.normalizedName === normalize(String(estateName)) &&
        (estate.island === island || island === "unknown")
    );

    if (!match) {
      console.log("Missing coordinate match:", estateName, island);
      missing++;
      continue;
    }

    await doc.ref.update({
      name: estateName,
      island,
      quarter: data.quarter || match.quarter || "",
      centroid: match.centroid,
      coordinates: match.centroid,
      lat: match.centroid.lat,
      lng: match.centroid.lng,
      taxiZoneId:
        data.taxiZoneId ||
        `${island.replace("st_", "st")}_${normalize(String(estateName)).replace(
          /\s+/g,
          "_"
        )}`,
      updatedAt: new Date(),
    });

    updated++;
  }

  console.log({ updated, missing });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});