import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const reportPath = path.join(root, "reports/photo-catalog-reconciliation.json");
const manifestPath = path.join(root, "public/data/place-image-manifest.json");
const placesPath = path.join(root, "data/travel-knowledge/places.json");
const allowed = new Set(["restaurant", "nightlife", "shopping"]);

function normalize(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[’']/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function islandFromImage(image = "") {
  if (image.includes("/st-thomas/")) return "stt";
  if (image.includes("/st-john/")) return "stj";
  if (image.includes("/st-croix/")) return "stx";
  if (image.includes("/water-island/")) return "wi";
  return null;
}

for (const required of [reportPath, manifestPath, placesPath]) {
  if (!fs.existsSync(required)) {
    console.error(`Missing ${path.relative(root, required)}`);
    process.exit(1);
  }
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));
const allCatalogs = ["places.json", "beaches.json", "historic-sites.json"]
  .flatMap((name) => JSON.parse(fs.readFileSync(path.join(root, "data/travel-knowledge", name), "utf8")));
const known = new Set(allCatalogs.flatMap((record) => [record.id, record.slug, record.name].map(normalize).filter(Boolean)));
const created = [];
const skipped = [];

for (const orphan of report.orphans ?? []) {
  const entry = manifest[orphan.slug];
  const category = String(entry?.category ?? orphan.category ?? "").toLowerCase();
  if (!allowed.has(category)) continue;
  const image = orphan.image;
  const island = islandFromImage(image);
  const title = String(entry?.title ?? orphan.title ?? "").trim();
  const identity = normalize(title);
  if (!title || !island || !image || !fs.existsSync(path.join(root, "public", image.replace(/^\/+/, "")))) {
    skipped.push({ slug: orphan.slug, reason: "invalid-metadata-or-image" });
    continue;
  }
  if (known.has(normalize(orphan.slug)) || known.has(identity)) {
    skipped.push({ slug: orphan.slug, reason: "duplicate" });
    continue;
  }
  const mappedCategory = category === "shopping" ? "shopping" : "food";
  const record = {
    id: orphan.slug,
    slug: orphan.slug,
    name: title,
    island,
    category: mappedCategory,
    description: `${title} is a local ${mappedCategory === "food" ? "dining and gathering place" : "shopping destination"} included in the VI Guide island catalog.`,
    heroImage: image,
    tags: [mappedCategory, island, "local business"],
    featured: false,
  };
  places.push(record);
  created.push(record);
  known.add(normalize(orphan.slug));
  known.add(identity);
}

if (apply && created.length) {
  places.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  fs.writeFileSync(placesPath, `${JSON.stringify(places, null, 2)}\n`);
}

const output = { mode: apply ? "apply" : "dry-run", createdCount: created.length, skippedCount: skipped.length, created, skipped };
fs.writeFileSync(path.join(root, "reports/verified-orphan-businesses.json"), `${JSON.stringify(output, null, 2)}\n`);
console.table({ mode: output.mode, newBusinessEntries: output.createdCount, skipped: output.skippedCount });
console.log("Wrote reports/verified-orphan-businesses.json");
