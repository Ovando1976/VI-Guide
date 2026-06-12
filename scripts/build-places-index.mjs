import fs from "node:fs";
import path from "node:path";

const DATA_DIR = "src/data";
const OUT = "public/data/places.json";

const files = [
  "restaurants-st-thomas.json",
  "restaurants-st-john.json",
  "restaurants-st-croix.json",
  "restaurants-water-island.json",
  "attractions.json",
  "transportation.json",
  "ferry-terminals.json",
  "cruise-ports.json",
  "shopping.json",
  "nightlife.json",
  "hiking-trails.json",
  "historic-sites.json",
  "beaches.json",
];

function readJson(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) {
    console.warn(`Missing: ${p}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function normalizePlace(place, sourceFile) {
  const slug = place.slug || place.id || place.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return {
    ...place,
    slug,
    id: slug,
    title: place.title || place.name || slug,
    name: place.name || place.title || slug,
    category: place.category || sourceFile.replace(".json", ""),
    sourceFile,
    heroImage: place.heroImage || place.coverImage || place.image || "",
    images: Array.from(
      new Set([
        place.coverImage,
        place.image,
        ...(Array.isArray(place.gallery) ? place.gallery : []),
        ...(Array.isArray(place.images) ? place.images : []),
      ].filter(Boolean))
    ),
  };
}

const places = files.flatMap((file) =>
  readJson(file).map((place) => normalizePlace(place, file))
);

const bySlug = new Map();

for (const place of places) {
  if (!place.slug) continue;
  if (!bySlug.has(place.slug)) bySlug.set(place.slug, place);
}

const output = [...bySlug.values()].sort((a, b) =>
  String(a.title).localeCompare(String(b.title))
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n");

console.log(`Built ${OUT}`);
console.log(`Places: ${output.length}`);
