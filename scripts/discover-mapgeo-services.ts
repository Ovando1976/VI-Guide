// scripts/discover-mapgeo-services.ts
import { mkdirSync, writeFileSync } from "node:fs";

const BASE_URL = "https://usvi.mapgeo.io";
const OUT_DIR = "data/raw";
const OUT_FILE = `${OUT_DIR}/mapgeo-discovered-services.json`;

const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (compatible; VI-Guide MapGeo discovery; +https://usvi.mapgeo.io)",
  accept: "text/html,application/json,text/javascript,*/*",
};

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function absoluteUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function cleanUrl(url: string): string {
  return url
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/[)"',;]+$/g, "");
}

function extractUrls(text: string): string[] {
  const urls = new Set<string>();

  const patterns = [
    /https?:\/\/[^"'\s<>\\)]+/g,
    /["']((?:\/_next\/static|\/static|\/assets|\/api|\/datasets|\/data)[^"']+)["']/g,
    /src=["']([^"']+\.js[^"']*)["']/g,
    /href=["']([^"']+\.js[^"']*)["']/g,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      urls.add(cleanUrl(absoluteUrl(match[1] || match[0])));
    }
  }

  return [...urls];
}

function extractServiceCandidates(text: string): string[] {
  const urls = new Set<string>();

  const patterns = [
    /https?:\/\/[^"'\s<>\\)]+(?:FeatureServer|MapServer)[^"'\s<>\\)]*/gi,
    /https?:\/\/[^"'\s<>\\)]+arcgis[^"'\s<>\\)]*/gi,
    /https?:\/\/[^"'\s<>\\)]+(?:parcel|property|properties|cama|assessor)[^"'\s<>\\)]*/gi,
    /["']([^"']*(?:FeatureServer|MapServer|arcgis|parcel|property|properties|cama|assessor)[^"']*)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = match[1] || match[0];
      if (!raw || raw.length < 8) continue;

      const url = raw.startsWith("http") || raw.startsWith("/")
        ? absoluteUrl(raw)
        : raw;

      urls.add(cleanUrl(url));
    }
  }

  return [...urls];
}

function looksImportant(url: string): boolean {
  const lower = url.toLowerCase();

  return (
    lower.includes("featureserver") ||
    lower.includes("mapserver") ||
    lower.includes("arcgis") ||
    lower.includes("parcel") ||
    lower.includes("property") ||
    lower.includes("properties") ||
    lower.includes("cama") ||
    lower.includes("assessor") ||
    lower.includes("dataset")
  );
}

async function tryArcgisProbe(url: string) {
  const base = url.split("?")[0].replace(/\/query$/i, "");
  const probes = [
    `${base}?f=json`,
    `${base}/query?where=1%3D1&outFields=*&returnGeometry=false&resultRecordCount=1&f=json`,
  ];

  for (const probe of probes) {
    const text = await fetchText(probe);
    if (!text || !text.trim().startsWith("{")) continue;

    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      return { probe, json };
    } catch {
      continue;
    }
  }

  return null;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const visited = new Set<string>();
  const queue: string[] = [BASE_URL];
  const serviceCandidates = new Set<string>();
  const bundles = new Set<string>();

  while (queue.length && visited.size < 150) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;

    visited.add(url);
    console.log(`Scanning ${url}`);

    const text = await fetchText(url);
    if (!text) continue;

    for (const found of extractUrls(text)) {
      if (found.includes(".js") || found.includes("/_next/") || found.includes("/static/")) {
        bundles.add(found);
        if (!visited.has(found)) queue.push(found);
      }

      if (looksImportant(found)) {
        serviceCandidates.add(found);
      }
    }

    for (const found of extractServiceCandidates(text)) {
      if (looksImportant(found)) {
        serviceCandidates.add(found);
      }
    }
  }

  const arcgisLike = [...serviceCandidates].filter((url) =>
    /FeatureServer|MapServer/i.test(url)
  );

  const probed = [];

  for (const candidate of arcgisLike) {
    const result = await tryArcgisProbe(candidate);
    if (result) {
      probed.push({
        candidate,
        probe: result.probe,
        serviceName: result.json.name ?? result.json.serviceDescription ?? null,
        geometryType: result.json.geometryType ?? null,
        fields: Array.isArray(result.json.fields)
          ? result.json.fields
          : undefined,
        rawKeys: Object.keys(result.json),
      });
    }
  }

  const output = {
    baseUrl: BASE_URL,
    discoveredAt: new Date().toISOString(),
    visited: [...visited],
    bundles: [...bundles],
    serviceCandidates: [...serviceCandidates],
    arcgisLike,
    probed,
  };

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));

  console.log("");
  console.log(`Visited: ${visited.size}`);
  console.log(`Bundles/static files: ${bundles.size}`);
  console.log(`Service candidates: ${serviceCandidates.size}`);
  console.log(`ArcGIS-like candidates: ${arcgisLike.length}`);
  console.log(`Probed ArcGIS services: ${probed.length}`);
  console.log(`Wrote ${OUT_FILE}`);

  if (probed.length === 0) {
    console.log("");
    console.log("No public ArcGIS service was confirmed automatically.");
    console.log("Next step: open usvi.mapgeo.io, search a parcel, then copy the Network XHR URL that returns parcel/property JSON.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});