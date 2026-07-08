import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith("#") || !clean.includes("=")) continue;

    const index = clean.indexOf("=");
    const key = clean.slice(0, index).trim();
    let value = clean.slice(index + 1).trim();

    value = value.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

for (const file of [".env.local", ".env", ".env.firestore"]) {
  loadEnvFile(path.join(rootDir, file));
}

function readJson(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function cleanText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toTags(value, record) {
  const tags = [];

  if (Array.isArray(value)) {
    for (const item of value) {
      const tag = cleanText(item);
      if (tag) tags.push(tag);
    }
  } else if (typeof value === "string") {
    for (const item of value.split(",")) {
      const tag = cleanText(item);
      if (tag) tags.push(tag);
    }
  }

  for (const key of ["cuisine", "subcategory", "type", "vibe"]) {
    const tag = cleanText(record[key]);
    if (tag) tags.push(tag);
  }

  return Array.from(new Set(tags)).slice(0, 12);
}

function islandImageFolder(islandCode) {
  return islandCode.replace(/_/g, "-");
}

function normalizeRestaurant(record, islandCode, sourceFile, index) {
  const title =
    cleanText(record.title) ||
    cleanText(record.name) ||
    cleanText(record.restaurantName) ||
    `Restaurant ${index + 1}`;

  const slug = cleanText(record.slug) || slugify(title);
  const id =
    cleanText(record.id) ||
    cleanText(record.placeId) ||
    `${islandCode}__restaurant__${slug || index}`;

  const folder = islandImageFolder(islandCode);
  const fallbackImage = `/images/places/${folder}/${slug}-1.jpg`;

  const coverImage =
    cleanText(record.coverImage) ||
    cleanText(record.image) ||
    cleanText(record.imageUrl) ||
    cleanText(record.photoUrl) ||
    cleanText(record.thumbnail) ||
    fallbackImage;

  const description =
    cleanText(record.description) ||
    cleanText(record.shortDescription) ||
    cleanText(record.summary) ||
    `A local dining option in the U.S. Virgin Islands.`;

  const shortDescription =
    cleanText(record.shortDescription) ||
    description.slice(0, 220);

  const lat =
    toNumber(record.lat) ??
    toNumber(record.latitude) ??
    toNumber(record.location?.lat);

  const lng =
    toNumber(record.lng) ??
    toNumber(record.longitude) ??
    toNumber(record.location?.lng);

  return {
    id,
    title,
    name: cleanText(record.name, title),
    slug,
    islandCode,
    island: islandCode,
    category: "restaurant",
    type: "restaurant",
    status: cleanText(record.status, "published"),
    source: "restaurants-json",
    sourceFile,
    coverImage,
    image: coverImage,
    images: Array.isArray(record.images) ? record.images : [coverImage],
    description,
    shortDescription,
    areaSlug:
      cleanText(record.areaSlug) ||
      cleanText(record.neighborhood) ||
      cleanText(record.area) ||
      islandCode,
    neighborhood:
      cleanText(record.neighborhood) ||
      cleanText(record.area) ||
      cleanText(record.areaSlug),
    address: cleanText(record.address),
    phone: cleanText(record.phone),
    website: cleanText(record.website) || cleanText(record.url),
    priceTier: cleanText(record.priceTier) || cleanText(record.price),
    rating: toNumber(record.rating),
    reviewCount: toNumber(record.reviewCount) ?? toNumber(record.reviews),
    tags: toTags(record.tags, record),
    cuisine: cleanText(record.cuisine),
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    searchableText: [
      title,
      description,
      shortDescription,
      record.areaSlug,
      record.neighborhood,
      record.address,
      record.cuisine,
      ...(Array.isArray(record.tags) ? record.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
    updatedAtIso: new Date().toISOString(),
  };
}

const files = [
  {
    islandCode: "st_thomas",
    sourceFile: "src/data/restaurants-st-thomas.json",
  },
  {
    islandCode: "st_john",
    sourceFile: "src/data/restaurants-st-john.json",
  },
  {
    islandCode: "st_croix",
    sourceFile: "src/data/restaurants-st-croix.json",
  },
  {
    islandCode: "water_island",
    sourceFile: "src/data/restaurants-water-island.json",
  },
];

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const dryRun = args.has("--dry-run") || !write;
const onlyIslandArg = process.argv.find((arg) => arg.startsWith("--island="));
const onlyIsland = onlyIslandArg ? onlyIslandArg.split("=")[1] : "";

const restaurants = [];

for (const file of files) {
  if (onlyIsland && file.islandCode !== onlyIsland) continue;

  const data = readJson(file.sourceFile);

  if (!Array.isArray(data)) {
    throw new Error(`${file.sourceFile} must contain a JSON array.`);
  }

  data.forEach((record, index) => {
    restaurants.push(
      normalizeRestaurant(record, file.islandCode, file.sourceFile, index)
    );
  });
}

const counts = restaurants.reduce((acc, item) => {
  acc[item.islandCode] = (acc[item.islandCode] || 0) + 1;
  return acc;
}, {});

console.log("Restaurant seed summary:");
console.table(counts);
console.log(`Total restaurants: ${restaurants.length}`);

if (dryRun) {
  console.log("\nDry run only. No Firestore writes were made.");
  console.log("Run with --write to seed Firestore.");
  console.log("\nSample document:");
  console.log(JSON.stringify(restaurants[0], null, 2));
  process.exit(0);
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
    );
  }

  const explicitPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(rootDir, ".secrets/usvi-news-service-account.json");

  if (fs.existsSync(explicitPath)) {
    return JSON.parse(fs.readFileSync(explicitPath, "utf8"));
  }

  return null;
}

const functionsRequire = createRequire(
  path.join(rootDir, "functions/package.json")
);

const {
  initializeApp,
  cert,
  applicationDefault,
  getApps,
} = functionsRequire("firebase-admin/app");

const {
  getFirestore,
  FieldValue,
} = functionsRequire("firebase-admin/firestore");

const serviceAccount = getServiceAccount();

if (!getApps().length) {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.VITE_FIREBASE_PROJECT_ID || "usvi-news",
    });
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "usvi-news",
    });
  }
}

const db = getFirestore();

async function commitBatch(items) {
  let batch = db.batch();
  let pending = 0;
  let written = 0;

  for (const item of items) {
    const ref = db.collection("places").doc(item.id);

    batch.set(
      ref,
      {
        ...item,
        updatedAt: FieldValue.serverTimestamp(),
        seededAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    pending += 1;

    if (pending >= 450) {
      await batch.commit();
      written += pending;
      console.log(`Committed ${written}/${items.length}`);
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending) {
    await batch.commit();
    written += pending;
    console.log(`Committed ${written}/${items.length}`);
  }
}

await commitBatch(restaurants);

console.log(`Done. Seeded ${restaurants.length} restaurants into Firestore collection: places`);
