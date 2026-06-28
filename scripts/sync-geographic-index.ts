// scripts/sync-geographic-index.ts
import fs from "node:fs";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, limit, query } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

type Coordinates = { lat: number; lng: number };

type GeographicIndexItem = {
  id: string;
  name: string;
  island?: string;
  source: string;
  type?: string;
  category?: string;
  description?: string;
  coordinates?: Coordinates;
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  photoUrl?: string;
  image?: string;
  estateId?: string;
  estateName?: string;
  tags?: string[];
  searchText: string;
};

const USE_FIRESTORE = process.env.USE_FIRESTORE === "true";
const OUT_PATH = path.resolve("src/data/core/geographicIndex.ts");
const MIN_SAFE_TOTAL = Number(process.env.MIN_SAFE_TOTAL ?? 5000);

const FIREBASE_COLLECTIONS = [
  "areas",
  "beaches",
  "estates",
  "events",
  "ferry-terminals",
  "grocery",
  "historic_sites",
  "islands",
  "places",
  "restaurants-st-croix",
  "restaurants-st-john",
  "restaurants-st-thomas",
  "shopping",
  "transportation",
  "transit_routes",
];

const LOCAL_COLLECTIONS: Array<{ file: string; collection: string }> = [
  { file: "src/data/beaches.json", collection: "beaches" },
  { file: "src/data/events.json", collection: "events" },
  { file: "src/data/places.json", collection: "places" },
  { file: "generated/usvi-estates.json", collection: "estates" },
  { file: "generated/estate-history-enriched.json", collection: "estates" },
  { file: "public/data/estate-search-index.json", collection: "estates" },
];

const DICTIONARY_JSON_CANDIDATES = [
  "generated/geographic-dictionary.entries.normalized.json",
  "generated/geographic-dictionary.entries.json",
  "src/data/vi-dictionary.json",
  "src/data/vi-dictionary.valid-backup.json",
];

const REAL_CATEGORY_FALLBACKS: Record<string, string[]> = {
  beach: ["/images/beaches/IMG_2760.jpeg", "/images/beaches/IMG_2761.jpeg"],
  restaurant: ["/images/food/IMG_4306.jpeg", "/images/food/IMG_4307.jpeg"],
  shopping: ["/images/archive/charlotte-amalie-harbor-historic-maps.jpg"],
  historicSite: ["/images/historicSite/99-steps.jpg", "/images/historicSite/fort-christian.jpg"],
  event: ["/images/archive/charlotte-amalie-harbor-historic-maps.jpg"],
  estate: ["/images/estate/annas-retreat.svg", "/images/estate/bolongo.svg"],
  dictionary: ["/images/dictionary/coral-bay.svg", "/images/dictionary/wintberg.svg"],
  grocery: ["/images/food/IMG_4310.jpeg"],
  ferry: ["/images/archive/charlotte-amalie-harbor-historic-maps.jpg"],
  transportation: ["/images/archive/charlotte-amalie-harbor-historic-maps.jpg"],
  discovery: ["/images/archive/charlotte-amalie-harbor-historic-maps.jpg"],
};

const PLACEHOLDER_BY_SOURCE: Record<string, string> = {
  beach: "/images/placeholders/beach.jpg",
  restaurant: "/images/placeholders/restaurant.jpg",
  shopping: "/images/placeholders/shopping.jpg",
  historicSite: "/images/placeholders/historic-site.jpg",
  event: "/images/placeholders/event.jpg",
  estate: "/images/placeholders/estate.jpg",
  dictionary: "/images/placeholders/discovery.jpg",
  grocery: "/images/placeholders/shopping.jpg",
  ferry: "/images/placeholders/discovery.jpg",
  transportation: "/images/placeholders/discovery.jpg",
  places: "/images/placeholders/discovery.jpg",
  discovery: "/images/placeholders/discovery.jpg",
};

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value: unknown): string {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publicFileExists(publicUrl: string): boolean {
  return publicUrl.startsWith("/") && fs.existsSync(path.resolve("public", publicUrl.slice(1)));
}

function firstExisting(paths: string[]): string {
  return paths.find(publicFileExists) ?? "";
}

function cleanImagePath(value: unknown): string {
  const image = clean(value);
  if (!image) return "";
  return image.replace(/\.\.(jpg|jpeg|png|webp|svg)$/i, ".$1").replace(/([^:])\/{2,}/g, "$1/");
}

function readJson(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`Could not read ${filePath}:`, error);
    return null;
  }
}

function asArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.entries)) return raw.entries;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.nodes)) return raw.nodes;
  if (Array.isArray(raw?.features)) return raw.features.map((f: any) => ({ ...f.properties, geometry: f.geometry }));
  return [];
}

function normalizeIsland(value: unknown): string {
  const raw = clean(value).toLowerCase();
  if (!raw || ["unk", "unknown", "unknown island"].includes(raw)) return "";
  if (["stt", "st_thomas", "st. thomas", "saint thomas", "st thomas"].includes(raw)) return "st_thomas";
  if (["stj", "st_john", "st. john", "saint john", "st john"].includes(raw)) return "st_john";
  if (["stx", "st_croix", "st. croix", "saint croix", "st croix"].includes(raw)) return "st_croix";
  if (["wat", "water_island", "water island"].includes(raw)) return "water_island";
  return raw;
}

function pickIsland(data: any, collectionName = ""): string {
  const direct = normalizeIsland(data.island || data.islandCode || data.selectedIsland || data.locationIsland || data.location);
  if (direct) return direct;

  const islands = Array.isArray(data.islands) ? data.islands.map(normalizeIsland).filter(Boolean) : [];
  if (islands.length === 1) return islands[0];

  if (collectionName.includes("st-thomas")) return "st_thomas";
  if (collectionName.includes("st-john")) return "st_john";
  if (collectionName.includes("st-croix")) return "st_croix";
  return "";
}

function pickName(data: any, fallback: string): string {
  const currentName = clean(data.name);
  const rawEstateName = clean(data.raw?.ESTATE || data.ESTATE || data.estate_name || data.ESTATENAME);

  if (currentName && currentName.toLowerCase() !== "unknown estate") return currentName;

  return clean(
    rawEstateName ||
      data.estateName ||
      data.estate ||
      data.title ||
      data.siteName ||
      data.label ||
      data.fullName ||
      data.baseName ||
      data.address ||
      data.ADDRESS ||
      fallback,
  );
}

function pickDescription(data: any): string {
  return clean(data.description || data.summary || data.notes || data.text || data.dictionaryDescription || data.history || "");
}

function pickCoordinates(data: any): Coordinates | undefined {
  const coordinates = data.coordinates || data.location || data.centroid || {};
  const lat = [data.lat, data.latitude, coordinates.lat, coordinates.latitude].map(Number).find(Number.isFinite);
  const lng = [data.lng, data.lon, data.longitude, coordinates.lng, coordinates.lon, coordinates.longitude].map(Number).find(Number.isFinite);

  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };

  if (data.geometry?.type === "Point" && Array.isArray(data.geometry.coordinates)) {
    const [x, y] = data.geometry.coordinates.map(Number);
    if (Number.isFinite(y) && Number.isFinite(x)) return { lat: y, lng: x };
  }

  return undefined;
}

function sourceName(collectionName: string): string {
  if (collectionName === "estates") return "estate";
  if (collectionName === "beaches") return "beach";
  if (collectionName === "events") return "event";
  if (collectionName === "historic_sites") return "historicSite";
  if (collectionName === "ferry-terminals") return "ferry";
  if (collectionName.startsWith("restaurants")) return "restaurant";
  if (collectionName === "transit_routes") return "transit";
  return collectionName.replace(/-/g, "_");
}

function getImageFallbackKey(source: string, type = "", category = ""): string {
  const key = `${source} ${type} ${category}`.toLowerCase();
  if (key.includes("beach")) return "beach";
  if (key.includes("restaurant") || key.includes("dining")) return "restaurant";
  if (key.includes("shopping")) return "shopping";
  if (key.includes("historic")) return "historicSite";
  if (key.includes("event")) return "event";
  if (key.includes("estate")) return "estate";
  if (key.includes("dictionary")) return "dictionary";
  if (key.includes("grocery") || key.includes("provisioning")) return "grocery";
  if (key.includes("ferry")) return "ferry";
  return source || "discovery";
}

function pickImage(data: any, source = "", type = "", category = ""): string {
  const explicit = cleanImagePath(data.coverImage || data.imageUrl || data.thumbnailUrl || data.photoUrl || data.image || "");
  if (explicit && publicFileExists(explicit)) return explicit;

  const name = pickName(data, data.id || data.slug || "");
  const slugs = Array.from(new Set([data.id, data.entryId, data.slug, name].map(slugify).filter(Boolean)));

  const slugCandidates = slugs.flatMap((slug) => [
    `/images/historicSite/${slug}.jpg`,
    `/images/historicSite/${slug}.jpeg`,
    `/images/archive/${slug}.jpg`,
    `/images/places/st-thomas/${slug}-1.jpg`,
    `/images/places/st-john/${slug}-1.jpg`,
    `/images/places/st-croix/${slug}-1.jpg`,
    `/images/places/st-thomas/${slug}.jpg`,
    `/images/places/st-john/${slug}.jpg`,
    `/images/places/st-croix/${slug}.jpg`,
    `/images/beaches/${slug}.jpg`,
    `/images/beaches/${slug}.jpeg`,
    `/images/food/${slug}.jpg`,
    `/images/food/${slug}.jpeg`,
    `/images/estate/${slug}.jpg`,
    `/images/estate/${slug}.jpeg`,
    `/images/estate/${slug}.png`,
    `/images/estate/${slug}.webp`,
    `/images/estate/${slug}.svg`,
    `/images/dictionary/${slug}.jpg`,
    `/images/dictionary/${slug}.jpeg`,
    `/images/dictionary/${slug}.png`,
    `/images/dictionary/${slug}.webp`,
    `/images/dictionary/${slug}.svg`,
  ]);

  const matched = firstExisting(slugCandidates);
  if (matched) return matched;

  const fallbackKey = getImageFallbackKey(source, type, category);
  return (
    firstExisting(REAL_CATEGORY_FALLBACKS[fallbackKey] ?? []) ||
    (publicFileExists(PLACEHOLDER_BY_SOURCE[fallbackKey]) ? PLACEHOLDER_BY_SOURCE[fallbackKey] : "")
  );
}

function isBadDictionaryEntry(id: string, name: string, description: string): boolean {
  const combined = `${id} ${name} ${description}`.toLowerCase();

  return (
    [
      "supplementary list",
      "transmitt",
      "advisory boar",
      "dispatching secretary",
      "naval government",
      "bibliography",
      "pillsbury",
      "geodetic survey",
      "appendices",
      "biographical sketch",
      "areas of the virgin islands",
    ].some((text) => combined.includes(text)) || description.length > 2500
  );
}

function buildSearchText(item: Omit<GeographicIndexItem, "searchText">): string {
  return [
    item.id,
    item.name,
    item.island,
    item.source,
    item.type,
    item.category,
    item.description,
    item.estateId,
    item.estateName,
    ...(item.tags ?? []),
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function withImageAliases<T extends Omit<GeographicIndexItem, "searchText">>(item: T, imageUrl: string): T {
  const image = imageUrl || undefined;
  return { ...item, imageUrl: image, coverImage: image, thumbnailUrl: image, photoUrl: image, image };
}

function normalizeItem(collectionName: string, id: string, data: any): GeographicIndexItem {
  const source = sourceName(collectionName);
  const name = pickName(data, id);
  const description = pickDescription(data);
  const island = pickIsland(data, collectionName);
  const category = clean(data.category || data.kind || source);
  const type = clean(data.type || data.placeType || category);
  const estateId = clean(data.estateId || data.geoid || data.estateGeoId || data.GEOID || id);
  const estateName = clean(data.estateName || data.estate || data.raw?.ESTATE || data.ESTATE || name);
  const coordinates = pickCoordinates(data);
  const imageUrl = pickImage({ ...data, id, name }, source, type, category);

  const tags = [
    ...(Array.isArray(data.tags) ? data.tags : []),
    category,
    type,
    source,
    island,
    estateName,
  ].map(clean).filter(Boolean);

  const baseItem: Omit<GeographicIndexItem, "searchText"> = {
    id,
    name,
    island: island || undefined,
    source,
    type: type || undefined,
    category: category || undefined,
    description: description || undefined,
    coordinates,
    estateId: estateId || undefined,
    estateName: estateName || undefined,
    tags: Array.from(new Set(tags)),
  };

  const item = withImageAliases(baseItem, imageUrl);
  return { ...item, searchText: buildSearchText(item) };
}

function normalizeDictionaryEntry(data: any, index: number): GeographicIndexItem | null {
  const id = clean(data.id || data.entryId || data.slug || `dictionary-${index + 1}`);
  const name = pickName(data, id);
  if (!name || name === "Untitled") return null;

  const description = pickDescription(data);
  if (isBadDictionaryEntry(id, name, description)) return null;

  const island = pickIsland(data);
  const type = clean(data.type || data.featureType || data.classification || "dictionary");
  const category = clean(data.category || "Geographic Dictionary");
  const coordinates = pickCoordinates(data);
  const imageUrl = pickImage({ ...data, id, name }, "dictionary", type, category);

  const tags = [
    ...(Array.isArray(data.tags) ? data.tags : []),
    "dictionary",
    "geographic dictionary",
    island,
    type,
    category,
  ].map(clean).filter(Boolean);

  const baseItem: Omit<GeographicIndexItem, "searchText"> = {
    id,
    name,
    island: island || undefined,
    source: "dictionary",
    type: type || undefined,
    category,
    description: description || undefined,
    coordinates,
    tags: Array.from(new Set(tags)),
  };

  const item = withImageAliases(baseItem, imageUrl);
  return { ...item, searchText: buildSearchText(item) };
}

function loadDictionaryItems(): GeographicIndexItem[] {
  const byKey = new Map<string, GeographicIndexItem>();

  for (const filePath of DICTIONARY_JSON_CANDIDATES) {
    const entries = asArray(readJson(filePath));
    if (!entries.length) continue;

    let accepted = 0;
    let rejected = 0;

    for (const [index, entry] of entries.entries()) {
      const item = normalizeDictionaryEntry(entry, index);
      if (!item) {
        rejected += 1;
        continue;
      }

      byKey.set(`${item.source}:${item.id}`, item);
      accepted += 1;
    }

    console.log(`${filePath}: ${entries.length} read, ${accepted} accepted, ${rejected} rejected`);
  }

  return Array.from(byKey.values());
}

function loadLocalItems(): GeographicIndexItem[] {
  const all: GeographicIndexItem[] = [];

  for (const { file, collection } of LOCAL_COLLECTIONS) {
    const entries = asArray(readJson(file));
    if (!entries.length) {
      console.log(`${file}: 0 local items`);
      continue;
    }

    const items = entries
      .map((entry, index) => {
        const id = clean(entry.id || entry.geoid || entry.GEOID || entry.slug || `${collection}-${index + 1}`);
        return normalizeItem(collection, id, entry);
      })
      .filter((item) => item.name && item.name !== "Unknown Estate");

    console.log(`${file}: ${items.length} local ${sourceName(collection)} items`);
    all.push(...items);
  }

  return all;
}

async function loadFirebaseItems(): Promise<GeographicIndexItem[]> {
  if (!USE_FIRESTORE) {
    console.log("Firestore: skipped. Use USE_FIRESTORE=true to read live collections.");
    return [];
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  const all: GeographicIndexItem[] = [];

  for (const name of FIREBASE_COLLECTIONS) {
    try {
      const snap = await getDocs(query(collection(db, name), limit(10000)));
      const items = snap.docs.map((docSnap) => normalizeItem(name, docSnap.id, docSnap.data()));
      console.log(`${name}: ${items.length}`);
      all.push(...items);
    } catch (error) {
      console.warn(`Skipped ${name}:`, error);
    }
  }

  return all;
}

function getExistingGeneratedTotal(): number {
  if (!fs.existsSync(OUT_PATH)) return 0;

  const text = fs.readFileSync(OUT_PATH, "utf8");
  const match = text.match(/total:\s*geographicIndexItems\.length/);
  if (!match) return 0;

  const jsonMatch = text.match(/JSON\.parse\((["'`])([\s\S]*?)\1\)/);
  if (!jsonMatch) return 0;

  try {
    return JSON.parse(JSON.parse(jsonMatch[1] + jsonMatch[2] + jsonMatch[1])).length;
  } catch {
    return 0;
  }
}

function buildGeneratedFile(items: GeographicIndexItem[]): string {
  const json = JSON.stringify(items);

  return `// AUTO-GENERATED FILE.
// Generated by scripts/sync-geographic-index.ts
// Do not edit this file by hand.

export type GeographicIndexSource = string;

export type GeographicIndexItem = {
  id: string;
  name: string;
  island?: string;
  source: GeographicIndexSource;
  type?: string;
  category?: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  coverImage?: string;
  thumbnailUrl?: string;
  photoUrl?: string;
  image?: string;
  estateId?: string;
  estateName?: string;
  tags?: string[];
  searchText: string;
};

export const geographicIndexItems = JSON.parse(${JSON.stringify(json)}) as GeographicIndexItem[];

export const geographicIndex = {
  items: geographicIndexItems,
  stats: {
    total: geographicIndexItems.length,
    dictionary: geographicIndexItems.filter((item) => item.source === "dictionary").length,
    estates: geographicIndexItems.filter((item) => item.source === "estate").length,
    historicSites: geographicIndexItems.filter((item) => item.source === "historicSite").length,
    restaurants: geographicIndexItems.filter((item) => item.source === "restaurant").length,
  },
};
`;
}

async function main() {
  console.log("Project:", firebaseConfig.projectId);
  console.log("Database:", firebaseConfig.firestoreDatabaseId);
  console.log("Mode:", USE_FIRESTORE ? "local + Firestore" : "local only");
  console.log("");

  const dictionaryItems = loadDictionaryItems();
  console.log(`dictionary merged: ${dictionaryItems.length}`);
  console.log("");

  const localItems = loadLocalItems();
  console.log(`local merged: ${localItems.length}`);
  console.log("");

  const firebaseItems = await loadFirebaseItems();

  const merged = Array.from(
    new Map(
      [...dictionaryItems, ...localItems, ...firebaseItems].map((item) => [`${item.source}:${item.id}`, item]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const existingTotal = getExistingGeneratedTotal();

  if (existingTotal >= MIN_SAFE_TOTAL && merged.length < existingTotal * 0.8) {
    console.error("");
    console.error(`Refusing to overwrite ${OUT_PATH}.`);
    console.error(`Existing index appears larger: ${existingTotal}`);
    console.error(`New index appears smaller: ${merged.length}`);
    console.error("This protects the app from quota failures or missing local files.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, buildGeneratedFile(merged));

  console.log("");
  console.log("Wrote:", OUT_PATH);
  console.log("Dictionary items:", dictionaryItems.length);
  console.log("Local items:", localItems.length);
  console.log("Firebase items:", firebaseItems.length);
  console.log("Total indexed:", merged.length);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});