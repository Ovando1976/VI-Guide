import fs from "node:fs";
import path from "node:path";

type Row = Record<string, unknown>;
type Candidate = { id?: string; formattedAddress?: string; location?: { latitude?: number; longitude?: number } };
const ROOT = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(ROOT, "reports/catalog-beach-resolution.json"), "utf8")) as { generatedAt: string; results: Row[] };
type Override = { island?: string; sourceLabel?: string; sourceUrl?: string; hoursNote?: string };
const decisions = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalog-review/beach-resolution-2026-07-20.json"), "utf8")) as {
  sourceGeneratedAt: string;
  reviewedAt: string;
  accepted: string[];
  geographicConfirmations?: string[];
  overrides: Record<string, Override>;
};
if (report.generatedAt !== decisions.sourceGeneratedAt) throw new Error("Beach resolution report version does not match the reviewed decisions.");
const file = path.join(ROOT, "data/travel-knowledge/beaches.json");
const beaches = JSON.parse(fs.readFileSync(file, "utf8")) as Row[];
const byId = new Map(report.results.map((row) => [String(row.id), row]));
let changed = 0;
for (const id of decisions.accepted) {
  const item = beaches.find((row) => row.id === id);
  const resolved = byId.get(id);
  if (!item || !resolved?.candidate) throw new Error(`Reviewed beach ${id} is missing from the catalog or report.`);
  const candidate = resolved.candidate as Candidate;
  item.googlePlaceId = candidate.id;
  if (candidate.formattedAddress) item.address = candidate.formattedAddress;
  if (candidate.location?.latitude !== undefined) item.lat = candidate.location.latitude;
  if (candidate.location?.longitude !== undefined) item.lng = candidate.location.longitude;
  if (decisions.overrides[id]?.island) item.island = decisions.overrides[id].island;
  item.sourceLabel = "Google Places shoreline identity — public access requires authoritative confirmation";
  item.sourceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(item.name))}&query_place_id=${candidate.id}`;
  item.verificationLevel = "secondary";
  item.verifiedAt = decisions.reviewedAt;
  item.operatingStatus = "unconfirmed";
  changed += 1;
}
for (const id of decisions.geographicConfirmations ?? []) {
  const item = beaches.find((row) => row.id === id);
  if (!item) throw new Error(`Geographically confirmed beach ${id} is missing from the catalog.`);
  const override = decisions.overrides[id];
  if (!override?.sourceLabel || !override.sourceUrl) throw new Error(`Geographically confirmed beach ${id} requires a source label and URL.`);
  item.sourceLabel = override.sourceLabel;
  item.sourceUrl = override.sourceUrl;
  item.verificationLevel = "secondary";
  item.verifiedAt = decisions.reviewedAt;
  item.operatingStatus = "unconfirmed";
  if (override.hoursNote) item.hoursNote = override.hoursNote;
  changed += 1;
}
fs.writeFileSync(file, `${JSON.stringify(beaches, null, 2)}\n`);
console.log(`Applied ${changed} reviewed beach identity records.`);
console.log("Public access, amenities, safety, and operating status remain unconfirmed.");
