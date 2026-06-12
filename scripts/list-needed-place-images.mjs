// scripts/list-needed-place-images.mjs
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("src/data");
const PUBLIC_DIR = path.resolve("public");

const DATA_FILES = [
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
  const fullPath = path.join(DATA_DIR, file);
  if (!fs.existsSync(fullPath)) return [];
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function existsPublic(publicPath) {
  if (!publicPath || !publicPath.startsWith("/")) return false;
  return fs.existsSync(path.join(PUBLIC_DIR, publicPath));
}

function isPlaceholder(record) {
  const title = String(record.title || record.name || "");
  const slug = String(record.slug || "");

  return (
    /^USVI Attraction \d+/i.test(title) ||
    /reference-site-\d+/i.test(slug) ||
    /Reference Site \d+/i.test(title)
  );
}

const neededMap = new Map();

for (const file of DATA_FILES) {
  for (const record of readJson(file)) {
    if (isPlaceholder(record)) continue;

    const images = [
      record.coverImage,
      ...(Array.isArray(record.gallery) ? record.gallery : []),
    ].filter(Boolean);

    for (const imagePath of images) {
      if (!imagePath.startsWith("/images/")) continue;

      const key = imagePath;

      if (!neededMap.has(key)) {
        neededMap.set(key, {
          imagePath,
          title: record.title || record.name,
          slug: record.slug,
          islandCode: record.islandCode || record.island,
          category: record.category,
          dataFiles: [file],
          exists: existsPublic(imagePath),
        });
      } else {
        const existing = neededMap.get(key);
        if (!existing.dataFiles.includes(file)) {
          existing.dataFiles.push(file);
        }
      }
    }
  }
}

const allNeeded = [...neededMap.values()];
const missing = allNeeded.filter((item) => !item.exists);
const existing = allNeeded.filter((item) => item.exists);

fs.mkdirSync("reports", { recursive: true });

fs.writeFileSync(
  "reports/needed-place-images.json",
  JSON.stringify(allNeeded, null, 2)
);
fs.writeFileSync(
  "reports/missing-place-images.json",
  JSON.stringify(missing, null, 2)
);
fs.writeFileSync(
  "reports/existing-place-images.json",
  JSON.stringify(existing, null, 2)
);

console.log("\nUSVI Image Audit");
console.log("================");
console.log(`Unique image references: ${allNeeded.length}`);
console.log(`Existing images: ${existing.length}`);
console.log(`Missing images: ${missing.length}`);

console.log("\nMissing unique images:\n");
for (const item of missing) {
  console.log(`- ${item.title} → ${item.imagePath}`);
}
