import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const API_KEY =
  process.env.GOOGLE_MAPS_GEOCODING_API_KEY ||
  process.env.GOOGLE_MAPS_GEOCODING_API_KEY;

if (!API_KEY) throw new Error("Missing GOOGLE_MAPS_GEOCODING_API_KEY in .env.local");

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PHOTO_BASE_URL = "https://places.googleapis.com/v1";

const items = [
  ["Three Palms", "/images/places/st-thomas/three-palms-1.jpg", "3 Palms Restaurant St Thomas USVI"],
  ["Hook Line & Sinker", "/images/places/st-thomas/hook-line-and-sinker-1.jpg", "Hook Line and Sinker St Thomas USVI"],
  ["Sea La Vie", "/images/places/st-thomas/sea-la-vie-1.jpg", "Sea La Vie St Thomas USVI"],
  ["Bumpa's Breakfast", "/images/places/st-thomas/bumpas-breakfast-1.jpg", "Bumpas Sandwich Shop St Thomas USVI"],
  ["Shama's Specialties", "/images/places/st-thomas/shamas-specialties-1.jpg", "Shama's Specialties St Thomas USVI"],
  ["El Gringos", "/images/places/st-thomas/el-gringos-1.jpg", "El Gringos St Thomas USVI"],
  ["Rooftop Bar Charlotte Amalie", "/images/places/st-thomas/rooftop-bar-charlotte-amalie-1.jpg", "Rooftop Bar Charlotte Amalie St Thomas USVI"],
  ["Mooie's Bar", "/images/places/st-john/mooies-bar-1.jpg", "Mooie's Bar St John USVI"],
  ["Café Roma", "/images/places/st-john/caf-roma-1.jpg", "Cafe Roma St John USVI"],
  ["Harvey's", "/images/places/st-croix/harveys-1.jpg", "Harvey's Restaurant St Croix USVI"],
  ["40 Strand Eatery", "/images/places/st-croix/40-strand-eatery-1.jpg", "40 Strand Eatery St Croix USVI"],
  ["Kendricks", "/images/places/st-croix/kendricks-1.jpg", "Kendricks Restaurant St Croix USVI"],
  ["Nauti Bar and Grille", "/images/places/st-croix/nauti-bar-and-grille-1.jpg", "Nauti Bar and Grille St Croix USVI"],
  ["Cheeseburgers in America's Paradise", "/images/places/st-croix/cheeseburgers-in-americas-paradise-1.jpg", "Cheeseburgers in America's Paradise St Croix USVI"],
  ["TLC Kitchen", "/images/places/st-croix/tlc-kitchen-1.jpg", "TLC Kitchen St Croix USVI"],
  ["Taco Shack", "/images/places/st-croix/taco-shack-1.jpg", "Taco Shack St Croix USVI"],
  ["St. Thomas Synagogue", "/images/places/st-thomas/st-thomas-synagogue-1.jpg", "Hebrew Congregation of St Thomas Synagogue USVI"],
  ["Red Hook Marina", "/images/places/st-thomas/red-hook-marina-1.jpg", "Red Hook Marina St Thomas USVI"],
  ["Petroglyphs Trail", "/images/places/st-john/petroglyphs-trail-1.jpg", "Reef Bay Petroglyph Trail St John USVI"],
  ["Cruz Bay Taxi Stand", "/images/places/st-thomas/cruz-bay-taxi-stand-1.jpg", "Cruz Bay Taxi Stand St John USVI"],
  ["Coral Bay Taxi Stand", "/images/places/st-john/coral-bay-taxi-stand-1.jpg", "Coral Bay Taxi Stand St John USVI"],
  ["Salt Pond Bay Beach", "/images/places/st-john/salt-pond-bay-beach-1.jpg", "Salt Pond Bay Beach St John USVI"],
];

const report = [];

function publicPathToDisk(imagePath) {
  return path.join("public", imagePath.replace(/^\/+/, ""));
}

async function searchPlace(query) {
  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 5,
      locationBias: {
        rectangle: {
          low: { latitude: 17.6, longitude: -65.2 },
          high: { latitude: 18.5, longitude: -64.5 },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`Places search failed ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return data.places?.find((p) => p.photos?.[0]?.name) || data.places?.[0] || null;
}

async function downloadPhoto(photoName, outFile) {
  const url =
    `${PHOTO_BASE_URL}/${photoName}/media` +
    `?maxWidthPx=1400&maxHeightPx=1000&key=${encodeURIComponent(API_KEY)}`;

  const res = await fetch(url, { redirect: "follow" });

  if (!res.ok) throw new Error(`Photo download failed ${res.status}: ${await res.text()}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, buffer);
}

for (const [title, imagePath, query] of items) {
  const outFile = publicPathToDisk(imagePath);

  if (fs.existsSync(outFile)) {
    console.log(`Exists: ${imagePath}`);
    report.push({ title, imagePath, status: "exists" });
    continue;
  }

  try {
    console.log(`Fetching: ${title}`);
    const place = await searchPlace(query);

    if (!place) {
      console.log("  No place found.");
      report.push({ title, imagePath, query, status: "no_place" });
      continue;
    }

    const matchedName = place.displayName?.text || "";
    const photoName = place.photos?.[0]?.name;

    if (!photoName) {
      console.log(`  No photo: ${matchedName}`);
      report.push({ title, imagePath, query, matchedName, status: "no_photo" });
      continue;
    }

    await downloadPhoto(photoName, outFile);

    console.log(`  Saved: ${outFile} ← ${matchedName}`);
    report.push({ title, imagePath, query, matchedName, status: "downloaded" });
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    report.push({ title, imagePath, query, status: "error", error: error.message });
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
}

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync(
  "reports/final-22-place-images-report.json",
  JSON.stringify(report, null, 2) + "\n"
);

console.log("");
console.log("Report written: reports/final-22-place-images-report.json");
console.log(`Downloaded: ${report.filter((r) => r.status === "downloaded").length}`);
console.log(`Existing: ${report.filter((r) => r.status === "exists").length}`);
console.log(`No photo/place: ${report.filter((r) => r.status === "no_photo" || r.status === "no_place").length}`);
console.log(`Errors: ${report.filter((r) => r.status === "error").length}`);
