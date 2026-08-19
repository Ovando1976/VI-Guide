import fs from "node:fs";
import path from "node:path";
import {
  auditTariffLocationCoverage,
  type TariffLocationMapping,
  type TariffResolvablePlace,
} from "../lib/tariff-location-resolver";

type UnknownRecord = Record<string, unknown>;

const ROOT = process.cwd();
const DEFAULT_INPUTS = [
  "data/generated/geographic-dictionary-cleaned.json",
  "data/generated/modern-estates.normalized.json",
  "data/territory-coordinates.json",
];
const MAPPINGS_PATH = "data/tariff-location-mappings.reviewed.json";
const OUTPUT_PATH = "data/generated/tariff-location-coverage-audit.json";

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function records(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.filter((v): v is UnknownRecord => !!v && typeof v === "object");
  if (!value || typeof value !== "object") return [];
  const obj = value as UnknownRecord;
  for (const key of ["records", "places", "features", "items", "entries", "data"]) {
    if (Array.isArray(obj[key])) return records(obj[key]);
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
  if (["wi", "waterisland"].includes(raw)) return "water_island";
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

const places = new Map<string, TariffResolvablePlace>();
for (const input of DEFAULT_INPUTS) {
  const full = path.join(ROOT, input);
  if (!fs.existsSync(full)) continue;
  records(readJson(input)).forEach((record, index) => {
    const place = toPlace(record, input, index);
    if (place) places.set(`${place.island}:${place.id}`, place);
  });
}

const mappings: TariffLocationMapping[] = fs.existsSync(path.join(ROOT, MAPPINGS_PATH))
  ? (readJson(MAPPINGS_PATH) as TariffLocationMapping[])
  : [];

const audit = auditTariffLocationCoverage([...places.values()], mappings);
const byIsland = Object.fromEntries(
  ["stt", "stj", "stx", "water_island"].map((island) => {
    const subset = audit.resolutions.filter((r) => r.island === island);
    const unresolved = subset.filter((r) => r.method === "unresolved").length;
    return [island, { total: subset.length, resolved: subset.length - unresolved, unresolved }];
  }),
);

const report = {
  generatedAt: new Date().toISOString(),
  policy: "Every usable place must resolve through an explicit or reviewed tariff mapping. Never infer a fare endpoint from geographic proximity.",
  inputs: DEFAULT_INPUTS,
  mappings: MAPPINGS_PATH,
  total: audit.total,
  resolved: audit.resolved,
  unresolved: audit.unresolved,
  coverage: audit.coverage,
  byIsland,
  unresolvedPlaces: audit.unresolvedPlaces,
};

fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, ...report, unresolvedPlaces: undefined }, null, 2));
if (audit.unresolved > 0) process.exitCode = 2;
