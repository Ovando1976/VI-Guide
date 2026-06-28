// scripts/probe-mapgeo-document-api.ts
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "https://usvi.mapgeo.io";
const OUT = "data/raw/mapgeo-document-probe.json";

const headers = {
  "user-agent": "Mozilla/5.0 VI-Guide MapGeo probe",
  accept: "application/json,text/html,*/*",
};

async function tryUrl(path: string) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, { headers });
  const text = await res.text();

  return {
    url,
    status: res.status,
    contentType: res.headers.get("content-type"),
    preview: text.slice(0, 1000),
  };
}

async function main() {
  mkdirSync("data/raw", { recursive: true });

  const probes = [
    "/api/mapgeo2/documents?",
    "/api/mapgeo2/documents?dataset=properties",
    "/api/mapgeo2/documents?dataset=stt-properties",
    "/api/mapgeo2/documents?dataset=parcels",
    "/api/mapgeo2/documents?limit=1",
    "/api/mapgeo2/documents?query=105602019100",
  ];

  const results = [];

  for (const probe of probes) {
    try {
      const result = await tryUrl(probe);
      console.log(result.status, result.url);
      results.push(result);
    } catch (error) {
      results.push({
        url: probe,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`Wrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});