#!/usr/bin/env tsx

/**
 * Fetch USVI parcel geometries from ArcGIS and normalize to GeoJSON + app JSON.
 *
 * Usage examples:
 *   npx tsx scripts/fetch-usvi-parcels.ts
 *   PARCELS_ITEM_ID=fe8753dec2c14a39adec5e6df2353cac npx tsx scripts/fetch-usvi-parcels.ts
 *   PARCELS_SERVICE_URL="https://.../FeatureServer/0" npx tsx scripts/fetch-usvi-parcels.ts
 *
 * Outputs:
 *   ./generated/usvi-parcels.geojson
 *   ./generated/usvi-parcels.json
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
};

type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type ParcelRecord = {
  parcelId: string;
  sourceParcelId: string | null;
  sourceParcelNo: string | null;
  sourceParcelName: string | null;
  address: string | null;
  plotNumber: string | null;
  lotNumber: string | null;
  blockNumber: string | null;
  estateName: string | null;
  estateGeoid: string | null;
  island: "stt" | "stj" | "stx" | "wat" | "unk";
  sourceObjectId: string | null;
  ownerName: string | null;
  centroid: { lat: number | null; lng: number | null };
  bbox: [number, number, number, number] | null;
  geometry: GeoJsonGeometry | null;
  raw: Record<string, unknown>;
};

const DEFAULT_ITEM_ID =
  process.env.PARCELS_ITEM_ID || "fe8753dec2c14a39adec5e6df2353cac";
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
  if (typeof data.url === "string" && /FeatureServer/i.test(String(data.url))) {
    return String(data.url).replace(/\/+$/, "") + "/0";
  }

  throw new Error(
    `Could not resolve a FeatureServer layer URL from item ${itemId}. Set PARCELS_SERVICE_URL explicitly.`
  );
}

async function describeLayer(serviceUrl: string): Promise<Record<string, unknown>> {
  return getJson<Record<string, unknown>>(
    `${serviceUrl}?f=json`,
    "ArcGIS layer description"
  );
}

async function fetchAllFeatures(serviceUrl: string): Promise<ArcGisFeature[]> {
  const layer = await describeLayer(serviceUrl);
  const objectIdField = String(
    layer.objectIdField || layer.objectIdFieldName || "OBJECTID"
  );
  const features: ArcGisFeature[] = [];
  let offset = 0;

  for (;;) {
    const params = new URLSearchParams({
      f: "json",
      where: "1=1",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      orderByFields: `${objectIdField} ASC`,
    });

    const page = await getJson<ArcGisQueryResponse>(
      `${serviceUrl}/query?${params.toString()}`,
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
  estateName: string | null,
  address: string | null
): ParcelRecord["island"] {
  const value = `${input || ""} ${estateName || ""} ${address || ""}`.toLowerCase();
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

function deriveParcelId(attrs: Record<string, unknown>): string {
  const candidates = [
    pick(attrs, [
      "PARCEL_ID",
      "PARCELID",
      "PIN",
      "PIN_NUM",
      "GIS_PIN",
      "PROP_ID",
      "PROPERTY_ID",
      "ID",
    ]),
    pick(attrs, [
      "PARCEL_NO",
      "PARCELNO",
      "APN",
      "TAXMAP",
      "MAPLOT",
      "PARCELNUMBER",
    ]),
    pick(attrs, ["OBJECTID", "FID"]),
  ];
  for (const candidate of candidates) {
    const text = normalizeText(candidate);
    if (text) return text;
  }
  throw new Error("Unable to derive parcelId for feature");
}

function normalizeFeature(feature: ArcGisFeature): ParcelRecord {
  const attrs = feature.attributes || {};
  const geometry = toGeoJsonGeometry(feature.geometry);
  const bbox =
    geometry?.type === "Polygon"
      ? combineBboxes(geometry.coordinates.map((ring) => ringBbox(ring)))
      : null;
  const centroid = computeCentroidFromBbox(bbox);

  const address = normalizeText(
    pick(attrs, ["ADDRESS", "SITE_ADDR", "SITUSADDR", "LOCATION", "PROP_ADDR"])
  );
  const estateName = normalizeText(
    pick(attrs, ["ESTATE", "ESTATENAME", "ESTATE_NAME", "DISTRICT", "SUBDIVISION"])
  );
  const sourceParcelId = normalizeText(
    pick(attrs, ["PARCEL_ID", "PARCELID", "PROPERTY_ID", "PROP_ID"])
  );
  const sourceParcelNo = normalizeText(
    pick(attrs, ["PARCEL_NO", "PARCELNO", "APN", "PIN", "PIN_NUM", "MAPLOT"])
  );
  const sourceParcelName = normalizeText(
    pick(attrs, ["NAME", "PARCEL_NAME", "LABEL"])
  );
  const islandText = normalizeText(pick(attrs, ["ISLAND", "COUNTY", "DISTRICT"]));
  const island = normalizeIsland(islandText, estateName, address);

  return {
    parcelId: deriveParcelId(attrs),
    sourceParcelId,
    sourceParcelNo,
    sourceParcelName,
    address,
    plotNumber: normalizeText(pick(attrs, ["PLOT", "PLOTNO", "PLOT_NUMBER"])),
    lotNumber: normalizeText(pick(attrs, ["LOT", "LOTNO", "LOT_NUMBER"])),
    blockNumber: normalizeText(pick(attrs, ["BLOCK", "BLOCKNO", "BLOCK_NUMBER"])),
    estateName,
    estateGeoid: normalizeText(
      pick(attrs, ["ESTATE_GEOID", "ESTATECODE", "ESTATE_CODE", "GEOID"])
    ),
    island,
    sourceObjectId: normalizeText(pick(attrs, ["OBJECTID", "FID"])),
    ownerName: normalizeText(
      pick(attrs, ["OWNER", "OWNERNAME", "OWNER_NAME", "OWNERNME1"])
    ),
    centroid,
    bbox,
    geometry,
    raw: attrs,
  };
}

async function main() {
  const serviceUrl =
    process.env.PARCELS_SERVICE_URL ||
    (await resolveServiceUrlFromItem(DEFAULT_ITEM_ID));
  const features = await fetchAllFeatures(serviceUrl);
  const records = features
    .map(normalizeFeature)
    .sort((a, b) => a.parcelId.localeCompare(b.parcelId));

  const geojson = {
    type: "FeatureCollection",
    features: records
      .filter((record) => record.geometry)
      .map((record) => ({
        type: "Feature",
        geometry: record.geometry,
        properties: {
          parcelId: record.parcelId,
          sourceParcelId: record.sourceParcelId,
          sourceParcelNo: record.sourceParcelNo,
          sourceParcelName: record.sourceParcelName,
          address: record.address,
          plotNumber: record.plotNumber,
          lotNumber: record.lotNumber,
          blockNumber: record.blockNumber,
          estateName: record.estateName,
          estateGeoid: record.estateGeoid,
          island: record.island,
          ownerName: record.ownerName,
          sourceObjectId: record.sourceObjectId,
        },
      })),
  };

  await fs.mkdir(DEFAULT_OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DEFAULT_OUTPUT_DIR, "usvi-parcels.json"),
    JSON.stringify(records, null, 2)
  );
  await fs.writeFile(
    path.join(DEFAULT_OUTPUT_DIR, "usvi-parcels.geojson"),
    JSON.stringify(geojson, null, 2)
  );

  console.log(`Fetched ${records.length} parcels from ${serviceUrl}`);
  console.log(`Wrote ${path.join(DEFAULT_OUTPUT_DIR, "usvi-parcels.json")}`);
  console.log(`Wrote ${path.join(DEFAULT_OUTPUT_DIR, "usvi-parcels.geojson")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
