import fs from "node:fs";
import path from "node:path";

import { getAdminDb } from "../lib/firebase-admin";

type DirectoryCollection = "beaches" | "places";
type JsonRecord = Record<string, unknown>;

type AuditRow = {
  collection: DirectoryCollection;
  id: string;
  name: string;
  island: string;
  category: string;
  currentImage: string;
  status: "missing" | "generic" | "broken-local" | "remote" | "valid-local";
  candidates: string[];
};

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const REPORT_ROOT = path.join(ROOT, "reports");
const GENERIC_IMAGES = new Set([
  "/images/magens-bay.jpg",
  "/images/usvi-harbor-hero.jpg",
]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstImage(data: JsonRecord) {
  const images = Array.isArray(data.images) ? data.images : [];
  return (
    clean(data.imageUrl) ||
    clean(data.image) ||
    clean(data.heroImage) ||
    clean(images[0])
  );
}

function walkFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(absolute) : [absolute];
  });
}

function publicPath(absolute: string) {
  return `/${path.relative(PUBLIC_ROOT, absolute).split(path.sep).join("/")}`;
}

function tokens(value: string) {
  const ignored = new Set([
    "the", "and", "beach", "bay", "st", "saint", "usvi", "virgin",
    "islands", "island", "place", "estate", "park", "national",
  ]);
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 2 && !ignored.has(token));
}

function candidateScore(name: string, file: string) {
  const wanted = new Set(tokens(name));
  if (!wanted.size) return 0;
  const available = new Set(tokens(file));
  let matches = 0;
  for (const token of wanted) if (available.has(token)) matches += 1;
  return matches / wanted.size;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  const localImages = walkFiles(path.join(PUBLIC_ROOT, "images"))
    .filter((file) => /\.(avif|gif|jpe?g|png|webp)$/i.test(file))
    .map(publicPath)
    .sort();

  const db = getAdminDb();
  const rows: AuditRow[] = [];

  for (const collectionName of ["beaches", "places"] as const) {
    const snapshot = await db.collection(collectionName).get();
    for (const document of snapshot.docs) {
      const data = document.data() as JsonRecord;
      const name = clean(data.name) || clean(data.title) || document.id;
      const currentImage = firstImage(data);
      const local = currentImage.startsWith("/");
      const generic = GENERIC_IMAGES.has(currentImage);
      const exists = local
        ? fs.existsSync(path.join(PUBLIC_ROOT, currentImage.replace(/^\//, "")))
        : false;
      const status: AuditRow["status"] = !currentImage
        ? "missing"
        : generic
          ? "generic"
          : local && !exists
            ? "broken-local"
            : local
              ? "valid-local"
              : "remote";

      const candidates = localImages
        .map((image) => ({ image, score: candidateScore(name, image) }))
        .filter((candidate) => candidate.score >= 0.5)
        .sort((a, b) => b.score - a.score || a.image.localeCompare(b.image))
        .slice(0, 5)
        .map((candidate) => candidate.image);

      rows.push({
        collection: collectionName,
        id: document.id,
        name,
        island: clean(data.island),
        category: clean(data.category) || clean(data.kind),
        currentImage,
        status,
        candidates,
      });
    }
  }

  rows.sort((a, b) =>
    a.collection.localeCompare(b.collection) || a.name.localeCompare(b.name),
  );
  const counts = rows.reduce<Record<string, number>>((result, row) => {
    result[row.status] = (result[row.status] ?? 0) + 1;
    return result;
  }, {});
  const needsReview = rows.filter((row) =>
    ["missing", "generic", "broken-local"].includes(row.status),
  );

  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalRecords: rows.length,
      localImages: localImages.length,
      needsReview: needsReview.length,
      byStatus: counts,
    },
    rows,
  };
  fs.writeFileSync(
    path.join(REPORT_ROOT, "directory-image-audit.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  const headers = [
    "collection", "id", "name", "island", "category", "status",
    "currentImage", "candidate1", "candidate2", "candidate3",
  ];
  const csvRows = needsReview.map((row) => [
    row.collection, row.id, row.name, row.island, row.category, row.status,
    row.currentImage, ...row.candidates.slice(0, 3),
  ]);
  fs.writeFileSync(
    path.join(REPORT_ROOT, "directory-images-missing.csv"),
    [headers, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n",
  );

  console.table({
    totalRecords: rows.length,
    localImages: localImages.length,
    needsReview: needsReview.length,
    ...counts,
  });
  console.log("Wrote reports/directory-image-audit.json");
  console.log("Wrote reports/directory-images-missing.csv");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
