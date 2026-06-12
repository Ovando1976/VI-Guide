import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.join(process.cwd(), "src/data/attractions.json");

const ST_CROIX_FIXES = new Set([
  "christiansted-national-historic-site",
  "fort-christiansvaern",
  "steeple-building",
]);

function fixImagePath(value) {
  if (typeof value !== "string") return value;
  return value.replace("/images/places/st-john/", "/images/places/st-croix/");
}

const raw = await fs.readFile(filePath, "utf8");
const attractions = JSON.parse(raw);

const fixed = attractions.map((item) => {
  if (!ST_CROIX_FIXES.has(item.slug)) return item;

  return {
    ...item,
    islandCode: "st_croix",
    shortDescription: item.shortDescription?.replace("st john", "st croix"),
    coverImage: fixImagePath(item.coverImage),
    gallery: Array.isArray(item.gallery) ? item.gallery.map(fixImagePath) : [],
  };
});

await fs.writeFile(filePath, JSON.stringify(fixed, null, 2) + "\n");

console.log("Fixed attraction island/image errors.");
