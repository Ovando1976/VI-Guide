#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "data/travel-knowledge/places.json");
const publicDir = path.join(root, "public");
const targetDir = path.join(publicDir, "images/places");
const fallbackDir = path.join(targetDir, "fallbacks");

if (!fs.existsSync(catalogPath)) throw new Error(`Missing ${catalogPath}`);
fs.mkdirSync(fallbackDir, { recursive: true });

const rows = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokens(value) {
  return normalize(value).split("-")
    .filter((token) => token.length >= 3 && !["the", "and", "bay", "saint"].includes(token));
}

function scoreCandidate(row, candidate) {
  const name = normalize(path.basename(candidate, path.extname(candidate)));
  const wanted = new Set([...tokens(row.slug), ...tokens(row.name)]);
  let score = 0;
  for (const token of wanted) if (name.includes(token)) score += token.length >= 6 ? 4 : 2;
  const rel = candidate.split(path.sep).join("/").toLowerCase();
  if (rel.includes("/images/historic/") && ["historic", "museum", "monument"].includes(row.category)) score += 2;
  if (rel.includes("/images/beaches/") && ["attraction", "nature"].includes(row.category)) score += 1;
  if (name === normalize(row.slug) || name === normalize(row.name)) score += 20;
  return score;
}

function fallbackSvg(category, island) {
  const islandLabel = island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : island === "stx" ? "St. Croix" : "U.S. Virgin Islands";
  const title = String(category || "Discover").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#083b59"/><stop offset=".55" stop-color="#16859a"/><stop offset="1" stop-color="#f0b35a"/></linearGradient></defs>
  <rect width="1600" height="1000" fill="url(#a)"/><circle cx="1270" cy="220" r="115" fill="#ffe7a7"/>
  <path d="M0 570C180 420 350 430 500 575C700 390 880 420 1050 590C1240 450 1410 480 1600 590V1000H0Z" fill="#174f43"/>
  <path d="M0 690C280 610 490 760 760 650C1030 540 1260 730 1600 620V1000H0Z" fill="#0a5870"/>
  <rect x="100" y="710" width="850" height="190" rx="32" fill="#041f2b" opacity=".82"/>
  <text x="150" y="790" font-family="Arial" font-size="66" font-weight="700" fill="white">${title}</text>
  <text x="150" y="850" font-family="Arial" font-size="34" fill="#dff7fa">${islandLabel} · VI Guide</text></svg>`;
}

const fixes = {
  "mongan-mongan": { id: "mongoose-junction", slug: "mongoose-junction", name: "Mongoose Junction" },
  "cruza-rum-distillery": { id: "cruzan-rum-distillery", slug: "cruzan-rum-distillery", name: "Cruzan Rum Distillery" },
};

const images = walk(path.join(publicDir, "images"))
  .filter((file) => !file.includes(`${path.sep}places${path.sep}fallbacks${path.sep}`));

let recovered = 0, fallbacks = 0, corrected = 0;
const report = [];

for (const row of rows) {
  if (fixes[row.slug]) {
    Object.assign(row, fixes[row.slug]);
    corrected++;
  }

  const current = path.join(publicDir, String(row.heroImage || "").replace(/^\/+/, ""));
  if (row.heroImage && fs.existsSync(current)) {
    report.push({ slug: row.slug, status: "existing", image: row.heroImage });
    continue;
  }

  const ranked = images.map((file) => ({ file, score: scoreCandidate(row, file) }))
    .filter((x) => x.score >= 6)
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  if (ranked.length) {
    const ext = path.extname(ranked[0].file).toLowerCase();
    const target = path.join(targetDir, `${row.slug}${ext}`);
    if (path.resolve(ranked[0].file) !== path.resolve(target)) fs.copyFileSync(ranked[0].file, target);
    row.heroImage = `/images/places/${row.slug}${ext}`;
    recovered++;
    report.push({ slug: row.slug, status: "recovered", score: ranked[0].score, source: path.relative(root, ranked[0].file), image: row.heroImage });
    continue;
  }

  const fileName = `${row.category || "default"}-${row.island || "usvi"}.svg`;
  const fallback = path.join(fallbackDir, fileName);
  if (!fs.existsSync(fallback)) fs.writeFileSync(fallback, fallbackSvg(row.category, row.island));
  row.heroImage = `/images/places/fallbacks/${fileName}`;
  fallbacks++;
  report.push({ slug: row.slug, status: "fallback", image: row.heroImage });
}

rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
fs.writeFileSync(catalogPath, JSON.stringify(rows, null, 2) + "\n");

const reportPath = path.join(root, "reports/place-image-repair.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), total: rows.length, recovered, fallbacks, corrected, records: report }, null, 2) + "\n");

console.log("Place image repair complete.");
console.log("Records:", rows.length);
console.log("Recovered existing assets:", recovered);
console.log("Assigned polished fallbacks:", fallbacks);
console.log("Corrected catalog typos:", corrected);
console.log("Report:", reportPath);
