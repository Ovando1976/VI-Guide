import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/data/place-image-manifest.json"), "utf8"));
const datasetDir = path.join(root, "data/travel-knowledge");

const approved = {
  "places.json": {
    "hull-bay": "hull-bay-beach",
    "paradise-point": "paradise-point-skyride",
    "peace-hill": "peace-hill-trail",
    "secret-harbour": "secret-harbour-beach",
    "main-street-charlotte-amalie": "downtown-charlotte-amalie",
    "stt-mim-s-seafood-bistro": "mims-seaside-bistro",
  },
  "beaches.json": {
    "isaac-bay": "jack-and-isaac-bay-beach",
    "jack-bay": "jack-and-isaac-bay-beach",
  },
  "historic-sites.json": {
    "whim": "estate-whim-plantation",
    "estate-whim-greathouse": "estate-whim-plantation",
    "hams-bluff-light": "hams-bluff-lighthouse",
    "synagogue-beracha-veshalom": "st-thomas-synagogue",
    "catherineberg-jockumsdahl-herman-farm": "catherineberg-ruins",
    "ft-frederik-of-us-virgin-islands": "fort-frederik",
    "christiansted-nhs-custom-house": "old-danish-customs-house",
  },
};

function imageFor(slug) {
  return [...new Set([...(manifest[slug]?.existingImages ?? []), ...(manifest[slug]?.images ?? [])])]
    .find((url) => typeof url === "string" && fs.existsSync(path.join(root, "public", url.replace(/^\/+/, ""))));
}

const updated = [];
for (const [filename, aliases] of Object.entries(approved)) {
  const file = path.join(datasetDir, filename);
  const records = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const record of records) {
    const slug = aliases[record.id];
    if (!slug) continue;
    const image = imageFor(slug);
    if (!image) continue;
    record.heroImage = image;
    if (filename === "historic-sites.json") {
      record.images = [...new Set([image, ...(record.images ?? [])])];
      record.imageCount = record.images.length;
    }
    updated.push({ dataset: filename, id: record.id, photo: slug, image });
  }
  fs.writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`);
}

const newEntries = [
  ["bordeaux-mountain", "Bordeaux Mountain", "stj", "attraction"],
  ["carambola-tide-pools", "Carambola Tide Pools", "stx", "attraction"],
  ["cyril-e-king-airport", "Cyril E. King Airport", "stt", "transport"],
  ["limestone-bay-beach", "Limestone Bay Beach", "wi", "beach"],
  ["seven-arches-museum", "Seven Arches Museum", "stt", "attraction"],
  ["vendors-plaza", "Vendor's Plaza", "stt", "shopping"],
  ["vi-childrens-museum", "VI Children's Museum", "stt", "attraction"],
];
const placesPath = path.join(datasetDir, "places.json");
const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));
const existing = new Set(places.flatMap((record) => [record.id, record.slug]));
const created = [];
for (const [slug, name, island, category] of newEntries) {
  if (existing.has(slug)) continue;
  const image = imageFor(slug);
  if (!image) continue;
  const record = { id: slug, slug, name, island, category, description: `${name} is a visitor destination included in the VI Guide island catalog.`, heroImage: image, tags: [category, island, "local catalog"], featured: false };
  places.push(record);
  created.push(record);
}
places.sort((a, b) => String(a.name).localeCompare(String(b.name)));
fs.writeFileSync(placesPath, `${JSON.stringify(places, null, 2)}\n`);

const result = { updatedCount: updated.length, createdCount: created.length, updated, created };
fs.writeFileSync(path.join(root, "reports/final-photo-catalog-pass.json"), `${JSON.stringify(result, null, 2)}\n`);
console.table({ approvedAliasMatches: updated.length, verifiedNewEntries: created.length });
console.log("Wrote reports/final-photo-catalog-pass.json");
