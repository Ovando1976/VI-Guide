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

type ArcGisError = { error?: { message?: string; details?: string[] } };
type ArcGisCount = { count?: number };
type ArcGisLayerMetadata = {
  maxRecordCount?: number;
  editingInfo?: { lastEditDate?: number };
};

type GeoJsonGeometry = {
  type?: string;
  coordinates?: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  geometry: GeoJsonGeometry | null;
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
const VALIDATE_ONLY = process.env.PROPERTY_INGEST_VALIDATE_ONLY === "1";

async function fetchJson<T>(url: string, accept = "application/json"): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept } });
    if (!response.ok) throw new Error(`Parcel service returned HTTP ${response.status}.`);
    const payload = (await response.json()) as T & ArcGisError;
    if (payload.error) {
      const details = payload.error.details?.filter(Boolean).join(" ");
      throw new Error([payload.error.message ?? "Parcel service returned an ArcGIS error.", details].filter(Boolean).join(" "));
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function validateFeatureCollection(payload: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  if (payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    throw new Error("Parcel service did not return a GeoJSON FeatureCollection.");
  }
  return payload;
}

function hasValidParcelGeometry(geometry: GeoJsonGeometry | null): boolean {
  return Boolean(
    geometry &&
      (geometry.type === "Polygon" || geometry.type === "MultiPolygon") &&
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length,
  );
}

async function main() {
  const registry = JSON.parse(await readFile(REGISTRY_PATH, "utf8")) as SourceRegistry;
  const source = registry.sources.find((item) => item.id === "usvi-olg-parcels");
  if (!source) throw new Error("Missing usvi-olg-parcels source registry entry.");

  const metadataUrl = `${source.serviceUrl}?f=json`;
  const countParams = new URLSearchParams({ where: "1=1", returnCountOnly: "true", f: "json" });
  const [liveMetadata, countPayload] = await Promise.all([
    fetchJson<ArcGisLayerMetadata>(metadataUrl),
    fetchJson<ArcGisCount>(`${source.serviceUrl}/query?${countParams.toString()}`),
  ]);

  const expectedRecordCount = Number(countPayload.count);
  if (!Number.isSafeInteger(expectedRecordCount) || expectedRecordCount <= 0) {
    throw new Error("Parcel service returned an invalid authoritative record count.");
  }

  const liveMaxRecordCount = Number(liveMetadata.maxRecordCount);
  const configuredMaxRecordCount = Number(source.maxRecordCount);
  const pageSize = Math.max(
    1,
    Math.min(
      Number.isSafeInteger(configuredMaxRecordCount) ? configuredMaxRecordCount : 2000,
      Number.isSafeInteger(liveMaxRecordCount) ? liveMaxRecordCount : 2000,
      2000,
    ),
  );

  const features: GeoJsonFeature[] = [];
  let offset = 0;

  while (features.length < expectedRecordCount) {
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
    const page = validateFeatureCollection(
      await fetchJson<GeoJsonFeatureCollection>(
        `${source.serviceUrl}/query?${params.toString()}`,
        "application/geo+json, application/json",
      ),
    );

    if (!page.features.length) {
      throw new Error(
        `Parcel pagination stopped at ${features.length} of ${expectedRecordCount} authoritative records.`,
      );
    }
    if (page.features.length > pageSize) {
      throw new Error(`Parcel service returned ${page.features.length} records for a ${pageSize}-record page.`);
    }

    features.push(...page.features);
    offset += page.features.length;
    console.log(`Fetched ${page.features.length} parcels at offset ${offset - page.features.length}.`);
  }

  if (features.length !== expectedRecordCount) {
    throw new Error(
      `Parcel snapshot count mismatch: downloaded ${features.length}, authoritative count ${expectedRecordCount}.`,
    );
  }

  const seenObjectIds = new Set<string>();
  const seenGlobalIds = new Set<string>();
  for (const feature of features) {
    const objectId = String(feature.properties?.OBJECTID ?? "").trim();
    const globalId = String(feature.properties?.GlobalID ?? "").trim().toLowerCase();

    if (!objectId) throw new Error("Parcel feature is missing OBJECTID.");
    if (seenObjectIds.has(objectId)) throw new Error(`Duplicate parcel OBJECTID ${objectId}.`);
    seenObjectIds.add(objectId);

    if (!globalId) throw new Error(`Parcel feature ${objectId} is missing GlobalID.`);
    if (seenGlobalIds.has(globalId)) throw new Error(`Duplicate parcel GlobalID ${globalId}.`);
    seenGlobalIds.add(globalId);

    if (!hasValidParcelGeometry(feature.geometry)) {
      throw new Error(`Parcel feature ${objectId} has missing or invalid polygon geometry.`);
    }
  }

  const liveLastEdit = Number(liveMetadata.editingInfo?.lastEditDate);
  const sourceDataLastEdit = Number.isFinite(liveLastEdit)
    ? new Date(liveLastEdit).toISOString()
    : source.observedDataLastEdit ?? null;

  const collection: GeoJsonFeatureCollection = { type: "FeatureCollection", features };
  const metadata = {
    schemaVersion: 1,
    sourceId: source.id,
    sourceUrl: source.serviceUrl,
    sourceDataLastEdit,
    ingestedAt: new Date().toISOString(),
    targetSpatialReference: source.targetSpatialReference || 4326,
    expectedRecordCount,
    recordCount: features.length,
    uniqueObjectIdCount: seenObjectIds.size,
    uniqueGlobalIdCount: seenGlobalIds.size,
    geometryValidation: "all-features-polygon-or-multipolygon",
    fields: ["DPNR_ZONE", "PARCEL_NO", "MAP", "PARCEL_NAME", "ACRE", "GlobalID", "OBJECTID"],
    provenancePolicy: "source-native-values-only",
  };

  console.log("USVI OLG parcel validation:", JSON.stringify(metadata));

  if (VALIDATE_ONLY) {
    console.log("Validation-only mode complete; no snapshot files were written.");
    return;
  }

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
