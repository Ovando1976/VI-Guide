import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { bbox, booleanPointInPolygon, pointOnFeature } from "@turf/turf";
import type { Feature, MultiPolygon, Point, Polygon } from "geojson";

type PropertyIsland = "stt" | "stj" | "stx";
type PolygonGeometry = Polygon | MultiPolygon;

type EstateRecord = {
  geoid?: string;
  baseName?: string;
  fullName?: string;
  island?: PropertyIsland;
  geometry?: PolygonGeometry | null;
};

type ParcelFeature = Feature<PolygonGeometry, Record<string, unknown>>;
type ParcelCollection = {
  type: "FeatureCollection";
  features: ParcelFeature[];
};

type EstateCandidate = {
  geoid: string;
  name: string;
  fullName: string;
  island: PropertyIsland;
  geometry: PolygonGeometry;
  bounds: [number, number, number, number];
};

const ESTATE_PATH = path.resolve("data/derived/estates.enriched-with-dictionary.json");
const PARCEL_PATH = path.resolve("data/source/property-intelligence/usvi-olg-parcels.geojson");
const PARCEL_META_PATH = path.resolve("data/source/property-intelligence/usvi-olg-parcels.meta.json");
const OUTPUT_DIR = path.resolve("data/derived/property-intelligence");
const JOINED_PATH = path.join(OUTPUT_DIR, "usvi-parcels.joined.json");
const AUDIT_PATH = path.join(OUTPUT_DIR, "usvi-parcels.join.audit.json");

function isPropertyIsland(value: unknown): value is PropertyIsland {
  return value === "stt" || value === "stj" || value === "stx";
}

function isPolygonGeometry(value: unknown): value is PolygonGeometry {
  if (!value || typeof value !== "object") return false;
  const geometry = value as { type?: unknown; coordinates?: unknown };
  return (
    (geometry.type === "Polygon" || geometry.type === "MultiPolygon") &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0
  );
}

function normalizeEstates(records: EstateRecord[]): EstateCandidate[] {
  const estates: EstateCandidate[] = [];
  const seenGeoids = new Set<string>();

  for (const record of records) {
    const geoid = String(record.geoid ?? "").trim();
    const name = String(record.baseName ?? "").trim();
    if (!geoid || !name || !isPropertyIsland(record.island) || !isPolygonGeometry(record.geometry)) continue;
    if (seenGeoids.has(geoid)) throw new Error(`Duplicate canonical estate GEOID ${geoid}.`);
    seenGeoids.add(geoid);

    const feature: Feature<PolygonGeometry> = {
      type: "Feature",
      properties: {},
      geometry: record.geometry,
    };
    const bounds = bbox(feature) as [number, number, number, number];
    estates.push({
      geoid,
      name,
      fullName: String(record.fullName ?? name).trim() || name,
      island: record.island,
      geometry: record.geometry,
      bounds,
    });
  }

  if (!estates.length) throw new Error("Canonical estate source produced no polygon geometries.");
  return estates.sort((a, b) => a.geoid.localeCompare(b.geoid));
}

function candidateContainsPoint(candidate: EstateCandidate, point: Feature<Point>): boolean {
  const [lng, lat] = point.geometry.coordinates;
  const [minLng, minLat, maxLng, maxLat] = candidate.bounds;
  if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) return false;
  return booleanPointInPolygon(point, candidate.geometry);
}

function clean(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

async function main() {
  const [estateRaw, parcelRaw, parcelMetaRaw] = await Promise.all([
    readFile(ESTATE_PATH, "utf8"),
    readFile(PARCEL_PATH, "utf8"),
    readFile(PARCEL_META_PATH, "utf8"),
  ]);

  const estateRecords = JSON.parse(estateRaw) as EstateRecord[];
  const parcelCollection = JSON.parse(parcelRaw) as ParcelCollection;
  const parcelMeta = JSON.parse(parcelMetaRaw) as Record<string, unknown>;

  if (!Array.isArray(estateRecords)) throw new Error("Canonical estate source is not an array.");
  if (parcelCollection.type !== "FeatureCollection" || !Array.isArray(parcelCollection.features)) {
    throw new Error("Parcel snapshot is not a GeoJSON FeatureCollection.");
  }

  const estates = normalizeEstates(estateRecords);
  const joined: Array<Record<string, unknown>> = [];
  const unmatched: Array<Record<string, unknown>> = [];
  const ambiguous: Array<Record<string, unknown>> = [];
  const byIsland: Record<PropertyIsland, number> = { stt: 0, stj: 0, stx: 0 };

  for (const parcel of parcelCollection.features) {
    if (!isPolygonGeometry(parcel.geometry)) {
      throw new Error(`Ingested parcel ${clean(parcel.properties?.OBJECTID) ?? "unknown"} has invalid geometry.`);
    }

    const representativePoint = pointOnFeature(parcel);
    const matches = estates.filter((estate) => candidateContainsPoint(estate, representativePoint));
    const parcelIdentity = {
      objectId: clean(parcel.properties?.OBJECTID),
      globalId: clean(parcel.properties?.GlobalID),
      parcelId: clean(parcel.properties?.PARCEL_NO),
      cadastralMap: clean(parcel.properties?.MAP),
      parcelName: clean(parcel.properties?.PARCEL_NAME),
      acreage: clean(parcel.properties?.ACRE),
      zoning: clean(parcel.properties?.DPNR_ZONE),
    };

    if (matches.length !== 1) {
      const reviewRecord = {
        ...parcelIdentity,
        representativePoint: representativePoint.geometry.coordinates,
        candidateEstateGeoids: matches.map((match) => match.geoid),
      };
      if (matches.length === 0) unmatched.push(reviewRecord);
      else ambiguous.push(reviewRecord);
      continue;
    }

    const estate = matches[0];
    byIsland[estate.island] += 1;
    joined.push({
      ...parcelIdentity,
      estate: {
        geoid: estate.geoid,
        name: estate.name,
        fullName: estate.fullName,
        island: estate.island,
      },
      join: {
        method: "turf-point-on-feature-within-canonical-estate-polygon",
        status: "matched",
      },
      provenance: {
        parcelSource: "usvi-olg-parcels",
        parcelSourceDataLastEdit: parcelMeta.sourceDataLastEdit ?? null,
        estateSource: "data/derived/estates.enriched-with-dictionary.json",
        policy: "source-native-values-and-deterministic-spatial-join",
      },
    });
  }

  const total = parcelCollection.features.length;
  const reviewed = joined.length + unmatched.length + ambiguous.length;
  if (reviewed !== total) throw new Error(`Join accounting mismatch: reviewed ${reviewed} of ${total} parcels.`);

  // Fail closed: downstream API/export code must not promote parcel overlays while
  // any source parcel lacks exactly one canonical estate match.
  const releaseReady = unmatched.length === 0 && ambiguous.length === 0 && joined.length === total;
  const audit = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    parcelSource: "usvi-olg-parcels",
    parcelSourceDataLastEdit: parcelMeta.sourceDataLastEdit ?? null,
    estateSource: "data/derived/estates.enriched-with-dictionary.json",
    estatePolygonCount: estates.length,
    parcelCount: total,
    matchedCount: joined.length,
    unmatchedCount: unmatched.length,
    ambiguousCount: ambiguous.length,
    matchRate: total ? joined.length / total : 0,
    matchedByIsland: byIsland,
    releaseReady,
    releaseGate: "every-ingested-parcel-must-match-exactly-one-canonical-estate",
    unmatched,
    ambiguous,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(JOINED_PATH, JSON.stringify(joined, null, 2) + "\n", "utf8"),
    writeFile(AUDIT_PATH, JSON.stringify(audit, null, 2) + "\n", "utf8"),
  ]);

  console.log("USVI parcel-to-estate spatial join:", JSON.stringify({ ...audit, unmatched: undefined, ambiguous: undefined }));
  console.log(`Wrote ${path.relative(process.cwd(), JOINED_PATH)}.`);
  console.log(`Wrote ${path.relative(process.cwd(), AUDIT_PATH)}.`);

  if (!releaseReady) {
    console.error(
      `Property overlay release gate remains closed: ${unmatched.length} unmatched, ${ambiguous.length} ambiguous.`,
    );
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("USVI parcel-to-estate join failed:", error);
  process.exit(1);
});
