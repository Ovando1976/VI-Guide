import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const datasets = [
  ["place", "data/travel-knowledge/places.json"],
  ["beach", "data/travel-knowledge/beaches.json"],
  ["historic", "data/travel-knowledge/historic-sites.json"],
];

function status(image = "") {
  if (!image) return "missing";
  if (/\.svg(?:$|\?)/i.test(image) || /(placeholder|fallback|default|generic)/i.test(image)) return "placeholder";
  if (/^https?:\/\//i.test(image)) return "remote";
  if (!image.startsWith("/")) return "broken";
  return fs.existsSync(path.join(publicRoot, image.replace(/^\/+/, ""))) ? "local" : "broken";
}

const rows = [];
for (const [kind, relative] of datasets) {
  const records = JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
  for (const record of records) {
    const image = record.heroImage ?? record.images?.[0] ?? "";
    rows.push({ kind, id: record.id, name: record.name, island: record.island, image, status: status(image) });
  }
}

const accommodationSources = JSON.parse(fs.readFileSync(path.join(root, "data/accommodation-image-sources.json"), "utf8"));
const loader = fs.readFileSync(path.join(root, "lib/accommodations/loader.ts"), "utf8");
const seedSection = loader.slice(loader.indexOf("const seeds:"), loader.indexOf("export const ACCOMMODATIONS"));
let pendingName = null;
for (const line of seedSection.split(/\r?\n/)) {
  const nameMatch = line.match(/^\s*name:\s*("(?:\\.|[^"\\])*")\s*,?\s*$/);
  if (nameMatch) {
    pendingName = JSON.parse(nameMatch[1]);
    continue;
  }
  const islandMatch = line.match(/^\s*island:\s*"(stt|stj|stx)"\s*,?\s*$/);
  if (!islandMatch || !pendingName) continue;
  const name = pendingName;
  const island = islandMatch[1];
  pendingName = null;
  const id = name.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const image = accommodationSources[id]?.localPath ?? `/images/stays/${island}/${id}.svg`;
  rows.push({ kind: "stay", id, name, island, image, status: status(image) });
}

const gaps = rows.filter((row) => ["missing", "placeholder", "broken"].includes(row.status));
const grouped = gaps.reduce((result, row) => {
  const key = `${row.kind}:${row.island}`;
  result[key] = (result[key] ?? 0) + 1;
  return result;
}, {});
const summary = { totalEntries: rows.length, photographed: rows.length - gaps.length, gaps: gaps.length, grouped };
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/final-photo-gap-audit.json"), `${JSON.stringify({ summary, gaps, rows }, null, 2)}\n`);
const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
fs.writeFileSync(path.join(root, "reports/final-photo-gaps.csv"), ["kind,id,name,island,status,image", ...gaps.map((row) => [row.kind, row.id, row.name, row.island, row.status, row.image].map(quote).join(","))].join("\n") + "\n");
console.table(summary);
console.table(grouped);
console.log("Wrote reports/final-photo-gap-audit.json");
console.log("Wrote reports/final-photo-gaps.csv");
