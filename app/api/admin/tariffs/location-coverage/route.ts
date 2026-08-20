import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  auditTariffLocationCoverage,
  buildTariffLocationResolver,
  type TariffLocationMapping,
  type TariffResolvablePlace,
} from "@/lib/tariff-location-resolver";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { resolveOfficialTaxiFareEndpoint } from "@/lib/official-taxi-fare-engine";
import { taxiEndpointGovernanceHold } from "@/lib/taxi-endpoint-governance";
import type { OfficialTaxiTariff } from "@/types/taxi-operations";

type UnknownRecord = Record<string, unknown>;
type Island = TariffResolvablePlace["island"];
type CoveragePlace = TariffResolvablePlace & {
  lat?: number;
  lng?: number;
};
type EstateBoundary = {
  geoid: string;
  island: Island;
  name: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};

const INPUTS = [
  "data/generated/geographic-dictionary-cleaned.json",
  "data/generated/modern-estates.normalized.json",
  "data/territory-coordinates.json",
];
const ESTATES_PATH = "data/generated/modern-estates.normalized.json";
const MAPPINGS_PATH = "data/tariff-location-mappings.reviewed.json";
const ISLANDS: Island[] = ["stt", "stj", "stx"];

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
}

function records(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is UnknownRecord => Boolean(item) && typeof item === "object",
    );
  }
  if (!value || typeof value !== "object") return [];

  const object = value as UnknownRecord;
  for (const key of ["records", "places", "features", "items", "entries", "data"]) {
    if (Array.isArray(object[key])) return records(object[key]);
  }

  return Object.entries(object)
    .filter(
      (entry): entry is [string, UnknownRecord] =>
        Boolean(entry[1]) && typeof entry[1] === "object" && !Array.isArray(entry[1]),
    )
    .map(([key, record]) => ({ ...record, __sourceKey: key }));
}

function flattenedRecord(record: UnknownRecord): UnknownRecord {
  const properties = record.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return record;
  }
  return { ...(properties as UnknownRecord), ...record };
}

function text(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
}

function numberValue(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(value)
          : NaN;
    if (Number.isFinite(parsed)) return parsed;
  }
}

function islandCode(record: UnknownRecord): Island | undefined {
  const explicit = text(record, ["islandCode", "island", "island_id", "islandId"]);
  const sourceKey = text(record, ["__sourceKey"]);
  const raw = (explicit ?? sourceKey?.split(":", 1)[0])
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!raw) return undefined;
  if (["stt", "stthomas", "saintthomas"].includes(raw)) return "stt";
  if (["stj", "stjohn", "saintjohn"].includes(raw)) return "stj";
  if (["stx", "stcroix", "saintcroix"].includes(raw)) return "stx";
  return undefined;
}

function toPlace(
  rawRecord: UnknownRecord,
  source: string,
  index: number,
): CoveragePlace | undefined {
  const record = flattenedRecord(rawRecord);
  const island = islandCode(record);
  const name = text(record, [
    "name",
    "NAME",
    "displayName",
    "title",
    "label",
    "fullName",
    "BASENAME",
    "estate",
    "ESTATE",
    "matchedName",
  ]);
  if (!island || !name) return undefined;

  const geoid = text(record, ["geoid", "GEOID", "estateGeoid", "estate_geoid"]);
  const sourceKey = text(record, ["__sourceKey"]);
  const id =
    text(record, ["id", "slug", "key"]) ??
    sourceKey ??
    geoid ??
    text(record, ["placeId"]) ??
    `${source}:${index}:${name}`;

  return {
    id,
    geoid,
    island,
    name,
    lat: numberValue(record, ["lat", "latitude", "CENTLAT", "centLat"]),
    lng: numberValue(record, ["lng", "lon", "longitude", "CENTLON", "centLon"]),
    tariffEndpointName: text(record, [
      "tariffEndpointName",
      "tariff_endpoint",
      "tariffEndpoint",
    ]),
    parentPlaceId: text(record, ["parentPlaceId", "parent_id", "parentId"]),
    parentEstateGeoid: text(record, [
      "parentEstateGeoid",
      "parent_estate_geoid",
      "estateGeoid",
      "estate_geoid",
    ]),
    parentEstateName: text(record, [
      "parentEstateName",
      "parent_estate_name",
      "estateName",
      "estate_name",
    ]),
  };
}

function estateGeometry(
  record: UnknownRecord,
): GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined {
  const geometry = record.geometry;
  if (!geometry || typeof geometry !== "object" || Array.isArray(geometry)) {
    return undefined;
  }
  const candidate = geometry as { type?: unknown; coordinates?: unknown };
  if (
    (candidate.type === "Polygon" || candidate.type === "MultiPolygon") &&
    Array.isArray(candidate.coordinates)
  ) {
    return candidate as GeoJSON.Polygon | GeoJSON.MultiPolygon;
  }
}

function toEstateBoundary(rawRecord: UnknownRecord): EstateBoundary | undefined {
  const record = flattenedRecord(rawRecord);
  const island = islandCode(record);
  const geoid = text(record, ["geoid", "GEOID", "id"]);
  const name = text(record, [
    "baseName",
    "BASENAME",
    "name",
    "NAME",
    "fullName",
    "ESTATE",
  ]);
  const geometry = estateGeometry(rawRecord);
  if (!island || !geoid || !name || !geometry) return undefined;
  return { geoid, island, name, geometry };
}

function pointOnSegment(lng: number, lat: number, a: number[], b: number[]) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const cross = (lng - ax) * (by - ay) - (lat - ay) * (bx - ax);
  if (Math.abs(cross) > 1e-10) return false;
  return (
    lng >= Math.min(ax, bx) - 1e-10 &&
    lng <= Math.max(ax, bx) + 1e-10 &&
    lat >= Math.min(ay, by) - 1e-10 &&
    lat <= Math.max(ay, by) + 1e-10
  );
}

function pointInRing(lng: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j];
    const b = ring[i];
    if (pointOnSegment(lng, lat, a, b)) return true;
    const [xi, yi] = b;
    const [xj, yj] = a;
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, polygon: number[][][]) {
  if (!polygon.length || !pointInRing(lng, lat, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(lng, lat, hole));
}

function containsPoint(
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  lng: number,
  lat: number,
) {
  if (geometry.type === "Polygon") {
    return pointInPolygon(lng, lat, geometry.coordinates);
  }
  return geometry.coordinates.some((polygon) =>
    pointInPolygon(lng, lat, polygon),
  );
}

function attachContainingEstate(
  place: CoveragePlace,
  boundaries: EstateBoundary[],
): CoveragePlace {
  if (
    place.parentEstateGeoid ||
    place.parentEstateName ||
    typeof place.lat !== "number" ||
    typeof place.lng !== "number"
  ) {
    return place;
  }

  const matches = new Map<string, EstateBoundary>();
  for (const boundary of boundaries) {
    if (boundary.island !== place.island) continue;
    if (containsPoint(boundary.geometry, place.lng, place.lat)) {
      matches.set(boundary.geoid, boundary);
    }
  }

  if (matches.size !== 1) return place;
  const parent = [...matches.values()][0];
  return {
    ...place,
    parentPlaceId: place.parentPlaceId ?? parent.geoid,
    parentEstateGeoid: parent.geoid,
    parentEstateName: parent.name,
  };
}

function fareEndpoint(place: CoveragePlace) {
  return {
    geoid: place.geoid ?? place.id,
    baseName: place.name,
    tariffEndpointName: place.tariffEndpointName,
    parentEstateGeoid: place.parentEstateGeoid,
    parentEstateName: place.parentEstateName,
  };
}

async function loadActiveTariffs() {
  if (!hasFirebaseAdminConfiguration()) {
    return {
      status: "unavailable" as const,
      tariffs: [] as OfficialTaxiTariff[],
      reason: "Firebase Admin configuration is not available.",
    };
  }
  try {
    const snapshot = await getAdminDb()
      .collection("taxiTariffs")
      .where("status", "==", "active")
      .get();
    return {
      status: "loaded" as const,
      tariffs: snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as OfficialTaxiTariff,
      ),
    };
  } catch (error) {
    return {
      status: "error" as const,
      tariffs: [] as OfficialTaxiTariff[],
      reason:
        error instanceof Error ? error.message : "Unable to load active tariffs.",
    };
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  const places = new Map<string, CoveragePlace>();
  for (const input of INPUTS) {
    const full = path.join(process.cwd(), input);
    if (!fs.existsSync(full)) continue;
    records(readJson(input)).forEach((record, index) => {
      const place = toPlace(record, input, index);
      if (place) places.set(`${place.island}:${place.id}`, place);
    });
  }

  const estateBoundaries = fs.existsSync(path.join(process.cwd(), ESTATES_PATH))
    ? records(readJson(ESTATES_PATH))
        .map(toEstateBoundary)
        .filter((item): item is EstateBoundary => Boolean(item))
    : [];

  const mappings: TariffLocationMapping[] = fs.existsSync(
    path.join(process.cwd(), MAPPINGS_PATH),
  )
    ? (readJson(MAPPINGS_PATH) as TariffLocationMapping[])
    : [];
  const resolveReviewed = buildTariffLocationResolver(mappings);
  const active = await loadActiveTariffs();

  const tariffsByIsland = new Map<Island, OfficialTaxiTariff[]>();
  for (const island of ISLANDS) {
    tariffsByIsland.set(
      island,
      active.tariffs.filter((tariff) => tariff.island === island),
    );
  }

  const enrichedPlaces = [...places.values()].map((rawPlace) => {
    const reviewed = resolveReviewed(rawPlace);
    if (reviewed.tariffEndpointName) {
      return { ...rawPlace, tariffEndpointName: reviewed.tariffEndpointName };
    }

    const islandTariffs = tariffsByIsland.get(rawPlace.island) ?? [];
    if (islandTariffs.length !== 1) return rawPlace;
    const rules = islandTariffs[0].rules ?? [];

    const direct = resolveOfficialTaxiFareEndpoint(rules, fareEndpoint(rawPlace));
    if (direct.tariffEndpointName) {
      return { ...rawPlace, tariffEndpointName: direct.tariffEndpointName };
    }

    const place = attachContainingEstate(rawPlace, estateBoundaries);
    const resolved = resolveOfficialTaxiFareEndpoint(rules, fareEndpoint(place));

    return resolved.tariffEndpointName
      ? { ...place, tariffEndpointName: resolved.tariffEndpointName }
      : place;
  });

  const audit = auditTariffLocationCoverage(enrichedPlaces, mappings);
  const governanceBlocked = enrichedPlaces.flatMap((place) => {
    if (!place.tariffEndpointName) return [];
    const reason = taxiEndpointGovernanceHold({
      island: place.island,
      placeName: place.name,
      tariffEndpointName: place.tariffEndpointName,
    });
    return reason
      ? [{
          island: place.island,
          placeId: place.id,
          placeName: place.name,
          tariffEndpointName: place.tariffEndpointName,
          reason,
        }]
      : [];
  });
  const governanceBlockedKeys = new Set(
    governanceBlocked.map((place) => `${place.island}:${place.placeId}`),
  );

  const byIsland = Object.fromEntries(
    ISLANDS.map((island) => {
      const subset = audit.resolutions.filter((item) => item.island === island);
      const unresolved = subset.filter(
        (item) => item.method === "unresolved",
      ).length;
      const blocked = governanceBlocked.filter((item) => item.island === island).length;
      const quoteEligible = subset.length - unresolved - blocked;
      const tariffCount = tariffsByIsland.get(island)?.length ?? 0;
      return [
        island,
        {
          total: subset.length,
          quoteEligible,
          unresolved,
          governanceBlocked: blocked,
          activeTariffCount: tariffCount,
          tariffCatalogReady: tariffCount === 1,
        },
      ];
    }),
  );

  const catalogReady =
    active.status === "loaded" &&
    ISLANDS.every(
      (island) => (tariffsByIsland.get(island)?.length ?? 0) === 1,
    );
  const quoteEligible = audit.resolutions.filter(
    (item) =>
      item.method !== "unresolved" &&
      !governanceBlockedKeys.has(`${item.island}:${item.placeId}`),
  ).length;

  const coordinatePlaces = [...places.values()].filter(
    (place) => typeof place.lat === "number" && typeof place.lng === "number",
  );
  const coordinatePlacesWithUniqueEstate = coordinatePlaces.filter((place) => {
    const attached = attachContainingEstate(place, estateBoundaries);
    return Boolean(attached.parentEstateGeoid);
  }).length;

  return NextResponse.json({
    ok:
      catalogReady &&
      audit.unresolved === 0 &&
      governanceBlocked.length === 0,
    policy:
      "Every selectable place must resolve through an explicit reviewed endpoint, an exact unique published endpoint, or an exact unique verified containing-estate endpoint, and it must pass the same endpoint governance holds as runtime quoting. Exact point-in-polygon containment is permitted geography; proximity, nearest-place, fuzzy, distance, and road-based tariff inference are prohibited.",
    inputs: INPUTS,
    mappingCount: mappings.length,
    estateBoundaryCount: estateBoundaries.length,
    coordinatePlaceCount: coordinatePlaces.length,
    coordinatePlacesWithUniqueEstate,
    tariffCatalogStatus: active.status,
    tariffCatalogReason: "reason" in active ? active.reason : undefined,
    activeTariffCount: active.tariffs.length,
    catalogReady,
    total: audit.total,
    quoteEligible,
    unresolved: audit.unresolved,
    governanceBlockedCount: governanceBlocked.length,
    coverage: audit.total === 0 ? 1 : quoteEligible / audit.total,
    byIsland,
    governanceBlocked,
    unresolvedPlaces: audit.unresolvedPlaces.slice(0, 500),
    unresolvedTruncated: audit.unresolvedPlaces.length > 500,
  });
}
