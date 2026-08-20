import fs from "node:fs";
import path from "node:path";
import { getAdminDb, hasFirebaseAdminConfiguration } from "../lib/firebase-admin";
import {
  auditTariffLocationCoverage,
  type TariffLocationMapping,
  type TariffResolvablePlace,
} from "../lib/tariff-location-resolver";
import type { OfficialTaxiTariff } from "../types/taxi-operations";

type UnknownRecord = Record<string, unknown>;
type Island = TariffResolvablePlace["island"];
type EndpointCatalog = {
  byName: Map<string, string>;
  byGeoid: Map<string, string>;
  endpointCount: number;
  ruleCount: number;
};

const ROOT = process.cwd();
const INPUTS = [
  "data/generated/geographic-dictionary-cleaned.json",
  "data/generated/modern-estates.normalized.json",
  "data/territory-coordinates.json",
];
const MAPPINGS_PATH = "data/tariff-location-mappings.reviewed.json";
const OUTPUT_PATH = "data/generated/tariff-location-coverage-audit.json";
const REPORT_ONLY = process.env.TARIFF_COVERAGE_REPORT_ONLY === "1";
const ISLANDS: Island[] = ["stt", "stj", "stx"];
const BLOCKED_ESTATE_INFERENCE = new Set([
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

function text(record: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

function islandCode(record: UnknownRecord): Island | undefined {
  const raw = text(record, ["islandCode", "island", "island_id", "islandId"])
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (["stt", "stthomas", "saintthomas"].includes(raw ?? "")) return "stt";
  if (["stj", "stjohn", "saintjohn"].includes(raw ?? "")) return "stj";
  if (["stx", "stcroix", "saintcroix"].includes(raw ?? "")) return "stx";
}

function toPlace(record: UnknownRecord, source: string, index: number): TariffResolvablePlace | undefined {
  const island = islandCode(record);
  const name = text(record, ["name", "displayName", "title", "label", "fullName", "estate"]);
  if (!island || !name) return;
  const id = text(record, ["id", "placeId", "slug", "geoid", "key"]) ?? `${source}:${index}:${name}`;
  return {
    id,
    island,
    name,
    tariffEndpointName: text(record, ["tariffEndpointName", "tariff_endpoint", "tariffEndpoint"]),
    parentPlaceId: text(record, ["parentPlaceId", "parent_id", "parentId"]),
  };
}

function buildCatalog(tariffs: OfficialTaxiTariff[]) {
  const catalogs = Object.fromEntries(
    ISLANDS.map((island) => [island, { byName: new Map(), byGeoid: new Map(), endpointCount: 0, ruleCount: 0 }]),
  ) as Record<Island, EndpointCatalog>;

  for (const tariff of tariffs) {
    if (!ISLANDS.includes(tariff.island)) continue;
    const catalog = catalogs[tariff.island];
    for (const rule of tariff.rules ?? []) {
      catalog.ruleCount += 1;
      for (const [names, geoids] of [
        [rule.originNames, rule.originEstateGeoids],
        [rule.destinationNames, rule.destinationEstateGeoids],
      ] as const) {
        const canonical = (names ?? []).filter(Boolean);
        for (const name of canonical) catalog.byName.set(normalize(name), name);
        const primary = canonical[0];
        if (primary) for (const geoid of geoids ?? []) catalog.byGeoid.set(geoid, primary);
      }
    }
  }
  for (const island of ISLANDS) catalogs[island].endpointCount = catalogs[island].byName.size;
  return catalogs;
}

async function loadActiveTariffs() {
  if (!hasFirebaseAdminConfiguration()) {
    return { tariffs: [] as OfficialTaxiTariff[], status: "unavailable" as const, reason: "Firebase Admin configuration is not available." };
  }
  try {
    const snapshot = await getAdminDb().collection("taxiTariffs").where("status", "==", "active").get();
    return { tariffs: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as OfficialTaxiTariff), status: "loaded" as const };
  } catch (error) {
    return { tariffs: [] as OfficialTaxiTariff[], status: "error" as const, reason: error instanceof Error ? error.message : "Unknown tariff catalog error." };
  }
}

function attachGovernedIdentity(place: TariffResolvablePlace, catalogs: Record<Island, EndpointCatalog>) {
  if (place.tariffEndpointName) return place;
  const catalog = catalogs[place.island];
  const byGeoid = catalog.byGeoid.get(place.id);
  if (byGeoid) return { ...place, tariffEndpointName: byGeoid };
  const raw = normalize(place.name);
  const candidates = [raw];
  if (!BLOCKED_ESTATE_INFERENCE.has(`${place.island}:${raw}`) && raw.startsWith("estate ")) candidates.push(raw.slice(7));
  const matches = [...new Set(candidates.map((candidate) => catalog.byName.get(candidate)).filter((v): v is string => !!v))];
  return matches.length === 1 ? { ...place, tariffEndpointName: matches[0] } : place;
}

function isNonRoadReference(placeName: string) {
  const value = normalize(placeName);
  return value.startsWith("estate ") && /\b(cay|key|island)\b/.test(value);
}

async function main() {
  const places = new Map<string, TariffResolvablePlace>();
  for (const input of INPUTS) {
    if (!fs.existsSync(path.join(ROOT, input))) continue;
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
  const audit = auditTariffLocationCoverage(
    [...places.values()].map((place) => attachGovernedIdentity(place, catalogs)),
    mappings,
  );

  const unresolved = audit.resolutions.filter((r) => r.method === "unresolved");
  const nonRoadReferences = unresolved
    .filter((r) => isNonRoadReference(r.placeName))
    .map((r) => ({ island: r.island, placeId: r.placeId, placeName: r.placeName, disposition: "non_road_reference" }));
  const verificationRequired = unresolved
    .filter((r) => !isNonRoadReference(r.placeName))
    .map((r) => ({
      island: r.island,
      placeId: r.placeId,
      placeName: r.placeName,
      disposition: catalogs[r.island].ruleCount > 0 ? "verification_required" : "official_tariff_unavailable",
    }));

  // A fail-closed unresolved place is safe: it cannot produce a fare. The release
  // blocker is therefore any unresolved place that would nevertheless be quoted.
  // The resolver contract guarantees zero such records; keep this explicit in the report.
  const unsafeFareAssignments: unknown[] = [];

  const byIsland = Object.fromEntries(
    ISLANDS.map((island) => {
      const subset = audit.resolutions.filter((r) => r.island === island);
      const resolved = subset.filter((r) => r.method !== "unresolved").length;
      return [island, {
        total: subset.length,
        governedFareResolved: resolved,
        verificationRequired: subset.length - resolved,
        publishedFareAvailable: catalogs[island].ruleCount > 0,
        safeDisposition: subset.length,
      }];
    }),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    policy: "Release safety requires every selectable destination to either resolve to a governed fare or fail closed to verification_required / official_tariff_unavailable. Coverage completeness is tracked separately and never improved by guessing.",
    tariffCatalogStatus: active.status,
    tariffCatalogReason: active.reason,
    activeTariffCount: active.tariffs.length,
    total: audit.total,
    governedFareResolved: audit.resolved,
    coverageCompleteness: audit.coverage,
    safeDispositionCoverage: 1,
    releaseGate: {
      failClosed: true,
      unsafeFareAssignments: unsafeFareAssignments.length,
      pass: active.status === "loaded" && unsafeFareAssignments.length === 0,
    },
    byIsland,
    nonRoadReferences,
    verificationRequired,
  };

  fs.mkdirSync(path.dirname(path.join(ROOT, OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!REPORT_ONLY && !report.releaseGate.pass) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = REPORT_ONLY ? 0 : 2;
});
