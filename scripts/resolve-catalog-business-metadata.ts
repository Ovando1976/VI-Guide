import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

type Item = Record<string, unknown>;
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
};

const ROOT = process.cwd();
config({ path: [path.join(ROOT, ".env.local"), path.join(ROOT, ".env.production"), path.join(ROOT, ".env")] });
const APPLY = process.argv.includes("--apply");
const KEY = [
  process.env.GOOGLE_PLACES_API_KEY,
  process.env.GOOGLE_MAPS_API_KEY,
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
].map((value) => value?.trim()).find(Boolean);
const placesFile = path.join(ROOT, "data/travel-knowledge/places.json");
const places = JSON.parse(fs.readFileSync(placesFile, "utf8")) as Item[];
const restaurants = places.filter((item) => ["food", "restaurant"].includes(String(item.category).toLowerCase()));
const islandName: Record<string, string> = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" };

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function normalize(value: string) { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(the|restaurant|bar|grill|cafe|caf|and|at)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim(); }
function similarity(a: string, b: string) {
  const aa = normalize(a), bb = normalize(b);
  if (!aa || !bb) return 0;
  if (aa === bb) return 1;
  if (aa.includes(bb) || bb.includes(aa)) return 0.9;
  const left = new Set(aa.split(/\s+/)), right = new Set(bb.split(/\s+/));
  let overlap = 0; for (const token of left) if (right.has(token)) overlap += 1;
  return (2 * overlap) / (left.size + right.size);
}

async function search(item: Item) {
  const query = `${item.name}, ${islandName[String(item.island)]}, U.S. Virgin Islands`;
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY!, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.businessStatus" },
    body: JSON.stringify({ textQuery: query, languageCode: "en", regionCode: "US", maxResultCount: 3 }),
  });
  const body = await response.json() as { places?: GooglePlace[]; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message ?? `Google Places returned ${response.status}`);
  return (body.places ?? []).map((place) => ({ place, score: similarity(clean(item.name), clean(place.displayName?.text)) })).sort((a, b) => b.score - a.score)[0];
}

async function main() {
  if (!KEY) throw new Error("No Google Places key was found in .env.local, .env.production, .env, or the current shell. Configure GOOGLE_PLACES_API_KEY (preferred), GOOGLE_MAPS_API_KEY, or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
  const results: Item[] = [];
  for (const item of restaurants) {
  try {
    const match = await search(item);
    const address = clean(match?.place.formattedAddress);
    const expectedIsland = islandName[String(item.island)] ?? "";
    const islandConfirmed = address.toLowerCase().includes(expectedIsland.toLowerCase());
    const approved = Boolean(match && match.score >= 0.9 && islandConfirmed && match.place.id);
    results.push({ id: item.id, name: item.name, island: item.island, status: approved ? "approved" : "review", score: match?.score ?? 0, candidate: match?.place ?? null });
  } catch (error) {
    results.push({ id: item.id, name: item.name, island: item.island, status: "error", error: error instanceof Error ? error.message : String(error) });
  }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports/catalog-business-resolution.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
if (APPLY) {
  const byId = new Map(results.filter((row) => row.status === "approved").map((row) => [row.id, row]));
  for (const item of places) {
    const row = byId.get(item.id); if (!row) continue;
    const candidate = row.candidate as GooglePlace;
    item.googlePlaceId = candidate.id;
    item.address = candidate.formattedAddress;
    if (candidate.location?.latitude !== undefined) item.lat = candidate.location.latitude;
    if (candidate.location?.longitude !== undefined) item.lng = candidate.location.longitude;
    if (candidate.nationalPhoneNumber) item.phone = candidate.nationalPhoneNumber;
    if (candidate.websiteUri) item.website = candidate.websiteUri;
    item.sourceLabel = "Google Places identity match — verify with the official business";
    item.sourceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean(item.name))}&query_place_id=${candidate.id}`;
    item.verificationLevel = "secondary";
    item.verifiedAt = new Date().toISOString().slice(0, 10);
    item.operatingStatus = candidate.businessStatus === "CLOSED_PERMANENTLY" ? "permanently-closed" : candidate.businessStatus === "CLOSED_TEMPORARILY" ? "temporarily-closed" : "unconfirmed";
  }
  fs.writeFileSync(placesFile, `${JSON.stringify(places, null, 2)}\n`);
}
console.table({ restaurants: restaurants.length, approved: results.filter((row) => row.status === "approved").length, review: results.filter((row) => row.status === "review").length, errors: results.filter((row) => row.status === "error").length, mode: APPLY ? "apply" : "review" });
  console.log("Review reports/catalog-business-resolution.json. Secondary matches never claim that a business is operating.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
