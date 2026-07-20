import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const manifestPath = path.join(root, "public/data/place-image-manifest.json");
const placesPath = path.join(root, "data/travel-knowledge/places.json");
const catalogPaths = [
  placesPath,
  path.join(root, "data/travel-knowledge/beaches.json"),
  path.join(root, "data/travel-knowledge/historic-sites.json"),
];

function slugify(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function identities(record) {
  const base = [record.id, record.slug, record.name, record.title].map(slugify).filter(Boolean);
  return new Set(base.flatMap((slug) => [slug, slug.replace(/-beach$/, ""), `${slug}-beach`]));
}

function islandFromImage(image) {
  if (image.includes("/st-thomas/")) return "stt";
  if (image.includes("/st-john/")) return "stj";
  if (image.includes("/st-croix/")) return "stx";
  if (image.includes("/water-island/")) return "wi";
  return null;
}

function categoryFor(entry) {
  const category = slugify(entry.category);
  if (category.includes("beach")) return "beach";
  if (category.includes("historic")) return "historic";
  if (category.includes("restaurant") || category.includes("nightlife")) return "food";
  if (category.includes("transport")) return "transport";
  if (category.includes("shopping")) return "shopping";
  if (category.includes("trail")) return "nature";
  return "attraction";
}

if (!fs.existsSync(manifestPath)) {
  console.error("Missing public/data/place-image-manifest.json");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const catalogs = catalogPaths.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const known = new Set(catalogs.flatMap((record) => [...identities(record)]));
const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));
const created = [];
const skipped = [];

for (const [manifestSlug, entry] of Object.entries(manifest)) {
  const slug = slugify(manifestSlug);
  if ([...identities(entry)].some((identity) => known.has(identity))) continue;

  const image = [...new Set([...(entry.existingImages ?? []), ...(entry.images ?? [])])]
    .find((url) => typeof url === "string" && url.startsWith("/images/places/") &&
      fs.existsSync(path.join(root, "public", url.replace(/^\/+/, ""))));
  const island = image ? islandFromImage(image) : null;
  if (!image || !island) {
    skipped.push({ slug, reason: "missing-valid-place-photo" });
    continue;
  }

  const name = String(entry.title ?? "").trim();
  if (!name) {
    skipped.push({ slug, reason: "missing-title" });
    continue;
  }

  const category = categoryFor(entry);
  const record = {
    id: slug,
    slug,
    name,
    island,
    category,
    description: `${name} is a ${category === "food" ? "local dining and gathering" : "visitor"} destination included in the VI Guide island catalog.`,
    heroImage: image,
    tags: [...new Set([category, island, "local catalog"])],
    featured: false,
  };
  places.push(record);
  created.push(record);
  for (const identity of identities(record)) known.add(identity);
}

if (apply && created.length) {
  places.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  fs.writeFileSync(placesPath, `${JSON.stringify(places, null, 2)}\n`);
}

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/orphan-photo-entry-report.json"), `${JSON.stringify({
  mode: apply ? "apply" : "dry-run", createdCount: created.length, skippedCount: skipped.length, created, skipped,
}, null, 2)}\n`);

console.table({ mode: apply ? "apply" : "dry-run", newEntries: created.length, skipped: skipped.length });
console.log("Wrote reports/orphan-photo-entry-report.json");
