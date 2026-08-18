import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type IslandCode = "stt" | "stj" | "stx";
type AuditStatus = "MATCHED" | "ALIAS" | "DUPLICATE" | "MISSING" | "CONFLICT" | "NEEDS_REVIEW";
type Point = { lat: number; lng: number };
type DictionaryMatch = { id?: string; name?: string; normalizedName?: string; dictionarySummary?: string; matchReason?: string };
type EnrichedEstate = { geoid: string; state?: string; county?: string; baseName: string; fullName?: string; normalizedName?: string; estateCode?: string | null; island: IslandCode; centroid?: Point | null; internalPoint?: Point | null; geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null; aliases?: string[]; historicalNotes?: string[]; sources?: string[]; dictionaryMatches?: DictionaryMatch[] };
type ReviewCandidate = { modernEstate?: { geoid?: string; baseName?: string; island?: IslandCode }; dictionaryEntry?: { name?: string; normalizedName?: string }; reason?: string; score?: number };
type AuditRow = { canonical_id: string; canonical_name: string; source_name: string; existing_name: string; match_type: AuditStatus; island: IslandCode; coordinate_status: "OK" | "MISSING" | "OUT_OF_BOUNDS"; geometry_status: "OK" | "MISSING"; provenance_status: "OK" | "MISSING"; confidence: "high" | "medium" | "low"; review_reason: string };
type BlockingAuditRow = Pick<AuditRow, "canonical_id" | "canonical_name" | "island" | "match_type" | "coordinate_status" | "geometry_status" | "provenance_status" | "confidence" | "review_reason">;

const ROOT = path.resolve("data-products/usvi-geographic-intelligence");
const SOURCE_PATH = path.resolve("data/derived/estates.enriched-with-dictionary.json");
const REVIEW_PATH = path.resolve("data/derived/estates.dictionary-review-candidates.json");
const EXPORT_DIR = path.join(ROOT, "exports");
const CSV_DIR = path.join(EXPORT_DIR, "csv");
const GEOJSON_DIR = path.join(EXPORT_DIR, "geojson");
const REPORT_DIR = path.join(ROOT, "reports");

function normalize(value: unknown): string {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/\bestate\b/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function uniqueSorted(values: unknown[]): string[] { return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
function pointStatus(point: Point | null | undefined): AuditRow["coordinate_status"] { if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return "MISSING"; if (point.lat < 17.5 || point.lat > 18.5 || point.lng < -65.2 || point.lng > -64.4) return "OUT_OF_BOUNDS"; return "OK"; }
function csvCell(value: unknown): string { const text = Array.isArray(value) ? value.join(" | ") : String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function toCsv(rows: Array<Record<string, unknown>>): string { if (!rows.length) return ""; const headers = Object.keys(rows[0]); return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n") + "\n"; }

function classify(estate: EnrichedEstate, duplicateKeys: Set<string>, reviewByGeoid: Map<string, ReviewCandidate[]>): { status: AuditStatus; reason: string; confidence: AuditRow["confidence"] } {
  const key = `${estate.island}:${normalize(estate.baseName)}:${estate.geoid}`;
  if (duplicateKeys.has(key)) return { status: "DUPLICATE", reason: "Multiple modern estates share the same normalized island/name/GEOID identity key.", confidence: "low" };
  const pending = reviewByGeoid.get(estate.geoid) ?? [];
  if (pending.length) return { status: "NEEDS_REVIEW", reason: pending.map((item) => `${item.reason ?? "review"}:${item.dictionaryEntry?.name ?? "unknown"}`).join(" | "), confidence: "low" };
  const matches = estate.dictionaryMatches ?? [];
  if (!matches.length) return { status: "MISSING", reason: "No Geographic Dictionary match is attached to this modern estate.", confidence: "medium" };
  const modern = normalize(estate.baseName);
  if (matches.some((match) => normalize(match.name ?? match.normalizedName) === modern)) return { status: "MATCHED", reason: "Modern estate name has an exact normalized dictionary match.", confidence: "high" };
  const aliases = new Set((estate.aliases ?? []).map(normalize));
  if (matches.some((match) => aliases.has(normalize(match.name ?? match.normalizedName)))) return { status: "ALIAS", reason: "Dictionary name resolves through the estate alias set.", confidence: "high" };
  if (matches.length > 1) return { status: "CONFLICT", reason: "Multiple non-exact dictionary matches remain attached to this estate.", confidence: "low" };
  return { status: "ALIAS", reason: "Single non-exact historical/dictionary name is attached to the modern estate.", confidence: "medium" };
}
function isBlocking(row: AuditRow): boolean { return row.match_type === "DUPLICATE" || row.match_type === "CONFLICT" || row.match_type === "NEEDS_REVIEW" || row.coordinate_status !== "OK" || row.geometry_status !== "OK" || row.provenance_status !== "OK"; }

async function main() {
  const [estateRaw, reviewRaw] = await Promise.all([readFile(SOURCE_PATH, "utf8"), readFile(REVIEW_PATH, "utf8")]);
  const estates = JSON.parse(estateRaw) as EnrichedEstate[];
  const reviews = JSON.parse(reviewRaw) as ReviewCandidate[];
  const identityCounts = new Map<string, number>();
  for (const estate of estates) { const key = `${estate.island}:${normalize(estate.baseName)}:${estate.geoid}`; identityCounts.set(key, (identityCounts.get(key) ?? 0) + 1); }
  const duplicateKeys = new Set([...identityCounts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
  const reviewByGeoid = new Map<string, ReviewCandidate[]>();
  for (const review of reviews) { const geoid = String(review.modernEstate?.geoid ?? "").trim(); if (!geoid) continue; const current = reviewByGeoid.get(geoid) ?? []; current.push(review); reviewByGeoid.set(geoid, current); }
  const audit: AuditRow[] = estates.map((estate): AuditRow => { const classification = classify(estate, duplicateKeys, reviewByGeoid); return { canonical_id: estate.geoid, canonical_name: estate.baseName, source_name: uniqueSorted(estate.sources ?? []).join(" | "), existing_name: estate.fullName ?? estate.baseName, match_type: classification.status, island: estate.island, coordinate_status: pointStatus(estate.centroid), geometry_status: estate.geometry ? "OK" : "MISSING", provenance_status: (estate.sources?.length ?? 0) > 0 ? "OK" : "MISSING", confidence: classification.confidence, review_reason: classification.reason }; }).sort((a, b) => a.island.localeCompare(b.island) || a.canonical_name.localeCompare(b.canonical_name));
  const canonical = estates.map((estate) => ({ canonical_id: estate.geoid, geoid: estate.geoid, estate_code: estate.estateCode ?? "", name: estate.baseName, full_name: estate.fullName ?? estate.baseName, normalized_name: normalize(estate.baseName), aliases: uniqueSorted(estate.aliases ?? []), island: estate.island, county: estate.county ?? "", centroid_lat: estate.centroid?.lat ?? null, centroid_lng: estate.centroid?.lng ?? null, internal_point_lat: estate.internalPoint?.lat ?? null, internal_point_lng: estate.internalPoint?.lng ?? null, sources: uniqueSorted(estate.sources ?? []), historical_notes: uniqueSorted(estate.historicalNotes ?? []), dictionary_names: uniqueSorted((estate.dictionaryMatches ?? []).flatMap((match) => [match.name, match.normalizedName])), geometry_type: estate.geometry?.type ?? "" })).sort((a, b) => a.island.localeCompare(b.island) || a.name.localeCompare(b.name));
  const features: GeoJSON.Feature[] = estates.filter((estate) => Boolean(estate.geometry)).map((estate) => ({ type: "Feature", id: estate.geoid, geometry: estate.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon, properties: { canonical_id: estate.geoid, geoid: estate.geoid, estate_code: estate.estateCode ?? "", name: estate.baseName, full_name: estate.fullName ?? estate.baseName, normalized_name: normalize(estate.baseName), aliases: uniqueSorted(estate.aliases ?? []), island: estate.island, county: estate.county ?? "", sources: uniqueSorted(estate.sources ?? []) } }));
  const summary = audit.reduce<Record<string, number>>((counts, row) => { counts.total = (counts.total ?? 0) + 1; counts[row.match_type] = (counts[row.match_type] ?? 0) + 1; if (row.coordinate_status !== "OK") counts.coordinate_issues = (counts.coordinate_issues ?? 0) + 1; if (row.geometry_status !== "OK") counts.geometry_issues = (counts.geometry_issues ?? 0) + 1; if (row.provenance_status !== "OK") counts.provenance_issues = (counts.provenance_issues ?? 0) + 1; return counts; }, {});
  const blockingFindingCount = (summary.DUPLICATE ?? 0) + (summary.CONFLICT ?? 0) + (summary.NEEDS_REVIEW ?? 0) + (summary.coordinate_issues ?? 0) + (summary.geometry_issues ?? 0) + (summary.provenance_issues ?? 0);
  const blockers: BlockingAuditRow[] = audit.filter(isBlocking).map((row) => ({ canonical_id: row.canonical_id, canonical_name: row.canonical_name, island: row.island, match_type: row.match_type, coordinate_status: row.coordinate_status, geometry_status: row.geometry_status, provenance_status: row.provenance_status, confidence: row.confidence, review_reason: row.review_reason }));
  const manifest = { schema_version: 1, source_files: [path.relative(process.cwd(), SOURCE_PATH), path.relative(process.cwd(), REVIEW_PATH)], release_ready: blockingFindingCount === 0, blocking_estate_count: blockers.length, blocking_finding_count: blockingFindingCount, counts: summary, blockers };
  await Promise.all([mkdir(CSV_DIR, { recursive: true }), mkdir(GEOJSON_DIR, { recursive: true }), mkdir(REPORT_DIR, { recursive: true })]);
  await Promise.all([writeFile(path.join(CSV_DIR, "usvi-estates.csv"), toCsv(canonical), "utf8"), writeFile(path.join(CSV_DIR, "audit-estates.csv"), toCsv(audit), "utf8"), writeFile(path.join(GEOJSON_DIR, "usvi-estates.geojson"), JSON.stringify({ type: "FeatureCollection", features }, null, 2) + "\n", "utf8"), writeFile(path.join(REPORT_DIR, "estate-audit-summary.json"), JSON.stringify(summary, null, 2) + "\n", "utf8"), writeFile(path.join(REPORT_DIR, "estate-audit-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8")]);
  console.log("USVI Estate Intelligence v0.1 build complete"); console.log(summary); console.log(`Audit manifest: ${blockers.length} blocking estates / ${blockingFindingCount} blocking findings.`);
  if (blockingFindingCount > 0) { console.warn(`Release gate remains closed: ${blockingFindingCount} blocking audit findings.`); process.exitCode = 2; }
}
main().catch((error) => { console.error("Estate Intelligence build failed:", error); process.exit(1); });
