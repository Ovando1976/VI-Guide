import fs from "fs";

const read = (path, fallback) =>
  fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : fallback;

const places = read("public/data/places.json", []);
const imageManifest = read("public/data/place-image-manifest.json", {});
const nearby = read("public/data/nearby-places.json", {});
const events = read("src/data/events.json", []);
const grocery = read("src/data/grocery.json", []);

const all = [...places, ...events, ...grocery];

const checks = [
  ["Home", places.length >= 20],
  ["Explore", places.length >= 20],
  ["Beaches", all.some(p => p.category === "beach")],
  ["Dining", all.some(p => p.category === "restaurant")],
  ["Shopping", all.some(p => p.category === "shopping")],
  ["Sights", all.some(p => ["attraction", "history", "historic-site", "historic_site"].includes(p.category))],
  ["Events", events.length > 0],
  ["Grocery", grocery.length > 0],
  ["Map", all.some(p => p.coordinates?.lat && p.coordinates?.lng)],
  ["Nearby", Object.keys(nearby).length > 0],
];

const missingImages = Object.values(imageManifest).filter(e => e.missingImages?.length);

console.log("\nVI Navigator Page Population Audit");
console.log("==================================");
console.log(`Places: ${places.length}`);
console.log(`Events: ${events.length}`);
console.log(`Grocery: ${grocery.length}`);
console.log(`Nearby index entries: ${Object.keys(nearby).length}`);
console.log(`Missing image refs: ${missingImages.length}`);

let failed = false;

for (const [name, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) failed = true;
}

const counts = all.reduce((acc, p) => {
  const key = p.category || "uncategorized";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

console.log("\nCategory counts:");
for (const [k, v] of Object.entries(counts).sort()) console.log(`- ${k}: ${v}`);

const invalid = all.filter(p => !p.title || !p.category || !p.coordinates?.lat || !p.coordinates?.lng);
if (invalid.length) {
  failed = true;
  console.log("\nInvalid records:");
  invalid.slice(0, 25).forEach(p => console.log(`- ${p.title || p.id || "Untitled"}`));
}

if (failed) {
  console.log("\nAudit failed. Fix missing/invalid data before release.");
  process.exit(1);
}

console.log("\nAll core pages are populated.");
