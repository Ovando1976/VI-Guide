import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const EVENT_FILES = [
  "src/data/events.json",
  "public/data/events.json",
  "generated/events.json",
].filter((p) => fs.existsSync(path.join(ROOT, p)));

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function rowsFrom(data) {
  if (Array.isArray(data)) return data;
  return data.events ?? data.items ?? [];
}

function publicPathExists(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return false;
  const clean = publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
  return fs.existsSync(path.join(ROOT, "public", clean));
}

const report = [];

for (const file of EVENT_FILES) {
  const rows = rowsFrom(readJson(file));

  for (const event of rows) {
    const images = [
      event.coverImage,
      event.image,
      event.imageUrl,
      ...(Array.isArray(event.gallery) ? event.gallery : []),
      ...(Array.isArray(event.images) ? event.images : []),
    ].filter(Boolean);

    const uniqueImages = [...new Set(images)];

    report.push({
      sourceFile: file,
      id: event.id,
      title: event.title ?? event.name,
      category: event.category,
      images: uniqueImages,
      missing: uniqueImages.filter((img) => img.startsWith("/") && !publicPathExists(img)),
      found: uniqueImages.filter((img) => img.startsWith("/") && publicPathExists(img)),
    });
  }
}

const missing = report.filter((row) => row.missing.length);
const found = report.filter((row) => row.found.length);

fs.mkdirSync(path.join(ROOT, "generated"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "generated/event-image-audit.json"),
  JSON.stringify({ total: report.length, found: found.length, missing: missing.length, report }, null, 2)
);

console.log("Event image audit complete");
console.log({ total: report.length, found: found.length, missing: missing.length });
console.log("Wrote generated/event-image-audit.json");

for (const row of missing.slice(0, 40)) {
  console.log("MISSING:", row.title, row.missing.join(", "));
}
