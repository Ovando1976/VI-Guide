import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/data/place-image-manifest.json"), "utf8"));
const datasets = ["places.json", "beaches.json", "historic-sites.json"];
const islandMap = { stt: "st-thomas", stj: "st-john", stx: "st-croix", wi: "water-island" };
const ignored = new Set(["the", "a", "an", "at", "and", "of", "in", "on", "st", "saint", "usvi"]);
const deniedPairs = new Set([
  "places.json:stt-bluebeard-s-castle-hilltop-villas-marriott-s-frenchman-s-cove-timeshares:bluebeards-castle",
  "beaches.json:brown-bay:brown-bay-trail",
  "beaches.json:caneel-bay:caneel-bay-overlook",
  "beaches.json:reef-bay:reef-bay-trail",
  "historic-sites.json:cinnamon-bay-archaeology:cinnamon-bay-archaeology-museum",
]);
const approvedPairs = new Set([
  "places.json:christiansted-boardwalk:christiansted-boardwalk",
  "places.json:frederiksted-pier:frederiksted-pier",
  "places.json:frederiksted-waterfront:frederiksted-waterfront",
  "places.json:gallows-bay:gallows-bay",
  "places.json:old-danish-custom-house:old-danish-customs-house",
  "places.json:protestant-cay:protestant-cay",
  "beaches.json:maho-bay:maho-bay-beach",
  "beaches.json:mermaids-chair:mermaids-chair",
  "beaches.json:rainbow-beach:rainbow-beach",
  "beaches.json:sandy-point:sandy-point-beach",
  "beaches.json:trunk-bay:trunk-bay-beach",
]);

function words(value = "") {
  return String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[’']/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim()
    .split(/\s+/).filter((word) => word && !ignored.has(word));
}

function score(left, right) {
  const a = new Set(words(left));
  const b = new Set(words(right));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;
  const compactA = [...a].join("");
  const compactB = [...b].join("");
  if (compactA === compactB) return 1;
  return Math.max(intersection / union, intersection / Math.min(a.size, b.size) * 0.9);
}

function islandFromImage(image = "") {
  return Object.values(islandMap).find((folder) => image.includes(`/${folder}/`)) ?? null;
}

function validImage(entry) {
  return [...new Set([...(entry.existingImages ?? []), ...(entry.images ?? [])])]
    .find((url) => typeof url === "string" && url.startsWith("/images/places/") &&
      fs.existsSync(path.join(root, "public", url.replace(/^\/+/, ""))));
}

const photos = Object.entries(manifest).map(([slug, entry]) => ({
  slug, entry, image: validImage(entry), title: entry.title ?? slug,
})).filter((photo) => photo.image);
const used = new Set();
const automatic = [];
const ambiguous = [];
const catalogRecords = [];

for (const filename of datasets) {
  const file = path.join(root, "data/travel-knowledge", filename);
  const records = JSON.parse(fs.readFileSync(file, "utf8"));
  let changed = false;
  for (const record of records) {
    catalogRecords.push(record);
    const islandFolder = islandMap[record.island];
    const ranked = photos.filter((photo) => !islandFolder || islandFromImage(photo.image) === islandFolder)
      .map((photo) => ({ photo, value: Math.max(score(record.name, photo.title), score(record.slug ?? record.id, photo.slug)) }))
      .sort((a, b) => b.value - a.value);
    const best = ranked[0];
    const second = ranked[1];
    const denied = best && deniedPairs.has(`${filename}:${record.id}:${best.photo.slug}`);
    const approved = best && approvedPairs.has(`${filename}:${record.id}:${best.photo.slug}`);
    if (!denied && best && (approved || (best.value >= 0.72 && best.value - (second?.value ?? 0) >= 0.1))) {
      const previous = record.heroImage ?? "";
      record.heroImage = best.photo.image;
      if (filename === "historic-sites.json") {
        record.images = [...new Set([best.photo.image, ...(record.images ?? [])])];
        record.imageCount = record.images.length;
      }
      used.add(best.photo.slug);
      automatic.push({ dataset: filename, id: record.id, name: record.name, photo: best.photo.slug, image: best.photo.image, score: best.value, previous });
      if (previous !== record.heroImage) changed = true;
    } else if (best?.value >= 0.45) {
      ambiguous.push({ dataset: filename, id: record.id, name: record.name, candidate: best.photo.slug, score: best.value });
    }
  }
  if (apply && changed) fs.writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`);
}

const orphans = photos.filter((photo) => {
  const folder = islandFromImage(photo.image);
  const best = catalogRecords.filter((record) => !islandMap[record.island] || islandMap[record.island] === folder)
    .reduce((maximum, record) => Math.max(maximum, score(record.name, photo.title), score(record.slug ?? record.id, photo.slug)), 0);
  return best < 0.45;
}).map((photo) => ({
  slug: photo.slug, title: photo.title, category: photo.entry.category, image: photo.image,
}));
const report = { mode: apply ? "apply" : "dry-run", automaticCount: automatic.length, ambiguousCount: ambiguous.length, orphanCount: orphans.length, automatic, ambiguous, orphans };
fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/photo-catalog-reconciliation.json"), `${JSON.stringify(report, null, 2)}\n`);
console.table({ mode: report.mode, automatic: report.automaticCount, ambiguous: report.ambiguousCount, trueOrphans: report.orphanCount });
console.log("Wrote reports/photo-catalog-reconciliation.json");
