import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

type Item = Record<string, unknown>;
type Place = { id?: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude?: number; longitude?: number }; businessStatus?: string };
const ROOT = process.cwd();
config({ path: [path.join(ROOT, ".env.local"), path.join(ROOT, ".env.production"), path.join(ROOT, ".env")] });
const KEY = [process.env.GOOGLE_PLACES_API_KEY, process.env.GOOGLE_MAPS_API_KEY, process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY].map((value) => value?.trim()).find(Boolean);
const file = path.join(ROOT, "data/travel-knowledge/beaches.json");
const beaches = JSON.parse(fs.readFileSync(file, "utf8")) as Item[];
const pending = beaches.filter((item) => !item.sourceUrl);
const islandName: Record<string, string> = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" };
function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function normalize(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(beach|bay|the|saint|st)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }
function score(a: string, b: string) { const aa = normalize(a), bb = normalize(b); if (aa === bb) return 1; if (aa.includes(bb) || bb.includes(aa)) return 0.9; const x = new Set(aa.split(/\s+/)), y = new Set(bb.split(/\s+/)); let n = 0; for (const token of x) if (y.has(token)) n += 1; return x.size + y.size ? 2 * n / (x.size + y.size) : 0; }
async function search(item: Item) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY!, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.businessStatus" }, body: JSON.stringify({ textQuery: `${item.name}, ${islandName[String(item.island)]}, U.S. Virgin Islands`, languageCode: "en", regionCode: "US", maxResultCount: 3 }) });
  const body = await response.json() as { places?: Place[]; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `Google Places returned ${response.status}`);
  return (body.places ?? []).map((candidate) => ({ candidate, score: score(clean(item.name), clean(candidate.displayName?.text)) })).sort((a, b) => b.score - a.score)[0];
}
async function main() {
  if (!KEY) throw new Error("No Google Places key was found.");
  const results: Item[] = [];
  for (const item of pending) {
    try { const match = await search(item); results.push({ id: item.id, name: item.name, island: item.island, status: match && match.score >= 0.9 ? "candidate" : "review", score: match?.score ?? 0, candidate: match?.candidate ?? null }); }
    catch (error) { results.push({ id: item.id, name: item.name, island: item.island, status: "error", error: error instanceof Error ? error.message : String(error) }); }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports/catalog-beach-resolution.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.table({ pending: pending.length, candidates: results.filter((row) => row.status === "candidate").length, review: results.filter((row) => row.status === "review").length, errors: results.filter((row) => row.status === "error").length });
  console.log("Review reports/catalog-beach-resolution.json. No beach records were changed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
