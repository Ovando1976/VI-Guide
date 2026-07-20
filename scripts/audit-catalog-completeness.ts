import fs from "node:fs";
import path from "node:path";

import { ACCOMMODATIONS } from "../lib/accommodations/loader";

type Row = Record<string, unknown>;
type Kind = "restaurant" | "beach" | "stay";
type Finding = { severity: "error" | "warning"; kind: Kind; id: string; field: string; message: string };

const ROOT = process.cwd();
const strict = process.argv.includes("--strict");
const staleDays = Number(process.env.CATALOG_STALE_DAYS ?? 180);

function readJson(file: string): Row[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")) as Row[];
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function present(value: unknown) {
  return text(value).length > 0;
}

function imageStatus(value: unknown) {
  const image = text(value);
  if (!image) return "missing";
  if (/fallback|placeholder|default-cover/i.test(image)) return "placeholder";
  if (/^https?:\/\//.test(image)) return "remote";
  if (image.startsWith("/")) {
    return fs.existsSync(path.join(ROOT, "public", image.slice(1))) ? "local" : "missing-local";
  }
  return "invalid";
}

function daysOld(value: unknown) {
  const time = Date.parse(text(value));
  return Number.isFinite(time) ? Math.floor((Date.now() - time) / 86_400_000) : null;
}

const places = readJson("data/travel-knowledge/places.json");
const beaches = readJson("data/travel-knowledge/beaches.json");
const restaurants = places.filter((row) => ["food", "restaurant"].includes(text(row.category).toLowerCase()));
const groups: Record<Kind, Row[]> = {
  restaurant: restaurants,
  beach: beaches,
  stay: ACCOMMODATIONS as unknown as Row[],
};

const findings: Finding[] = [];
const duplicateKeys = new Map<string, string>();
for (const [kind, rows] of Object.entries(groups) as [Kind, Row[]][]) {
  for (const row of rows) {
    const id = text(row.id) || text(row.slug) || text(row.name) || "unknown";
    const required = ["name", "island", "description", "heroImage"];
    for (const field of required) {
      if (!present(row[field])) findings.push({ severity: "error", kind, id, field, message: `${field} is missing` });
    }
    const image = imageStatus(row.heroImage);
    if (!["local", "remote"].includes(image)) findings.push({ severity: "error", kind, id, field: "heroImage", message: `image is ${image}` });
    if (!present(row.sourceUrl)) findings.push({ severity: "warning", kind, id, field: "sourceUrl", message: "no verification source" });
    if (!present(row.verifiedAt)) findings.push({ severity: "warning", kind, id, field: "verifiedAt", message: "no verification date" });
    const age = daysOld(row.verifiedAt);
    if (age !== null && age > staleDays) findings.push({ severity: "warning", kind, id, field: "verifiedAt", message: `verification is ${age} days old` });
    if (kind !== "beach" && !present(row.website) && !present(row.phone)) findings.push({ severity: "warning", kind, id, field: "contact", message: "no direct website or phone" });
    if (kind === "restaurant" && !present(row.address) && !(typeof row.lat === "number" && typeof row.lng === "number")) findings.push({ severity: "warning", kind, id, field: "location", message: "no address or coordinates" });
    if (!present(row.operatingStatus) || row.operatingStatus === "unconfirmed") findings.push({ severity: "warning", kind, id, field: "operatingStatus", message: "status is unconfirmed" });
    const key = `${kind}:${text(row.island)}:${text(row.name).toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
    const prior = duplicateKeys.get(key);
    if (prior) findings.push({ severity: "error", kind, id, field: "name", message: `possible duplicate of ${prior}` });
    else duplicateKeys.set(key, id);
  }
}

const summary = Object.fromEntries((Object.entries(groups) as [Kind, Row[]][]).map(([kind, rows]) => {
  const scoped = findings.filter((finding) => finding.kind === kind);
  return [kind, {
    records: rows.length,
    withUsableImage: rows.filter((row) => ["local", "remote"].includes(imageStatus(row.heroImage))).length,
    withSource: rows.filter((row) => present(row.sourceUrl)).length,
    recentlyVerified: rows.filter((row) => { const age = daysOld(row.verifiedAt); return age !== null && age <= staleDays; }).length,
    confirmedOperating: rows.filter((row) => row.operatingStatus === "verified-operating").length,
    errors: scoped.filter((finding) => finding.severity === "error").length,
    warnings: scoped.filter((finding) => finding.severity === "warning").length,
  }];
}));

const report = {
  generatedAt: new Date().toISOString(),
  policy: { staleDays, strict, note: "Operating status and hours are volatile and require a dated authoritative or first-party source." },
  summary,
  findings,
};
fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports/catalog-completeness.json"), `${JSON.stringify(report, null, 2)}\n`);
console.table(summary);
console.log(`Catalog findings: ${findings.length}. Report: reports/catalog-completeness.json`);
if (strict && findings.some((finding) => finding.severity === "error")) process.exitCode = 1;
