import fs from "node:fs";
import path from "node:path";

type DictionaryEntry = {
  id?: string;
  name?: string;
  description?: string;
  aliases?: string[];
  coordinates?: unknown;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
};

const INPUT = path.join(process.cwd(), "src/data/vi-dictionary.json");
const BACKUP = path.join(process.cwd(), "src/data/vi-dictionary.pre-cleanup.json");

const GENERIC_NAMES = new Set([
  "bay",
  "point",
  "road",
  "estate",
  "hill",
  "mountain",
  "island",
  "cay",
  "key",
  "quarter",
  "place",
  "harbor",
  "harbour",
  "beach",
  "pond",
  "gut",
  "reef",
  "rock",
  "rocks",
  "shoal",
  "bank",
  "channel",
  "passage",
]);

const OCR_FRAGMENTS = new Set(["w", "e", "n", "s", "w.", "e.", "n.", "s."]);

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasCoordinates(entry: DictionaryEntry) {
  if (typeof entry.latitude === "number" && typeof entry.longitude === "number") return true;
  if (entry.coordinates && Array.isArray(entry.coordinates) && entry.coordinates.length > 0) return true;
  if (entry.coordinates && typeof entry.coordinates === "object") return true;
  return false;
}

function shouldRemove(entry: DictionaryEntry) {
  const name = String(entry.name ?? "").trim();
  const key = normalize(name);
  const description = String(entry.description ?? "").trim();
  const aliases = Array.isArray(entry.aliases) ? entry.aliases : [];

  if (!name) return "missing-name";
  if (OCR_FRAGMENTS.has(name.toLowerCase()) || OCR_FRAGMENTS.has(key)) return "ocr-direction-fragment";
  if (GENERIC_NAMES.has(key)) return "generic-geographic-label";
  if (name.length <= 2 && !hasCoordinates(entry)) return "too-short";
  if (description.length < 12 && aliases.length === 0 && !hasCoordinates(entry)) return "thin-record";

  return "";
}

const raw = JSON.parse(fs.readFileSync(INPUT, "utf8")) as DictionaryEntry[];

if (!Array.isArray(raw)) {
  throw new Error("vi-dictionary.json must be an array.");
}

if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(INPUT, BACKUP);
}

const removed: Record<string, number> = {};
const cleaned: DictionaryEntry[] = [];

for (const entry of raw) {
  const reason = shouldRemove(entry);
  if (reason) {
    removed[reason] = (removed[reason] || 0) + 1;
    continue;
  }
  cleaned.push(entry);
}

fs.writeFileSync(INPUT, `${JSON.stringify(cleaned, null, 2)}\n`);

console.log("Dictionary cleanup complete.");
console.log({
  before: raw.length,
  after: cleaned.length,
  removed: raw.length - cleaned.length,
  removedByReason: removed,
  backup: BACKUP,
});
