import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SourceRegistry = {
  sources: Array<{
    id: string;
    serviceUrl: string;
    maxRecordCount: number;
    targetSpatialReference: number;
    observedDataLastEdit?: string;
  }>;
};

type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  geometry: unknown;
  properties?: Record<string, unknown> | null;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

const REGISTRY_PATH = path.resolve("data-products/usvi-property-intelligence/sources.json");
const OUTPUT_DIR = path.resolve("data/source/property-intelligence");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "usvi-olg-parcels.geojson");
const META_PATH = path.join(OUTPUT_DIR, "usvi-olg-parcels.meta.json");
const REQUEST_TIMEOUT_MS = 30_000;

async function fetchJson(url: string): Promise<GeoJsonFeatureCollection> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "application/geo+json, application/json" } });
    if (!response.ok) throw new Error(`Parcel service returned HTTP ${response.status}.`);
    const payload = (await response.json()) as GeoJsonFeatureCollection & { error?: { message?: string } };
    if (payload.error) throw new Error(payload.error.message ?? "Parcel service returned an ArcGIS error.");
    if (payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
      throw new Error("Parcel service did not return a GeoJSON FeatureCollection.");
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8")) as SourceRegistry;
  const source = registry.sources.find((item) => item.id === "usvi-olg-parcels");
  if (!source) throw new Error("Missing usvi-olg-parcels source registry entry.");

  const pageSize = Math.max(1, Math.min(source.maxRecordCount || 2000, 2000));
  const features: GeoJsonFeature[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "DPNR_ZONE,PARCEL_NO,MAP,PARCEL_NAME,ACRE,GlobalID,OBJECTID",
      returnGeometry: "true",
      outSR: String(source.targetSpatialReference || 4326),
      f: "geojson",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      orderByFields: "OBJECTID ASC",
    });
    const page = await fetchJson(`${source.serviceUrl}/query?${params.toString()}`);
    features.push(...page.features);
    console.log(`Fetched ${page.features.length} parcels at offset ${offset}.`);
    if (page.features.length < pageSize) break;
    offset += pageSize;
  }

  const seenObjectIds = new Set<string>();
  for (const feature of features) {
    const objectId = String(feature.properties?.OBJECTID ?? "").trim();
    if (!objectId) throw new Error("Parcel feature is missing OBJECTID.");
    if (seenObjectIds.has(objectId)) throw new Error(`Duplicate parcel OBJECTID ${objectId}.`);
    seenObjectIds.add(objectId);
  }

  const collection: GeoJsonFeatureCollection = { type: "FeatureCollection", features };
  const metadata = {
    schemaVersion: 1,
    sourceId: source.id,
    sourceUrl: source.serviceUrl,
    sourceObservedDataLastEdit: source.observedDataLastEdit ?? null,
    ingestedAt: new Date().toISOString(),
    targetSpatialReference: source.targetSpatialReference || 4326,
    recordCount: features.length,
    fields: ["DPNR_ZONE", "PARCEL_NO", "MAP", "PARCEL_NAME", "ACRE", "GlobalID", "OBJECTID"],
    provenancePolicy: "source-native-values-only",
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(OUTPUT_PATH, JSON.stringify(collection) + "\n", "utf8"),
    writeFile(META_PATH, JSON.stringify(metadata, null, 2) + "\n", "utf8"),
  ]);

  console.log(`USVI OLG parcel ingestion complete: ${features.length} records.`);
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}.`);
}

main().catch((error) => {
  console.error("USVI OLG parcel ingestion failed:", error);
  process.exit(1);
});
