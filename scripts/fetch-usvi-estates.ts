#!/usr/bin/env tsx

/**
 * Fetch USVI estates from ArcGIS and normalize to GeoJSON + app JSON.
 *
 * Usage examples:
 *   npx tsx scripts/fetch-usvi-estates.ts
 *   ESTATES_ITEM_ID=9188513e17bf471f8a5935fb3371a17c npx tsx scripts/fetch-usvi-estates.ts
 *   ESTATES_SERVICE_URL="https://.../FeatureServer/0" npx tsx scripts/fetch-usvi-estates.ts
 *
 * Outputs:
 *   ./generated/usvi-estates.geojson
 *   ./generated/usvi-estates.json
 */

import fs from "node:fs/promises";
import path from "node:path";

type ArcGisFeature = {
  attributes?: Record<string, unknown>;
  geometry?: unknown;
};

type ArcGisQueryResponse = {
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  objectIdFieldName?: string;
  fields?: Array<{ name: string; type?: string }>;
};

type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type EstateRecord = {
  geoid: string;
  estateCode: string | null;
  name: string;
  aliases: string[];
  island: "stt" | "stj" | "stx" | "wat" | "unk";
  county: string | null;
  sourceObjectId: string | null;
  centroid: { lat: number | null; lng: number | null };
  bbox: [number, number, number, number] | null;
  geometry: GeoJsonGeometry | null;
  raw: Record<string, unknown>;
};

const DEFAULT_ITEM_ID =
  process.env.ESTATES_ITEM_ID || "9188513e17bf471f8a5935fb3371a17c";
const DEFAULT_OUTPUT_DIR =
  process.env.OUTPUT_DIR || path.join(process.cwd(), "generated");
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 1000);

function assertOk(response: Response, label: string) {
  if (!response.ok) {
    throw new Error(
      `${label} failed: ${response.status} ${response.statusText}`
    );
  }
}

async function getJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "usvi-data-fetcher/1.0",
    },
  });
  assertOk(response, label);
  return (await response.json()) as T;
}

async function resolveServiceUrlFromItem(itemId: string): Promise<string> {
  const metaUrl = `https://www.arcgis.com/sharing/rest/content/items/${itemId}?f=json`;
  const meta = await getJson<Record<string, unknown>>(
    metaUrl,
    "ArcGIS item metadata"
  );

  const directUrl = typeof meta.url === "string" ? meta.url : null;
  if (directUrl && /FeatureServer/i.test(directUrl)) {
    return directUrl.replace(/\/+$/, "") + "/0";
  }

  const dataUrl = `https://www.arcgis.com/sharing/rest/content/items/${itemId}/data?f=json`;
  const data = await getJson<Record<string, unknown>>(
    dataUrl,
    "ArcGIS item data"
  );

  const candidates = [
    data?.url,
    data?.serviceItemId,
    (data as Record<string, unknown>)?.layers,
  ];

  if (
    typeof candidates[0] === "string" &&
    /FeatureServer/i.test(candidates[0])
  ) {
    return String(candidates[0]).replace(/\/+$/, "") + "/0";
  }

  throw new Error(
    `Could not resolve a FeatureServer layer URL from item ${itemId}. Set ESTATES_SERVICE_URL explicitly.`
  );
}

async function describeLayer(serviceUrl: string): Promise<Record<string, unknown>> {
  const url = `${serviceUrl}?f=json`;
  return getJson<Record<string, unknown>>(url, "ArcGIS layer description");
}

function toQueryGeometry(fields: string[]): string {
  const lower = new Set(fields.map((f) => f.toLowerCase()));
  if (lower.has("shape") || lower.has("shape__area")) {
    return "true";
  }
  return "true";
}

async function fetchAllFeatures(serviceUrl: string): Promise<ArcGisFeature[]> {
  const layer = await describeLayer(serviceUrl);
  const objectIdField = String(
    layer.objectIdField || layer.objectIdFieldName || "OBJECTID"
  );
  const fields = Array.isArray(layer.fields)
    ? (layer.fields as Array<{ name: string }>).map((f) => f.name)
    : [];

  const features: ArcGisFeature[] = [];
  let offset = 0;

  for (;;) {
    const params = new URLSearchParams({
      f: "json",
      where: "1=1",
      outFields: "*",
      returnGeometry: toQueryGeometry(fields),
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      orderByFields: `${objectIdField} ASC`,
    });

    const url = `${serviceUrl}/query?${params.toString()}`;
    const page = await getJson<ArcGisQueryResponse>(
      url,
      `ArcGIS query offset=${offset}`
    );
    const pageFeatures = page.features || [];
    features.push(...pageFeatures);

    if (!page.exceededTransferLimit || pageFeatures.length === 0) {
      break;
    }
    offset += pageFeatures.length;
  }

  return features;
}

function normalizeText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function pick(attrs: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in attrs && attrs[key] != null && String(attrs[key]).trim() !== "") {
      return attrs[key];
    }
  }
  const lowerMap = new Map<string, unknown>();
  for (const [key, value] of Object.entries(attrs)) lowerMap.set(key.toLowerCase(), value);
  for (const key of keys) {
    const hit = lowerMap.get(key.toLowerCase());
    if (hit != null && String(hit).trim() !== "") return hit;
  }
  return null;
}

function normalizeIsland(
  input: string | null,
  county: string | null
): EstateRecord["island"] {
  const value = `${input || ""} ${county || ""}`.toLowerCase();
  if (
    value.includes("st. thomas") ||
    value.includes("saint thomas") ||
    /\bstt\b/.test(value)
  )
    return "stt";
  if (
    value.includes("st. john") ||
    value.includes("saint john") ||
    /\bstj\b/.test(value)
  )
    return "stj";
  if (
    value.includes("st. croix") ||
    value.includes("saint croix") ||
    /\bstx\b/.test(value)
  )
    return "stx";
  if (value.includes("water island")) return "wat";
  return "unk";
}

function ringBbox(ring: number[][]): [number, number, number, number] | null {
  if (!ring.length) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const point of ring) {
    const [lng, lat] = point;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  return Number.isFinite(minLng) ? [minLng, minLat, maxLng, maxLat] : null;
}

function combineBboxes(
  boxes: Array<[number, number, number, number] | null>
): [number, number, number, number] | null {
  const valid = boxes.filter(Boolean) as Array<[number, number, number, number]>;
  if (!valid.length) return null;
  return [
    Math.min(...valid.map((b) => b[0])),
    Math.min(...valid.map((b) => b[1])),
    Math.max(...valid.map((b) => b[2])),
    Math.max(...valid.map((b) => b[3])),
  ];
}

function computeCentroidFromBbox(bbox: [number, number, number, number] | null) {
  if (!bbox) return { lat: null, lng: null };
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

function toGeoJsonGeometry(geometry: unknown): GeoJsonGeometry | null {
  if (!geometry || typeof geometry !== "object") return null;
  const rings = (geometry as { rings?: unknown }).rings;
  if (!Array.isArray(rings)) return null;
  const normalized = rings
    .filter(Array.isArray)
    .map((ring) =>
      (ring as unknown[])
        .filter(Array.isArray)
        .map((pair) => {
          const [x, y] = pair as [number, number];
          return [Number(x), Number(y)];
        })
        .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    )
    .filter((ring) => ring.length >= 4);

  if (!normalized.length) return null;
  return { type: "Polygon", coordinates: normalized as number[][][] };
}

function ensureEstateName(name: string | null): string {
  if (!name) return "Unknown Estate";
  return /^estate\b/i.test(name) ? name : `Estate ${name}`;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = normalizeText(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function normalizeFeature(feature: ArcGisFeature): EstateRecord {
  const attrs = feature.attributes || {};
  const rawName = normalizeText(
    pick(attrs, ["ESTATENAME", "ESTATE_NAME", "NAME", "LABEL", "FULLNAME", "Estate_Name"])
  );
  const county = normalizeText(pick(attrs, ["COUNTY", "COUNTYNAME", "ISLAND", "DISTRICT"]));
  const island = normalizeIsland(normalizeText(pick(attrs, ["ISLAND", "DISTRICT"])), county);
  const estateCode = normalizeText(pick(attrs, ["ESTATECODE", "ESTATE_CODE", "CODE", "ID"]));
  const sourceObjectId = normalizeText(pick(attrs, ["OBJECTID", "FID", "ID"]));
  const geometry = toGeoJsonGeometry(feature.geometry);
  const bbox =
    geometry?.type === "Polygon"
      ? combineBboxes(geometry.coordinates.map((ring) => ringBbox(ring)))
      : null;
  const centroid = computeCentroidFromBbox(bbox);
  const name = ensureEstateName(rawName);
  const geoid = String(
    estateCode ||
      pick(attrs, ["GEOID", "GEO_ID", "OBJECTID", "FID"]) ||
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  );

  return {
    geoid,
    estateCode,
    name,
    aliases: uniqueStrings([
      rawName,
      name.replace(/^Estate\s+/i, ""),
      normalizeText(pick(attrs, ["ALIAS", "ALIASES", "SHORTNAME"])),
    ]),
    island,
    county,
    sourceObjectId,
    centroid,
    bbox,
    geometry,
    raw: attrs,
  };
}

async function main() {
  const serviceUrl =
    process.env.ESTATES_SERVICE_URL ||
    (await resolveServiceUrlFromItem(DEFAULT_ITEM_ID));
  const features = await fetchAllFeatures(serviceUrl);
  const records = features
    .map(normalizeFeature)
    .sort((a, b) => a.name.localeCompare(b.name));

  const geojson = {
    type: "FeatureCollection",
    features: records
      .filter((record) => record.geometry)
      .map((record) => ({
        type: "Feature",
        geometry: record.geometry,
        properties: {
          geoid: record.geoid,
          estateCode: record.estateCode,
          name: record.name,
          aliases: record.aliases,
          island: record.island,
          county: record.county,
          sourceObjectId: record.sourceObjectId,
        },
      })),
  };

  await fs.mkdir(DEFAULT_OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DEFAULT_OUTPUT_DIR, "usvi-estates.json"),
    JSON.stringify(records, null, 2)
  );
  await fs.writeFile(
    path.join(DEFAULT_OUTPUT_DIR, "usvi-estates.geojson"),
    JSON.stringify(geojson, null, 2)
  );

  console.log(`Fetched ${records.length} estates from ${serviceUrl}`);
  console.log(`Wrote ${path.join(DEFAULT_OUTPUT_DIR, "usvi-estates.json")}`);
  console.log(`Wrote ${path.join(DEFAULT_OUTPUT_DIR, "usvi-estates.geojson")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
