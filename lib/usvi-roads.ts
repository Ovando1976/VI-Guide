import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
} from "geojson";

export type RoadsFeature = Feature<
  LineString | MultiLineString,
  {
    LINEARID?: string;
    FULLNAME?: string;
    RTTYP?: string;
    MTFCC?: string;
    ROADFLG?: string;
    [key: string]: unknown;
  }
>;

export type RoadsCollection = FeatureCollection<
  LineString | MultiLineString,
  {
    LINEARID?: string;
    FULLNAME?: string;
    RTTYP?: string;
    MTFCC?: string;
    ROADFLG?: string;
    [key: string]: unknown;
  }
>;

type BBox = [number, number, number, number];

const TIGERWEB_BASE =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation_LargeScale/MapServer";

const ROAD_LAYERS = [0, 1, 2];

function expandBBox([minLng, minLat, maxLng, maxLat]: BBox, pad = 0.01): BBox {
  return [minLng - pad, minLat - pad, maxLng + pad, maxLat + pad];
}

async function queryLayer(
  layerId: number,
  bbox: BBox
): Promise<RoadsFeature[]> {
  const [minLng, minLat, maxLng, maxLat] = expandBBox(bbox);

  const url =
    `${TIGERWEB_BASE}/${layerId}/query?` +
    new URLSearchParams({
      where: "1=1",
      geometry: `${minLng},${minLat},${maxLng},${maxLat}`,
      geometryType: "esriGeometryEnvelope",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "LINEARID,FULLNAME,RTTYP,MTFCC,ROADFLG",
      returnGeometry: "true",
      outSR: "4326",
      f: "geojson",
    }).toString();

  const res = await fetch(url, {
    headers: {
      Accept: "application/geo+json,application/json;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Road service returned non-JSON response (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(
      `Road service HTTP ${res.status}: ${
        json?.error?.message || text.slice(0, 200)
      }`
    );
  }

  if (json?.error) {
    throw new Error(
      `Road service error: ${json.error.message || "Unknown ArcGIS error."}`
    );
  }

  return Array.isArray(json?.features) ? (json.features as RoadsFeature[]) : [];
}

export async function fetchRoadsForEnvelope(
  bbox: BBox
): Promise<RoadsCollection> {
  const features: RoadsFeature[] = [];

  for (const layerId of ROAD_LAYERS) {
    try {
      const rows = await queryLayer(layerId, bbox);
      features.push(...rows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown roads layer failure";
      console.warn(`roads layer ${layerId} failed: ${message}`);
    }
  }

  const deduped = new Map<string, RoadsFeature>();

  for (const feature of features) {
    const key =
      String(feature.properties?.LINEARID || "") ||
      JSON.stringify(feature.geometry);

    if (!deduped.has(key)) {
      deduped.set(key, feature);
    }
  }

  return {
    type: "FeatureCollection",
    features: [...deduped.values()],
  };
}
