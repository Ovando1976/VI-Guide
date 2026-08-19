import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  auditTariffLocationCoverage,
  type TariffLocationMapping,
  type TariffResolvablePlace,
} from "@/lib/tariff-location-resolver";

type UnknownRecord = Record<string, unknown>;

const INPUTS = [
  "data/generated/geographic-dictionary-cleaned.json",
  "data/generated/modern-estates.normalized.json",
  "data/territory-coordinates.json",
];
const MAPPINGS_PATH = "data/tariff-location-mappings.reviewed.json";

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

function islandCode(record: UnknownRecord): TariffResolvablePlace["island"] | undefined {
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
  const id = text(record, ["id", "placeId", "slug", "geoid", "key"]) ?? `${source}:${index}:${name}`;
  return {
    id,
    island,
    name,
    tariffEndpointName: text(record, ["tariffEndpointName", "tariff_endpoint", "tariffEndpoint"]),
    parentPlaceId: text(record, ["parentPlaceId", "parent_id", "parentId"]),
  };
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
  const audit = auditTariffLocationCoverage([...places.values()], mappings);
  const byIsland = Object.fromEntries(
    (["stt", "stj", "stx"] as const).map((island) => {
      const subset = audit.resolutions.filter((item) => item.island === island);
      const unresolved = subset.filter((item) => item.method === "unresolved").length;
      return [island, { total: subset.length, resolved: subset.length - unresolved, unresolved }];
    }),
  );

  return NextResponse.json({
    ok: audit.unresolved === 0,
    policy: "No tariff endpoint may be inferred from proximity. Unresolved places remain verification-required.",
    inputs: INPUTS,
    mappingCount: mappings.length,
    total: audit.total,
    resolved: audit.resolved,
    unresolved: audit.unresolved,
    coverage: audit.coverage,
    byIsland,
    unresolvedPlaces: audit.unresolvedPlaces.slice(0, 250),
    unresolvedTruncated: audit.unresolvedPlaces.length > 250,
  });
}
