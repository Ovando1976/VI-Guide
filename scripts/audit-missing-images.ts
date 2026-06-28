import fs from "node:fs";
import path from "node:path";
import {
  geographicIndex,
  type GeographicIndexItem,
} from "../src/data/core/geographicIndex";

type MissingImageRow = {
  id: string;
  name: string;
  source: string;
  type: string;
  island: string;
  reason: string;
  suggestedFileName: string;
};

const ROOT = process.cwd();

const SOURCE_FOLDERS: Record<string, string> = {
  historicSite: "historicSite",
  estate: "estate",
  dictionary: "dictionary",
  archive: "archive",
  beach: "beaches",
  beaches: "beaches",
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicFileExists(imagePath?: string | null): boolean {
  if (!imagePath || typeof imagePath !== "string") return false;

  const normalized = imagePath
    .trim()
    .replace(/^\/+/, "")
    .replace(/^public\//, "");

  if (!normalized) return false;

  return fs.existsSync(path.join(ROOT, "public", normalized));
}

function getDeclaredImage(item: GeographicIndexItem): string | null {
  const loose = item as GeographicIndexItem & {
    image?: unknown;
    photoUrl?: unknown;
    thumbnailUrl?: unknown;
  };

  const value =
    loose.imageUrl ||
    loose.coverImage ||
    loose.image ||
    loose.photoUrl ||
    loose.thumbnailUrl;

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getFolder(source: string): string {
  return SOURCE_FOLDERS[source] || source || "unknown";
}


function makeSuggestedFileName(item: GeographicIndexItem): string {
  const source = String(item.source ?? "unknown");
  const folder = getFolder(source);
  const name = String(item.name ?? item.id ?? "missing-image");

  return `/images/${folder}/${slugify(name)}.jpg`;
}

function hasUsableImage(item: GeographicIndexItem, suggestedFileName: string): boolean {
  const declared = getDeclaredImage(item);
  const source = String(item.source ?? "");
  const name = String(item.name ?? item.id ?? "");

  return Boolean(
    publicFileExists(declared) ||
      publicFileExists(suggestedFileName) ||
      findExistingImage(item)
  );
}

function findExistingImage(item: GeographicIndexItem): string | null {
  const source = String(item.source ?? "");
  const folder = getFolder(source);

  const loose = item as GeographicIndexItem & {
    slug?: unknown;
    image?: unknown;
  };

  const slugs = [
    String(item.id ?? ""),
    String(loose.slug ?? ""),
    String(item.name ?? ""),
  ]
    .filter(Boolean)
    .map(slugify);

  const folders = Array.from(
    new Set([folder, source, "beaches", "beach", "historicSite", "estate"])
  ).filter(Boolean);

  for (const currentFolder of folders) {
    for (const slug of slugs) {
      for (const ext of IMAGE_EXTENSIONS) {
        const candidate = `/images/${currentFolder}/${slug}${ext}`;
        if (publicFileExists(candidate)) return candidate;
      }
    }
  }

  return null;
}

const items = geographicIndex.items as GeographicIndexItem[];

const missing: MissingImageRow[] = items
  .filter((item) => {
    const source = String(item.source ?? "");
    return ["estate", "beach", "beaches", "historicSite", "archive", "dictionary"].includes(
      source
    );
  })
  .flatMap((item) => {
    const suggestedFileName = makeSuggestedFileName(item);

    if (hasUsableImage(item, suggestedFileName)) return [];

    const source = String(item.source ?? "unknown");
    const name = String(item.name ?? item.id ?? "unknown");

    return [
      {
        id: String(item.id ?? slugify(name)),
        name,
        source,
        type: String(item.type ?? item.category ?? source),
        island: String(item.island ?? ""),
        reason: "No declared image field or matching file found in public/images",
        suggestedFileName,
      },
    ];
  });

const csvHeader: (keyof MissingImageRow)[] = [
  "id",
  "name",
  "source",
  "type",
  "island",
  "reason",
  "suggestedFileName",
];

const csv = [
  csvHeader.join(","),
  ...missing.map((row) =>
    csvHeader
      .map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`)
      .join(",")
  ),
].join("\n");

fs.writeFileSync("missing-images.json", JSON.stringify(missing, null, 2));
fs.writeFileSync("missing-images.csv", csv);

const bySource = missing.reduce<Record<string, number>>((acc, row) => {
  acc[row.source] = (acc[row.source] || 0) + 1;
  return acc;
}, {});

console.log("Missing image audit complete:");
console.log({
  missingImages: missing.length,
  json: "missing-images.json",
  csv: "missing-images.csv",
});
console.table(bySource);