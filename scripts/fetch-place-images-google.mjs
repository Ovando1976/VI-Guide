import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const API_KEY =
  process.env.GOOGLE_MAPS_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY)
  throw new Error(
    "Missing GOOGLE_MAPS_GEOCODING_API_KEY or GOOGLE_MAPS_API_KEY"
  );

const DRY = process.argv.includes("--dry-run");
const CSV = "reports/missing-place-images.csv";
const REPORT = "reports/google-place-images-report.json";

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const parts =
        line
          .match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
          ?.map((v) => v.replace(/^"|"$/g, "")) || [];
      return { title: parts[0], imagePath: parts[2] };
    })
    .filter((r) => r.title && r.imagePath);
}

function islandFromPath(p) {
  if (p.includes("/st-thomas/")) return "St. Thomas, USVI";
  if (p.includes("/st-john/")) return "St. John, USVI";
  if (p.includes("/st-croix/")) return "St. Croix, USVI";
  if (p.includes("/water-island/")) return "Water Island, USVI";
  return "USVI";
}

function normalizeName(value = "") {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isStrongMatch(wanted, found) {
  const a = normalizeName(wanted);
  const b = normalizeName(found);

  if (!a || !b) return false;
  if (a === b) return true;
  if (b.includes(a) || a.includes(b)) return true;

  const aWords = new Set(a.split(" ").filter((w) => w.length > 2));
  const bWords = new Set(b.split(" ").filter((w) => w.length > 2));
  const shared = [...aWords].filter((w) => bWords.has(w)).length;

  return shared >= Math.min(2, aWords.size);
}

async function searchPlace(row) {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.photos",
      },
      body: JSON.stringify({
        textQuery: `${row.title}, ${islandFromPath(row.imagePath)}`,
        regionCode: "VI",
        maxResultCount: 1,
      }),
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.places?.[0] || null;
}

async function downloadPhoto(photoName, outFile) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?key=${API_KEY}&maxWidthPx=1400&skipHttpRedirect=true`;
  const metaRes = await fetch(url);
  const meta = await metaRes.json();

  if (!metaRes.ok || !meta.photoUri) throw new Error(JSON.stringify(meta));

  const imgRes = await fetch(meta.photoUri);
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, Buffer.from(await imgRes.arrayBuffer()));
}

const rows = parseCsv(fs.readFileSync(CSV, "utf8"));
const report = [];

for (const row of rows) {
  try {
    console.log(`Fetching: ${row.title}`);
    const place = await searchPlace(row);
    const photo = place?.photos?.[0];

    const foundName = place?.displayName?.text || "";

    if (!isStrongMatch(row.title, foundName)) {
      console.log(`  Weak match rejected: ${foundName}`);
      report.push({ ...row, status: "weak_match", place });
      continue;
    }

    const outFile = row.imagePath.replace(/^\/images\//, "public/images/");

    if (DRY) {
      console.log(`  Match: ${place.displayName?.text || place.id}`);
      report.push({
        ...row,
        status: "dry_run_match",
        place,
        photoName: photo.name,
      });
    } else {
      await downloadPhoto(photo.name, outFile);
      console.log(`  Saved: ${outFile}`);
      report.push({
        ...row,
        status: "downloaded",
        place,
        photoName: photo.name,
        outFile,
      });
    }

    await new Promise((r) => setTimeout(r, 250));
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    report.push({ ...row, status: "error", error: err.message });
  }
}

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");

console.log(`\nReport written: ${REPORT}`);
console.log(
  `Downloaded: ${report.filter((r) => r.status === "downloaded").length}`
);
console.log(
  `Dry matches: ${report.filter((r) => r.status === "dry_run_match").length}`
);
console.log(
  `No photo: ${report.filter((r) => r.status === "no_photo").length}`
);
console.log(`Errors: ${report.filter((r) => r.status === "error").length}`);
