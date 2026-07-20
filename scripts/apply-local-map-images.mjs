import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apply = process.argv.includes("--apply");
const manifestPath = path.join(root, "public/data/place-image-manifest.json");
const reportDir = path.join(root, "reports");
const datasets = [
  "data/travel-knowledge/places.json",
  "data/travel-knowledge/beaches.json",
  "data/travel-knowledge/historic-sites.json",
];

const islandFolders = {
  stt: "st-thomas", st_thomas: "st-thomas",
  stj: "st-john", st_john: "st-john",
  stx: "st-croix", st_croix: "st-croix",
  wi: "water-island", water_island: "water-island",
};

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const localPhotos = walk(path.join(root, "public/images"))
  .filter((file) => /\.(?:avif|jpe?g|png|webp)$/i.test(file))
  .map((file) => ({
    file,
    url: `/${path.relative(path.join(root, "public"), file).split(path.sep).join("/")}`,
    stem: path.basename(file).replace(/\.(?:avif|jpe?g|png|webp)$/i, "").replace(/-\d+$/, ""),
  }));

const islandCodes = {
  stt: "st_thomas",
  st_thomas: "st_thomas",
  stj: "st_john",
  st_john: "st_john",
  stx: "st_croix",
  st_croix: "st_croix",
  wi: "water_island",
  water_island: "water_island",
};

function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function candidates(record) {
  const base = [...new Set([record.slug, record.id, record.name].map(slugify).filter(Boolean))];
  const expanded = [...base];
  for (const slug of base) {
    if (slug.endsWith("-beach")) expanded.push(slug.slice(0, -6));
    else expanded.push(`${slug}-beach`);
  }
  return [...new Set(expanded)];
}

function publicFileExists(url) {
  if (typeof url !== "string" || !url.startsWith("/")) return false;
  return fs.existsSync(path.join(root, "public", url.replace(/^\/+/, "")));
}

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing ${path.relative(root, manifestPath)}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const linked = [];
const unmatched = [];

for (const relativePath of datasets) {
  const absolutePath = path.join(root, relativePath);
  const records = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  let changed = false;

  for (const record of records) {
    const expectedIsland = islandCodes[record.island] ?? islandCodes[record.islandCode];
    let match;
    let matchSlug;

    for (const candidate of candidates(record)) {
      const entry = manifest[candidate];
      if (!entry) continue;
      if (expectedIsland && islandCodes[entry.islandCode] !== expectedIsland) continue;
      const validImages = [...new Set([...(entry.existingImages ?? []), ...(entry.images ?? [])])]
        .filter(publicFileExists);
      if (!validImages.length) continue;
      match = { ...entry, validImages };
      matchSlug = candidate;
      break;
    }

    if (!match) {
      const folder = islandFolders[record.island] ?? islandFolders[record.islandCode];
      const slugs = candidates(record);
      const direct = localPhotos.find((photo) =>
        slugs.includes(photo.stem) && (!folder || photo.url.includes(`/${folder}/`))
      );
      if (direct) {
        match = { validImages: [direct.url] };
        matchSlug = direct.stem;
      } else {
        unmatched.push({ dataset: relativePath, id: record.id ?? "", name: record.name ?? "", island: record.island ?? "" });
        continue;
      }
    }

    const previous = record.heroImage ?? "";
    record.heroImage = match.validImages[0];
    if (relativePath.endsWith("historic-sites.json")) {
      record.images = [...new Set([...match.validImages, ...(record.images ?? []).filter(publicFileExists)])];
      record.imageCount = record.images.length;
    }
    if (record.heroImage !== previous) changed = true;
    linked.push({ dataset: relativePath, id: record.id, manifestSlug: matchSlug, previous, image: record.heroImage });
  }

  if (apply && changed) fs.writeFileSync(absolutePath, `${JSON.stringify(records, null, 2)}\n`);
}

const accommodationSourcesPath = path.join(root, "data/accommodation-image-sources.json");
if (fs.existsSync(accommodationSourcesPath)) {
  const sources = JSON.parse(fs.readFileSync(accommodationSourcesPath, "utf8"));
  const accommodationPhotos = localPhotos.filter((photo) => photo.url.startsWith("/images/accommodations/"));
  for (const photo of accommodationPhotos) {
    if (!sources[photo.stem]?.localPath) {
      sources[photo.stem] = { ...(sources[photo.stem] ?? {}), localPath: photo.url, retrievedAt: new Date().toISOString() };
      linked.push({ dataset: "data/accommodation-image-sources.json", id: photo.stem, manifestSlug: photo.stem, previous: "", image: photo.url });
    }
  }
  if (apply) fs.writeFileSync(accommodationSourcesPath, `${JSON.stringify(sources, null, 2)}\n`);
}

fs.mkdirSync(reportDir, { recursive: true });
const summary = { mode: apply ? "apply" : "dry-run", linked: linked.length, unmatched: unmatched.length, linkedRows: linked, unmatchedRows: unmatched };
fs.writeFileSync(path.join(reportDir, "local-map-image-apply.json"), `${JSON.stringify(summary, null, 2)}\n`);
const csv = ["dataset,id,name,island", ...unmatched.map((row) => [row.dataset, row.id, row.name, row.island]
  .map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
fs.writeFileSync(path.join(reportDir, "local-map-images-unmatched.csv"), `${csv}\n`);

console.table({ linked: linked.length, unmatched: unmatched.length, mode: apply ? "apply" : "dry-run" });
console.log("Wrote reports/local-map-image-apply.json");
console.log("Wrote reports/local-map-images-unmatched.csv");
