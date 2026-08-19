import fs from "node:fs";
import path from "node:path";
import { getAdminDb, hasFirebaseAdminConfiguration } from "../lib/firebase-admin";
import {
  auditTariffLocationCoverage,
  type TariffLocationMapping,
  type TariffResolvablePlace,
} from "../lib/tariff-location-resolver";
import type { OfficialTaxiRateRule, OfficialTaxiTariff } from "../types/taxi-operations";

type UnknownRecord = Record<string, unknown>;
type Island = TariffResolvablePlace["island"];

type EndpointCatalog = {
  byName: Map<string, string>;
  byGeoid: Map<string, string>;
  ambiguousNames: Set<string>;
  endpointCount: number;
  ruleCount: number;
};

const ROOT = process.cwd();
const DEFAULT_INPUTS = [
  "data/generated/geographic-dictionary-cleaned.json",
  "data/generated/modern-estates.normalized.json",
  "data/territory-coordinates.json",
];
const MAPPINGS_PATH = "data/tariff-location-mappings.reviewed.json";
const OUTPUT_PATH = "data/generated/tariff-location-coverage-audit.json";
const REPORT_ONLY = process.env.TARIFF_COVERAGE_REPORT_ONLY === "1";
const ISLANDS: Island[] = ["stt", "stj", "stx"];

// These published-name relationships are intentionally review-gated elsewhere
// in the tariff governance layer. Never manufacture them by stripping "Estate".
const BLOCKED_ESTATE_NAME_INFERENCE = new Set([
  "stt:estate lindbergh bay",
  "stt:estate dorothea",
  "stt:dorothea estate",
]);

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

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const id = text(record, ["id", "placeId", "slug", "geoid", "key"]) ?? `${source}:${index}:${name}`;
  return {
    id,
    island,
    name,
    tariffEndpointName: text(record, ["tariffEndpointName", "tariff_endpoint", "tariffEndpoint"]),
    parentPlaceId: text(record, ["parentPlaceId", "parent_id", "parentId"]),
  };
}

function addCatalogName(catalog: EndpointCatalog, name: string) {
  const key = normalize(name);
  if (!key) return;
  const existing = catalog.byName.get(key);
  if (existing && normalize(existing) !== key) {
    catalog.ambiguousNames.add(key);
    catalog.byName.delete(key);
    return;
  }
  if (!catalog.ambiguousNames.has(key)) catalog.byName.set(key, name);
}

function addRuleSide(
  catalog: EndpointCatalog,
  names: string[] | undefined,
  geoids: string[] | undefined,
) {
  const canonicalNames = (names ?? []).filter((name) => typeof name === "string" && name.trim());
  for (const name of canonicalNames) addCatalogName(catalog, name);
  const primary = canonicalNames[0];
  if (!primary) return;
  for (const geoid of geoids ?? []) {
    if (typeof geoid === "string" && geoid.trim()) catalog.byGeoid.set(geoid.trim(), primary);
  }
}

function buildCatalog(tariffs: OfficialTaxiTariff[]) {
  const catalogs = Object.fromEntries(
    ISLANDS.map((island) => [
      island,
      {
        byName: new Map<string, string>(),
        byGeoid: new Map<string, string>(),
        ambiguousNames: new Set<string>(),
        endpointCount: 0,
        ruleCount: 0,
      } satisfies EndpointCatalog,
    ]),
  ) as Record<Island, EndpointCatalog>;

  for (const tariff of tariffs) {
    if (!ISLANDS.includes(tariff.island)) continue;
    const catalog = catalogs[tariff.island];
    for (const rule of tariff.rules ?? []) {
      catalog.ruleCount += 1;
      addRuleSide(catalog, rule.originNames, rule.originEstateGeoids);
      addRuleSide(catalog, rule.destinationNames, rule.destinationEstateGeoids);
    }
  }

  for (const island of ISLANDS) catalogs[island].endpointCount = catalogs[island].byName.size;
  return catalogs;
}

async function loadActiveTariffs(): Promise<{
  tariffs: OfficialTaxiTariff[];
  status: "loaded" | "unavailable" | "error";
  reason?: string;
}> {
  if (!hasFirebaseAdminConfiguration()) {
    return { tariffs: [], status: "unavailable", reason: "Firebase Admin configuration is not available." };
  }
  try {
    const snapshot = await getAdminDb().collection("taxiTariffs").where("status", "==", "active").get();
    const tariffs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OfficialTaxiTariff);
    return { tariffs, status: "loaded" };
  } catch (error) {
    return {
      tariffs: [],
      status: "error",
      reason: error instanceof Error ? error.message : "Unknown Firestore tariff catalog error.",
    };
  }
}

function safePlaceCandidates(place: TariffResolvablePlace) {
  const raw = normalize(place.name);
  const candidates = [raw];
  const blocked = BLOCKED_ESTATE_NAME_INFERENCE.has(`${place.island}:${raw}`);
  if (!blocked && raw.startsWith("estate ") && raw.length > 7) candidates.push(raw.slice(7));
  return Array.from(new Set(candidates));
}

function attachGovernedEndpointIdentity(
  place: TariffResolvablePlace,
  catalogs: Record<Island, EndpointCatalog>,
): TariffResolvablePlace {
  if (place.tariffEndpointName) return place;
  const catalog = catalogs[place.island];
  const byGeoid = catalog.byGeoid.get(place.id);
  if (byGeoid) return { ...place, tariffEndpointName: byGeoid };

  const matches = safePlaceCandidates(place)
    .map((candidate) => catalog.byName.get(candidate))
    .filter((value): value is string => Boolean(value));
  const unique = Array.from(new Map(matches.map((value) => [normalize(value), value])).values());
  if (unique.length === 1) return { ...place, tariffEndpointName: unique[0] };
  return place;
}

function summarizeByIsland(audit: ReturnType<typeof auditTariffLocationCoverage>) {
  return Object.fromEntries(
    ISLANDS.map((island) => {
      const subset = audit.resolutions.filter((r) => r.island === island);
      const unresolved = subset.filter((r) => r.method === "unresolved").length;
      return [island, { total: subset.length, resolved: subset.length - unresolved, unresolved }];
    }),
  );
}

async function main() {
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

  const active = await loadActiveTariffs();
  const catalogs = buildCatalog(active.tariffs);
  const governedPlaces = [...places.values()].map((place) => attachGovernedEndpointIdentity(place, catalogs));
  const audit = auditTariffLocationCoverage(governedPlaces, mappings);
  const byIsland = summarizeByIsland(audit);

  const unresolvedSample = Object.fromEntries(
    ISLANDS.map((island) => [
      island,
      audit.unresolvedPlaces
        .filter((item) => item.island === island)
        .slice(0, 40)
        .map((item) => ({ placeId: item.placeId, placeName: item.placeName })),
    ]),
  );

  const catalogSummary = Object.fromEntries(
    ISLANDS.map((island) => [
      island,
      {
        endpointCount: catalogs[island].endpointCount,
        ruleCount: catalogs[island].ruleCount,
        geoidBindings: catalogs[island].byGeoid.size,
        ambiguousCanonicalNames: catalogs[island].ambiguousNames.size,
      },
    ]),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    policy:
      "Every usable STT/STJ/STX taxi place must resolve through an explicit, governed canonical-name/GEOID, or reviewed tariff mapping. Canonical-name matching is exact after normalization; Estate-prefix removal is allowed only when it lands on a canonical active-tariff endpoint and is not review-gated. Never infer a fare endpoint from geographic proximity. Water Island remains outside the taxi tariff graph and must use its dedicated ferry/mobility flow.",
    inputs: DEFAULT_INPUTS,
    mappings: MAPPINGS_PATH,
    tariffCatalogStatus: active.status,
    tariffCatalogReason: active.reason,
    activeTariffCount: active.tariffs.length,
    catalogSummary,
    total: audit.total,
    resolved: audit.resolved,
    unresolved: audit.unresolved,
    coverage: audit.coverage,
    byIsland,
    unresolvedPlaces: audit.unresolvedPlaces,
  };

  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      { output: OUTPUT_PATH, ...report, unresolvedPlaces: undefined, unresolvedSample },
      null,
      2,
    ),
  );

  if (!REPORT_ONLY && (active.status !== "loaded" || audit.unresolved > 0)) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = REPORT_ONLY ? 0 : 2;
});
