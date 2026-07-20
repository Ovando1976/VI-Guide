import fs from "node:fs";
import path from "node:path";

import { queryTerritoryEntities } from "../lib/territory/catalog";

type ImageStatus =
  | "missing"
  | "placeholder"
  | "broken-local"
  | "local"
  | "remote";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const reportRoot = path.join(root, "reports");
const strict = process.argv.includes("--strict");
const placeholderPattern = /(placeholder|fallback|default|generic|cover-[a-z]{3}\.svg)/i;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function classify(image: string): ImageStatus {
  if (!image) return "missing";
  if (image.toLowerCase().includes(".svg")) return "placeholder";
  if (placeholderPattern.test(image)) return "placeholder";
  if (/^https?:\/\//i.test(image)) return "remote";
  if (image.startsWith("/")) {
    const absolute = path.join(publicRoot, image.replace(/^\/+/, ""));
    return fs.existsSync(absolute) ? "local" : "broken-local";
  }
  return "broken-local";
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const rows = queryTerritoryEntities().map((entity) => {
  const hero = clean(entity.media?.hero);
  const gallery = entity.media?.images?.map(clean).filter(Boolean) ?? [];
  const image = hero || gallery[0] || "";

  return {
    id: entity.id,
    name: entity.title,
    island: entity.island,
    kind: entity.kind,
    positioned: Boolean(entity.position),
    image,
    status: classify(image),
  };
});

const failures = rows.filter((row) =>
  ["missing", "placeholder", "broken-local"].includes(row.status)
);
const byStatus = rows.reduce<Record<string, number>>((counts, row) => {
  counts[row.status] = (counts[row.status] ?? 0) + 1;
  return counts;
}, {});
const byKind = failures.reduce<Record<string, number>>((counts, row) => {
  counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  return counts;
}, {});

fs.mkdirSync(reportRoot, { recursive: true });
fs.writeFileSync(
  path.join(reportRoot, "map-image-audit.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: { total: rows.length, needsPhoto: failures.length, byStatus, byKind },
      rows,
    },
    null,
    2
  )}\n`
);

const headers = ["id", "name", "island", "kind", "positioned", "status", "image"];
fs.writeFileSync(
  path.join(reportRoot, "map-images-needing-photos.csv"),
  [headers, ...failures.map((row) => headers.map((key) => row[key as keyof typeof row]))]
    .map((row) => row.map(csvCell).join(","))
    .join("\n") + "\n"
);

console.table({
  catalogEntries: rows.length,
  needsPhoto: failures.length,
  ...byStatus,
});
console.log("Wrote reports/map-image-audit.json");
console.log("Wrote reports/map-images-needing-photos.csv");

if (strict && failures.length > 0) {
  console.error(`Map image check failed: ${failures.length} entries need photography.`);
  process.exitCode = 1;
}
