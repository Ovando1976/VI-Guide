import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const missingPath = path.join(ROOT, "missing-images.json");

const SOURCE_FOLDERS: Record<string, string> = {
  historicSite: "historicSite",
  estate: "estate",
  dictionary: "dictionary",
  archive: "archive",
  beach: "beaches",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function svgPlaceholder(title: string, source: string) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const safeSource = source.replace(/[<>&"]/g, "");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="55%" stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#g)"/>
  <circle cx="980" cy="140" r="180" fill="#10b981" opacity="0.18"/>
  <circle cx="160" cy="680" r="220" fill="#38bdf8" opacity="0.12"/>
  <text x="80" y="110" fill="#6ee7b7" font-family="Arial" font-size="34" font-weight="700" letter-spacing="8">${safeSource.toUpperCase()}</text>
  <text x="80" y="390" fill="#ffffff" font-family="Georgia" font-size="62" font-weight="700">${safeTitle}</text>
  <text x="80" y="465" fill="#d1fae5" font-family="Arial" font-size="26">VI Guide image placeholder</text>
</svg>`;
}

function getExistingImage(publicPathNoExt: string) {
  const exts = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

  for (const ext of exts) {
    const full = path.join(ROOT, "public", `${publicPathNoExt}${ext}`);
    if (fs.existsSync(full)) return `${publicPathNoExt}${ext}`;
  }

  return null;
}

if (!fs.existsSync(missingPath)) {
  console.error("missing-images.json not found. Run: npx tsx scripts/audit-missing-images.ts");
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(missingPath, "utf8")) as any[];

const manifest: any[] = [];

for (const row of rows) {
  const source = String(row.source || "unknown");
  if (source === "archive") continue;

  const folder = SOURCE_FOLDERS[source] || source;
  const name = String(row.name || row.id || "missing-image");
  const slug = slugify(name);
  const publicBase = `/images/${folder}/${slug}`;
  const outputDir = path.join(ROOT, "public", "images", folder);

  ensureDir(outputDir);

  let imageUrl = getExistingImage(publicBase);

  if (!imageUrl) {
    const svgPath = path.join(outputDir, `${slug}.svg`);
    fs.writeFileSync(svgPath, svgPlaceholder(name, source));
    imageUrl = `/images/${folder}/${slug}.svg`;
  }

  manifest.push({
    id: row.id,
    name,
    source,
    island: row.island,
    imageUrl,
    manualReplacementPath: `/public/images/${folder}/${slug}.jpg`,
  });
}

fs.writeFileSync(
  path.join(ROOT, "image-manifest-generated.json"),
  JSON.stringify(manifest, null, 2)
);

console.log("Image sync complete:");
console.log({
  createdOrFound: manifest.length,
  manifest: "image-manifest-generated.json",
});