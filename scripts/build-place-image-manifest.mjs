import fs from "node:fs";
import path from "node:path";

const PLACES_FILE = "public/data/places.json";
const OUT = "public/data/place-image-manifest.json";

const places = JSON.parse(fs.readFileSync(PLACES_FILE, "utf8"));

const manifest = {};

for (const place of places) {
  const images = Array.from(
    new Set([
      place.heroImage,
      place.coverImage,
      ...(Array.isArray(place.gallery) ? place.gallery : []),
      ...(Array.isArray(place.images) ? place.images : []),
    ].filter(Boolean))
  );

  manifest[place.slug] = {
    title: place.title,
    islandCode: place.islandCode,
    category: place.category,
    images,
    existingImages: images.filter((img) =>
      fs.existsSync(path.join("public", img.replace(/^\//, "")))
    ),
    missingImages: images.filter((img) =>
      !fs.existsSync(path.join("public", img.replace(/^\//, "")))
    ),
  };
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");

const missing = Object.values(manifest).reduce(
  (sum, item) => sum + item.missingImages.length,
  0
);

console.log(`Built ${OUT}`);
console.log(`Places: ${Object.keys(manifest).length}`);
console.log(`Missing image references: ${missing}`);
