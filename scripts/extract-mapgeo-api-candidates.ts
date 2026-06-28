// scripts/extract-mapgeo-api-candidates.ts
import { readFileSync, writeFileSync } from "node:fs";

const IN_FILE = "data/raw/mapgeo-discovered-services.json";
const OUT_FILE = "data/raw/mapgeo-api-candidates.txt";

type Discovery = {
  bundles?: string[];
  visited?: string[];
  serviceCandidates?: string[];
};

const headers = {
  "user-agent": "Mozilla/5.0 VI-Guide MapGeo API discovery",
  accept: "text/javascript,text/html,application/json,*/*",
};

function clean(value: string): string {
  return value
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/[)"',;]+$/g, "")
    .trim();
}

function isUseful(value: string): boolean {
  const lower = value.toLowerCase();

  if (!value.startsWith("http") && !value.startsWith("/")) return false;
  if (value.length > 500) return false;

  return [
    "api",
    "dataset",
    "datasets",
    "parcel",
    "parcels",
    "property",
    "properties",
    "search",
    "address",
    "owner",
    "cama",
    "mapgeo",
    "query",
  ].some((term) => lower.includes(term));
}

function extract(text: string): string[] {
  const found = new Set<string>();

  const patterns = [
    /https?:\/\/[^\s"'<>\\]+/g,
    /["'](\/api\/[^"']+)["']/g,
    /["'](\/datasets\/[^"']+)["']/g,
    /["'](\/data\/[^"']+)["']/g,
    /["'](\/properties[^"']*)["']/g,
    /["'](\/parcels[^"']*)["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = clean(match[1] || match[0]);
      if (isUseful(value)) found.add(value);
    }
  }

  return [...found];
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function main() {
  const discovery = JSON.parse(readFileSync(IN_FILE, "utf8")) as Discovery;

  const urls = [
    ...(discovery.bundles ?? []),
    ...(discovery.visited ?? []),
    ...(discovery.serviceCandidates ?? []),
  ].filter((url) => url.startsWith("http"));

  const candidates = new Set<string>();

  for (const url of urls) {
    try {
      const text = await fetchText(url);
      for (const item of extract(text)) candidates.add(item);
    } catch {
      // ignore bad/static endpoints
    }
  }

  const sorted = [...candidates].sort();

  writeFileSync(OUT_FILE, sorted.join("\n"));

  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Candidates: ${sorted.length}`);
  console.log(sorted.slice(0, 80).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});