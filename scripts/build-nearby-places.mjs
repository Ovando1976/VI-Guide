import fs from "node:fs";
import path from "node:path";

const PLACES_FILE = "public/data/places.json";
const OUT = "public/data/nearby-places.json";
const MAX_DISTANCE_MILES = 5;
const MAX_RESULTS = 12;

const places = JSON.parse(fs.readFileSync(PLACES_FILE, "utf8"));

function toRad(value) {
  return (value * Math.PI) / 180;
}

function distanceMiles(a, b) {
  const lat1 = a.coordinates?.lat;
  const lng1 = a.coordinates?.lng;
  const lat2 = b.coordinates?.lat;
  const lng2 = b.coordinates?.lng;

  if (
    typeof lat1 !== "number" ||
    typeof lng1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lng2 !== "number"
  ) {
    return Infinity;
  }

  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

const nearby = {};

for (const place of places) {
  if (!place.slug || !place.coordinates) continue;

  nearby[place.slug] = places
    .filter((other) => other.slug !== place.slug)
    .map((other) => ({
      slug: other.slug,
      title: other.title,
      category: other.category,
      islandCode: other.islandCode,
      heroImage: other.heroImage || other.coverImage || "",
      distanceMiles: Number(distanceMiles(place, other).toFixed(2)),
    }))
    .filter((item) => item.distanceMiles <= MAX_DISTANCE_MILES)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, MAX_RESULTS);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(nearby, null, 2) + "\n");

console.log(`Built ${OUT}`);
console.log(`Indexed places: ${Object.keys(nearby).length}`);
