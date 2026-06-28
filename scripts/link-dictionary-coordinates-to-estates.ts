#!/usr/bin/env tsx

import fs from "node:fs/promises";
import path from "node:path";
import { geographicDictionaryCoordinates } from "../src/data/geographicDictionaryCoordinates";

const ESTATES_JSON = path.join(process.cwd(), "generated", "usvi-estates.json");
const OUT_JSON = path.join(process.cwd(), "generated", "estate-coordinate-links.json");
const OUT_TS = path.join(process.cwd(), "src/data/estateCoordinateLinks.ts");

type Point = [number, number];

type EstateGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type EstateRow = {
  geoid: string | number;
  name: string;
  island: string;
  quarter?: string | null;
  quarterGroup?: string | null;
  centroid?: { lat: number | null; lng: number | null } | null;
  geometry?: EstateGeometry | null;
};

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/^Estate\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toLngLat(point: number[]): Point | null {
  const a = Number(point[0]);
  const b = Number(point[1]);

  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

  if (a >= -66 && a <= -63 && b >= 17 && b <= 19) return [a, b];
  if (a >= 17 && a <= 19 && b >= -66 && b <= -63) return [b, a];

  return [a, b];
}

function normalizeRing(ring: number[][]): Point[] {
  return ring.map(toLngLat).filter(Boolean) as Point[];
}

function pointInRing(point: Point, ring: Point[]) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: Point, polygon: number[][][]) {
  const rings = polygon.map(normalizeRing).filter((ring) => ring.length >= 4);
  if (!rings.length) return false;

  if (!pointInRing(point, rings[0])) return false;

  for (const hole of rings.slice(1)) {
    if (pointInRing(point, hole)) return false;
  }

  return true;
}

function pointInsideGeometry(lng: number, lat: number, geometry?: EstateGeometry | null) {
  if (!geometry) return false;

  const point: Point = [lng, lat];

  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon: number[][][]) =>
      pointInPolygon(point, polygon)
    );
  }

  return false;
}

async function main() {
  const estates = JSON.parse(await fs.readFile(ESTATES_JSON, "utf8")) as EstateRow[];

  const estateLinks = estates.map((estate) => {
    const coordinates = geographicDictionaryCoordinates
      .filter((coord) => {
        if (coord.possibleIsland && coord.possibleIsland !== estate.island) {
          return false;
        }

        return pointInsideGeometry(coord.lng, coord.lat, estate.geometry);
      })
      .map((coord) => ({
        entryId: coord.entryId,
        sourceName: coord.sourceName,
        normalizedName: coord.normalizedName,
        lat: coord.lat,
        lng: coord.lng,
        rawLat: coord.rawLat,
        rawLng: coord.rawLng,
        possibleIsland: coord.possibleIsland,
        possibleQuarter: coord.possibleQuarter,
        confidence: 100,
        matchMethod: "point-in-estate-polygon",
        description: coord.description,
      }));

    return {
      geoid: String(estate.geoid),
      estateName: clean(estate.name),
      island: estate.island,
      quarter: estate.quarter ?? null,
      quarterGroup: estate.quarterGroup ?? null,
      estateCentroid: estate.centroid ?? null,
      matched: coordinates.length > 0,
      coordinateCount: coordinates.length,
      coordinates,
    };
  });

  const used = new Set(
    estateLinks.flatMap((estate) =>
      estate.coordinates.map((coord) => `${coord.entryId}:${coord.lat}:${coord.lng}`)
    )
  );

  const output = {
    generatedAt: new Date().toISOString(),
    totalEstates: estates.length,
    totalCoordinates: geographicDictionaryCoordinates.length,
    matchedEstates: estateLinks.filter((estate) => estate.matched).length,
    linkedCoordinates: used.size,
    unlinkedCoordinates: geographicDictionaryCoordinates.filter(
      (coord) => !used.has(`${coord.entryId}:${coord.lat}:${coord.lng}`)
    ),
    estateLinks,
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(output, null, 2));

  await fs.writeFile(
    OUT_TS,
    `export const estateCoordinateLinks = ${JSON.stringify(estateLinks, null, 2)};

export function getEstateCoordinateLinkByGeoid(geoid: string) {
  return estateCoordinateLinks.find((link) => String(link.geoid) === String(geoid)) ?? null;
}

export function getEstateCoordinatesByGeoid(geoid: string) {
  return getEstateCoordinateLinkByGeoid(geoid)?.coordinates ?? [];
}
`
  );

  console.log(`Coordinate records: ${geographicDictionaryCoordinates.length}`);
  console.log(`Matched estates: ${output.matchedEstates}`);
  console.log(`Linked coordinates: ${output.linkedCoordinates}`);
  console.log(`Unlinked coordinates: ${output.unlinkedCoordinates.length}`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_TS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});