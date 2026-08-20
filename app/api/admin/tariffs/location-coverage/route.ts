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
import type { OfficialTaxiTariff } from "@/types/taxi-operations";

type UnknownRecord = Record<string, unknown>;

type Island = TariffResolvablePlace["island"];

const INPUTS = [
  "data/generated/geographic-dictionary-cleaned.json",
  "data/generated/modern-estates.normalized.json",
  "data/territory-coordinates.json",
];
const MAPPINGS_PATH = "data/tariff-location-mappings.reviewed.json";
const ISLANDS: Island[] = ["stt", "stj", "stx"];

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), "utf8"));
}

function records(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is UnknownRecord => Boolean(item) && typeof item === "object");
  }
  if (!value || typeof value !== "object") return [];
  const object = value as UnknownRecord;
  for (const key of ["records", "places", "features", "items", "entries", "data"]) {
    if (Array.isArray(object[key])) return records(object[key]);
  }
  return [];
}

function text(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
}

function islandCode(record: UnknownRecord): Island | undefined {
  const raw = text(record, ["islandCode", "island", "island_id", "islandId"])
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (!raw) return undefined;
  if (["stt", "stthomas", "saintthomas"].includes(raw)) return "stt";
  if (["stj", "stjohn", "saintjohn"].includes(raw)) return "stj";
  if (["stx", "stcroix", "saintcroix"].includes(raw)) return "stx";
  return undefined;
}

function toPlace(record: UnknownRecord, source: string, index: number): TariffResolvablePlace | undefined {
  const island = islandCode(record);
  const name = text(record, ["name", "displayName", "title", "label", "fullName", "estate"]);
  if (!island || !name) return undefined;
  const geoid = text(record, ["geoid", "GEOID", "estateGeoid", "estate_geoid"]);
  const id = text(record, ["id", "placeId", "slug", "key"]) ?? geoid ?? `${source}:${index}:${name}`;
  return {
    id,
    geoid,
    island,
    name,
    tariffEndpointName: text(record, ["tariffEndpointName", "tariff_endpoint", "tariffEndpoint"]),
    parentPlaceId: text(record, ["parentPlaceId", "parent_id", "parentId"]),
    parentEstateGeoid: text(record, ["parentEstateGeoid", "parent_estate_geoid", "estateGeoid", "estate_geoid"]),
    parentEstateName: text(record, ["parentEstateName", "parent_estate_name", "estateName", "estate_name"]),
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
      reason: error instanceof Error ? error.message : "Unable to load active tariffs.",
    };
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  const places = new Map<string, TariffResolvablePlace>();
  for (const input of INPUTS) {
    const full = path.join(process.cwd(), input);
    if (!fs.existsSync(full)) continue;
    records(readJson(input)).forEach((record, index) => {
      const place = toPlace(record, input, index);
      if (place) places.set(`${place.island}:${place.id}`, place);
    });
  }

  const mappings: TariffLocationMapping[] = fs.existsSync(path.join(process.cwd(), MAPPINGS_PATH))
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

  const enrichedPlaces = [...places.values()].map((place) => {
    const reviewed = resolveReviewed(place);
    if (reviewed.tariffEndpointName) {
      return { ...place, tariffEndpointName: reviewed.tariffEndpointName };
    }

    const islandTariffs = tariffsByIsland.get(place.island) ?? [];
    if (islandTariffs.length !== 1) return place;

    const resolved = resolveOfficialTaxiFareEndpoint(islandTariffs[0].rules ?? [], {
      geoid: place.geoid ?? place.id,
      baseName: place.name,
      tariffEndpointName: place.tariffEndpointName,
      parentEstateGeoid: place.parentEstateGeoid,
      parentEstateName: place.parentEstateName,
    });

    return resolved.tariffEndpointName
      ? { ...place, tariffEndpointName: resolved.tariffEndpointName }
      : place;
  });

  const audit = auditTariffLocationCoverage(enrichedPlaces, mappings);
  const byIsland = Object.fromEntries(
    ISLANDS.map((island) => {
      const subset = audit.resolutions.filter((item) => item.island === island);
      const unresolved = subset.filter((item) => item.method === "unresolved").length;
      const tariffCount = tariffsByIsland.get(island)?.length ?? 0;
      return [
        island,
        {
          total: subset.length,
          resolved: subset.length - unresolved,
          unresolved,
          activeTariffCount: tariffCount,
          tariffCatalogReady: tariffCount === 1,
        },
      ];
    }),
  );

  const catalogReady =
    active.status === "loaded" &&
    ISLANDS.every((island) => (tariffsByIsland.get(island)?.length ?? 0) === 1);

  return NextResponse.json({
    ok: catalogReady && audit.unresolved === 0,
    policy:
      "Every selectable place must resolve through an explicit reviewed endpoint, an exact unique published endpoint, or an exact unique verified parent-estate endpoint. No proximity, fuzzy, distance, or road-based tariff inference is allowed.",
    inputs: INPUTS,
    mappingCount: mappings.length,
    tariffCatalogStatus: active.status,
    tariffCatalogReason: "reason" in active ? active.reason : undefined,
    activeTariffCount: active.tariffs.length,
    catalogReady,
    total: audit.total,
    resolved: audit.resolved,
    unresolved: audit.unresolved,
    coverage: audit.coverage,
    byIsland,
    unresolvedPlaces: audit.unresolvedPlaces.slice(0, 500),
    unresolvedTruncated: audit.unresolvedPlaces.length > 500,
  });
}
