import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

type RawHistoricImage = {
  siteSlug?: string;
  slug?: string;
  siteName?: string;
  name?: string;
  title?: string;
  island?: string;
  category?: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  image?: string;
  featured?: boolean;
  tags?: string[];
  caption?: string;
  locationLabel?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

type HistoricCategory =
  | "fort"
  | "ruin"
  | "district"
  | "monument"
  | "museum"
  | "estate"
  | "church"
  | "landmark"
  | "garden"
  | "battery"
  | "site";

type HistoricSiteDoc = {
  slug: string;
  name: string;
  island: "STT" | "STJ" | "STX";
  category: HistoricCategory;
  description: string;
  shortDescription: string;
  featured: boolean;
  tags: string[];
  imageUrl: string;
  imageCount: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  locationLabel?: string;
  sourceImageIds: string[];
  createdAt: string;
  updatedAt: string;
};

function initAdmin() {
  if (getApps().length > 0) return;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    projectId:
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      "usvi-db1e4",
  });
}

function cleanString(value?: string): string {
  return (value || "").trim();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function getBestImageUrl(doc: RawHistoricImage): string {
  return cleanString(doc.imageUrl) || cleanString(doc.image) || "";
}

function getLat(doc: RawHistoricImage): number | undefined {
  return doc.lat ?? doc.latitude ?? doc.coordinates?.lat;
}

function getLng(doc: RawHistoricImage): number | undefined {
  return doc.lng ?? doc.longitude ?? doc.coordinates?.lng;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeHistoricKey(value: string): string {
  const specialWordMap: Record<string, string> = {
    nhs: "NHS",
    st: "St.",
    usvi: "USVI",
  };

  const exactNameMap: Record<string, string> = {
    "99_steps": "99 Steps",
    blackbeards_castle_skytsborg: "Blackbeard's Castle (Skytsborg)",
    bluebeards_castle_tower: "Bluebeard's Castle Tower",
    christiansted_nhs_custom_house: "Christiansted NHS Custom House",
    christiansted_nhs_fort_christiansvaern:
      "Christiansted NHS Fort Christiansvaern",
    christiansted_nhs_scale_house: "Christiansted NHS Scale House",
    christiansted_nhs_steeple_building: "Christiansted NHS Steeple Building",
    fort_christian: "Fort Christian",
    fort_frederik: "Fort Frederik",
    gov_house_christiansted: "Government House, Christiansted",
    government_house_stt: "Government House, St. Thomas",
    market_square_pladsen: "Market Square (Pladsen)",
    reformed_dutch_church_stt: "Reformed Dutch Church, St. Thomas",
    salt_river_bay_nhp: "Salt River Bay National Historical Park",
    st_george_village_botanical_garden: "St. George Village Botanical Garden",
    synagogue_beracha_veshalom: "Beracha Veshalom Synagogue",
  };

  const normalized = value.trim().toLowerCase();

  if (exactNameMap[normalized]) {
    return exactNameMap[normalized];
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => {
      if (specialWordMap[part]) {
        return specialWordMap[part];
      }

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function stripExtension(value: string): string {
  return value.replace(/\.[^.]+$/i, "");
}

function parseFromDocId(docId: string) {
  const base = stripExtension(docId);

  const segments = base
    .split("__")
    .map((part) => part.trim())
    .filter(Boolean);

  const canonicalKey = segments[0] || base;

  return {
    rawKey: canonicalKey,
    slug: slugify(canonicalKey.replace(/_/g, "-")),
    name: humanizeHistoricKey(canonicalKey),
  };
}

function inferIsland(input: {
  rawKey: string;
  name: string;
  explicit?: string;
}): "STT" | "STJ" | "STX" {
  const explicit = (input.explicit || "").trim().toLowerCase();
  if (["stt", "st. thomas", "st thomas", "saint thomas"].includes(explicit)) {
    return "STT";
  }
  if (["stj", "st. john", "st john", "saint john"].includes(explicit)) {
    return "STJ";
  }
  if (["stx", "st. croix", "st croix", "saint croix"].includes(explicit)) {
    return "STX";
  }

  const key = `${input.rawKey} ${input.name}`.toLowerCase();

  if (
    key.includes("christiansted") ||
    key.includes("frederik") ||
    key.includes("salt_river") ||
    key.includes("salt river") ||
    key.includes("little_princess") ||
    key.includes("little princess") ||
    key.includes("whim") ||
    key.includes("st_george") ||
    key.includes("st george")
  ) {
    return "STX";
  }

  if (
    key.includes("annaberg") ||
    key.includes("cinnamon_bay") ||
    key.includes("cinnamon bay") ||
    key.includes("cruz_bay") ||
    key.includes("cruz bay") ||
    key.includes("reef_bay") ||
    key.includes("reef bay") ||
    key.includes("peace_hill") ||
    key.includes("peace hill") ||
    key.includes("susannaberg") ||
    key.includes("fortsberg")
  ) {
    return "STJ";
  }

  return "STT";
}

function inferCategory(input: {
  rawKey: string;
  name: string;
  explicit?: string;
}): HistoricCategory {
  const explicit = (input.explicit || "").trim().toLowerCase();
  if (explicit) {
    if (explicit.includes("fort")) return "fort";
    if (explicit.includes("ruin")) return "ruin";
    if (explicit.includes("district")) return "district";
    if (explicit.includes("monument")) return "monument";
    if (explicit.includes("museum")) return "museum";
    if (explicit.includes("estate")) return "estate";
    if (explicit.includes("church")) return "church";
    if (explicit.includes("garden")) return "garden";
    if (explicit.includes("battery")) return "battery";
    if (explicit.includes("landmark")) return "landmark";
  }

  const key = `${input.rawKey} ${input.name}`.toLowerCase();

  if (key.includes("fort")) return "fort";
  if (
    key.includes("ruin") ||
    key.includes("sugar_works") ||
    key.includes("sugar_factory") ||
    key.includes("sugar_mill")
  )
    return "ruin";
  if (key.includes("district")) return "district";
  if (key.includes("garden")) return "garden";
  if (key.includes("battery")) return "battery";
  if (key.includes("museum")) return "museum";
  if (key.includes("estate")) return "estate";
  if (key.includes("church") || key.includes("synagogue")) return "church";
  if (key.includes("castle")) return "landmark";

  return "site";
}

function inferDescription(
  name: string,
  category: HistoricCategory,
  island: "STT" | "STJ" | "STX"
) {
  const islandLabel =
    island === "STT"
      ? "St. Thomas"
      : island === "STJ"
      ? "St. John"
      : "St. Croix";

  switch (category) {
    case "fort":
      return `${name} is a historic fort site in ${islandLabel}, U.S. Virgin Islands.`;
    case "ruin":
      return `${name} is a historic ruin and heritage site in ${islandLabel}, U.S. Virgin Islands.`;
    case "district":
      return `${name} is a historic district in ${islandLabel}, U.S. Virgin Islands.`;
    case "church":
      return `${name} is a historic religious landmark in ${islandLabel}, U.S. Virgin Islands.`;
    case "estate":
      return `${name} is a historic estate site in ${islandLabel}, U.S. Virgin Islands.`;
    case "garden":
      return `${name} is a historic garden and cultural site in ${islandLabel}, U.S. Virgin Islands.`;
    case "battery":
      return `${name} is a historic military battery site in ${islandLabel}, U.S. Virgin Islands.`;
    default:
      return `${name} is a historic site in ${islandLabel}, U.S. Virgin Islands.`;
  }
}

async function main() {
  initAdmin();

  const db = getFirestore();
  const sourceSnap = await db.collection("historic_site_images").get();
  const grouped = new Map<string, HistoricSiteDoc>();

  for (const docSnap of sourceSnap.docs) {
    const raw = docSnap.data() as RawHistoricImage;

    const parsed = parseFromDocId(docSnap.id);

    const name =
      cleanString(raw.siteName) ||
      cleanString(raw.name) ||
      cleanString(raw.title) ||
      parsed.name;

    const slug =
      cleanString(raw.siteSlug) || cleanString(raw.slug) || parsed.slug;

    if (!name || !slug) {
      console.warn(
        "Skipping document with no usable site identity:",
        docSnap.id
      );
      continue;
    }

    const island = inferIsland({
      rawKey: parsed.rawKey,
      name,
      explicit: raw.island,
    });

    const category = inferCategory({
      rawKey: parsed.rawKey,
      name,
      explicit: raw.category,
    });

    const imageUrl = getBestImageUrl(raw);
    const description =
      cleanString(raw.description) || inferDescription(name, category, island);
    const shortDescription =
      cleanString(raw.shortDescription) || description.slice(0, 140);

    const baseTags = [category, island, "historic", "usvi"];

    const rawTags = Array.isArray(raw.tags) ? raw.tags : [];
    const tags = uniqueStrings(baseTags.concat(rawTags));

    const lat = getLat(raw);
    const lng = getLng(raw);
    const locationLabel = cleanString(raw.locationLabel) || undefined;
    const createdAt = cleanString(raw.createdAt) || new Date().toISOString();
    const updatedAt = cleanString(raw.updatedAt) || new Date().toISOString();

    const existing = grouped.get(slug);

    if (!existing) {
      const site: HistoricSiteDoc = {
        slug,
        name,
        island,
        category,
        description,
        shortDescription,
        featured: Boolean(raw.featured),
        tags,
        imageUrl,
        imageCount: imageUrl ? 1 : 0,
        sourceImageIds: [docSnap.id],
        createdAt,
        updatedAt,
      };

      if (typeof lat === "number" && typeof lng === "number") {
        site.coordinates = { lat, lng };
      }

      if (locationLabel) {
        site.locationLabel = locationLabel;
      }

      grouped.set(slug, site);
      continue;
    }

    existing.featured = existing.featured || Boolean(raw.featured);
    existing.tags = uniqueStrings(existing.tags.concat(tags));
    existing.sourceImageIds.push(docSnap.id);
    existing.imageCount += imageUrl ? 1 : 0;

    if (!existing.imageUrl && imageUrl) {
      existing.imageUrl = imageUrl;
    }

    if (
      !existing.coordinates &&
      typeof lat === "number" &&
      typeof lng === "number"
    ) {
      existing.coordinates = { lat, lng };
    }

    if (!existing.locationLabel && locationLabel) {
      existing.locationLabel = locationLabel;
    }

    existing.updatedAt = updatedAt;
  }

  const existingPath = path.resolve(
    process.cwd(),
    "data/travel-knowledge/historic-sites.json"
  );

  let existingRecords: Array<Record<string, unknown>> = [];

  if (fs.existsSync(existingPath)) {
    const parsed = JSON.parse(fs.readFileSync(existingPath, "utf8"));
    existingRecords = Array.isArray(parsed) ? parsed : [];
  }

  const generatedRecords = Array.from(grouped.values()).map((site) => ({
    id: site.slug,
    slug: site.slug,
    name: site.name,
    island: site.island.toLowerCase(),
    category: site.category,
    description: site.description,
    shortDescription: site.shortDescription,
    heroImage: site.imageUrl || "/images/historic/placeholder.svg",
    images: site.imageUrl ? [site.imageUrl] : [],
    tags: site.tags,
    featured: site.featured,
    location: site.locationLabel,
    coordinates: site.coordinates,
    imageCount: site.imageCount,
    sourceImageIds: site.sourceImageIds,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
  }));

  const merged = new Map<string, Record<string, unknown>>();

  for (const record of generatedRecords) {
    merged.set(String(record.slug), record);
  }

  // Curated local records win when they contain richer app-facing content.
  for (const record of existingRecords) {
    const slug = String(record.slug || record.id || "");
    if (!slug) continue;

    const generated = merged.get(slug) || {};

    merged.set(slug, {
      ...generated,
      ...record,
      id: record.id || generated.id || slug,
      slug,
      heroImage:
        record.heroImage ||
        generated.heroImage ||
        "/images/historic/placeholder.svg",
      tags: Array.from(
        new Set([
          ...(Array.isArray(generated.tags) ? generated.tags : []),
          ...(Array.isArray(record.tags) ? record.tags : []),
        ])
      ),
    });
  }

  const records = Array.from(merged.values()).sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""))
  );

  fs.mkdirSync(path.dirname(existingPath), { recursive: true });
  fs.writeFileSync(
    existingPath,
    JSON.stringify(records, null, 2) + "\n"
  );

  console.log(
    "Exported historic sites:",
    records.length,
    "generated from images:",
    generatedRecords.length
  );
  console.log("Output:", existingPath);
}

main().catch((error) => {
  console.error("Historic export failed:", error);
  process.exit(1);
});
