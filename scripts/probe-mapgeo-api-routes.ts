// scripts/probe-mapgeo-api-routes.ts
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "https://usvi.mapgeo.io";
const OUT = "data/raw/mapgeo-api-route-probe.json";

const paths = [
  "/api/config",
  "/api/config/",
  "/api/config/datasets",
  "/api/config/dataset",
  "/api/config/community",
  "/api/config/communities",
  "/api/config/settings",
  "/api/datasets",
  "/api/dataset",
  "/api/properties",
  "/api/property",
  "/api/parcels",
  "/api/parcel",
  "/api/search",
  "/api/searches",
  "/api/autocomplete",
  "/api/geocode",
  "/api/map/features",
  "/api/features",
];

async function probe(path: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 VI-Guide MapGeo API route probe",
      accept: "application/json,text/html,*/*",
    },
  });

  const text = await res.text();

  return {
    path,
    url,
    status: res.status,
    contentType: res.headers.get("content-type"),
    isJson: text.trim().startsWith("{") || text.trim().startsWith("["),
    preview: text.slice(0, 800),
  };
}

async function main() {
  mkdirSync("data/raw", { recursive: true });

  const results = [];

  for (const path of paths) {
    const result = await probe(path);
    console.log(result.status, result.contentType, path);
    results.push(result);
  }

  writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});