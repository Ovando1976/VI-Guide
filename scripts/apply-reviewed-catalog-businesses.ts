import fs from "node:fs";
import path from "node:path";

type Row = Record<string, unknown>;
type Candidate = { id?: string; formattedAddress?: string; location?: { latitude?: number; longitude?: number }; nationalPhoneNumber?: string; websiteUri?: string; businessStatus?: string };

const ROOT = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/catalog-business-resolution.json"), "utf8")) as { generatedAt: string; results: Row[] };
const decisions = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalog-review/business-resolution-2026-07-20.json"), "utf8")) as { sourceGeneratedAt: string; reviewedAt: string; accepted: string[]; overrides: Record<string, { island?: string; omitFields?: string[] }> };
if (report.generatedAt !== decisions.sourceGeneratedAt) throw new Error("Resolution report version does not match the reviewed decisions.");

const file = path.join(ROOT, "data/travel-knowledge/places.json");
const places = JSON.parse(fs.readFileSync(file, "utf8")) as Row[];
const byId = new Map(report.results.map((row) => [String(row.id), row]));
let changed = 0;
for (const id of decisions.accepted) {
  const item = places.find((row) => row.id === id);
  const resolved = byId.get(id);
  if (!item || !resolved?.candidate) throw new Error(`Reviewed business ${id} is missing from the catalog or report.`);
  const candidate = resolved.candidate as Candidate;
  const omit = new Set(decisions.overrides[id]?.omitFields ?? []);
  item.googlePlaceId = candidate.id;
  if (!omit.has("address") && candidate.formattedAddress) item.address = candidate.formattedAddress;
  if (candidate.location?.latitude !== undefined) item.lat = candidate.location.latitude;
  if (candidate.location?.longitude !== undefined) item.lng = candidate.location.longitude;
  if (!omit.has("phone") && candidate.nationalPhoneNumber) item.phone = candidate.nationalPhoneNumber;
  if (!omit.has("website") && candidate.websiteUri) item.website = candidate.websiteUri;
  if (decisions.overrides[id]?.island) item.island = decisions.overrides[id].island;
  item.sourceLabel = "Google Places identity match — operating details require first-party confirmation";
  item.sourceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(item.name))}&query_place_id=${candidate.id}`;
  item.verificationLevel = "secondary";
  item.verifiedAt = decisions.reviewedAt;
  item.operatingStatus = candidate.businessStatus === "CLOSED_PERMANENTLY" ? "permanently-closed" : candidate.businessStatus === "CLOSED_TEMPORARILY" ? "temporarily-closed" : "unconfirmed";
  changed += 1;
}

fs.writeFileSync(file, `${JSON.stringify(places, null, 2)}\n`);
console.log(`Applied ${changed} reviewed business identity records.`);
console.log("Rejected and unresolved matches were not changed. OPERATIONAL candidates remain unconfirmed.");
