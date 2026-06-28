import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../.secrets/firebase-admin.json";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

type Business = {
  name?: string;
  slug?: string;
  category?: string;
  island?: string;
  estate?: string;
  address?: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  website?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
};

const app = initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(app, "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671");

const ISLAND_BOXES: Record<IslandCode, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  st_thomas: {
    minLat: 18.27,
    maxLat: 18.39,
    minLng: -65.08,
    maxLng: -64.80,
  },
  st_john: {
    minLat: 18.28,
    maxLat: 18.38,
    minLng: -64.86,
    maxLng: -64.65,
  },
  st_croix: {
    minLat: 17.62,
    maxLat: 17.82,
    minLng: -64.94,
    maxLng: -64.54,
  },
  water_island: {
    minLat: 18.30,
    maxLat: 18.33,
    minLng: -64.97,
    maxLng: -64.93,
  },
};

const PLACE_ISLAND_HINTS: Record<string, IslandCode> = {
  "cruz bay": "st_john",
  "coral bay": "st_john",
  "magen": "st_thomas",
  "magens": "st_thomas",
  "red hook": "st_thomas",
  "charlotte amalie": "st_thomas",
  "havensight": "st_thomas",
  "yacht haven": "st_thomas",
  "christiansted": "st_croix",
  "frederiksted": "st_croix",
  "salt river": "st_croix",
  "gallows bay": "st_croix",
};

function normalizeIsland(value?: string): IslandCode | "" {
  const key = String(value || "").toLowerCase().trim();

  if (["stt", "st_thomas", "st. thomas", "saint thomas", "st thomas"].includes(key)) return "st_thomas";
  if (["stj", "st_john", "st. john", "saint john", "st john"].includes(key)) return "st_john";
  if (["stx", "st_croix", "st. croix", "saint croix", "st croix"].includes(key)) return "st_croix";
  if (["wat", "water_island", "water island"].includes(key)) return "water_island";

  return "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferIslandFromCoords(lat?: number, lng?: number): IslandCode | "" {
  if (typeof lat !== "number" || typeof lng !== "number") return "";

  for (const [island, box] of Object.entries(ISLAND_BOXES) as Array<[IslandCode, typeof ISLAND_BOXES[IslandCode]]>) {
    if (
      lat >= box.minLat &&
      lat <= box.maxLat &&
      lng >= box.minLng &&
      lng <= box.maxLng
    ) {
      return island;
    }
  }

  return "";
}

function inferIslandFromText(business: Business): IslandCode | "" {
  const text = [
    business.name,
    business.slug,
    business.estate,
    business.address,
    business.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const [hint, island] of Object.entries(PLACE_ISLAND_HINTS)) {
    if (text.includes(hint)) return island;
  }

  return "";
}

function validImagePath(value?: string) {
  if (!value) return false;
  if (value.includes("undefined")) return false;
  if (value.includes("null")) return false;
  return value.startsWith("/") || value.startsWith("http");
}

async function main() {
  const snap = await db.collection("businesses").get();

  const problems: Array<{
    id: string;
    name: string;
    issues: string[];
    suggestedFix?: Partial<Business>;
  }> = [];

  const seenSlugs = new Map<string, string>();

  for (const doc of snap.docs) {
    const business = doc.data() as Business;
    const issues: string[] = [];
    const suggestedFix: Partial<Business> = {};

    const id = doc.id;
    const name = business.name || id;

    const normalizedIsland = normalizeIsland(business.island);
    const coordIsland = inferIslandFromCoords(
      business.coordinates?.lat,
      business.coordinates?.lng,
    );
    const textIsland = inferIslandFromText(business);

    if (!business.name?.trim()) {
      issues.push("Missing business name");
    }

    if (!business.slug?.trim()) {
      issues.push("Missing slug");
      suggestedFix.slug = slugify(name);
    } else {
      const expectedSlug = slugify(business.slug);
      if (business.slug !== expectedSlug) {
        issues.push(`Slug should be normalized: ${expectedSlug}`);
        suggestedFix.slug = expectedSlug;
      }

      const previousId = seenSlugs.get(business.slug);
      if (previousId && previousId !== id) {
        issues.push(`Duplicate slug also used by ${previousId}`);
      }

      seenSlugs.set(business.slug, id);
    }

    if (!normalizedIsland) {
      issues.push(`Invalid or missing island: ${business.island || "none"}`);
      if (coordIsland) suggestedFix.island = coordIsland;
      else if (textIsland) suggestedFix.island = textIsland;
    }

    if (!business.coordinates) {
      issues.push("Missing coordinates");
    } else if (
      typeof business.coordinates.lat !== "number" ||
      typeof business.coordinates.lng !== "number"
    ) {
      issues.push("Invalid coordinates object");
    } else if (!coordIsland) {
      issues.push(
        `Coordinates appear outside expected USVI island boxes: ${business.coordinates.lat}, ${business.coordinates.lng}`,
      );
    }

    if (normalizedIsland && coordIsland && normalizedIsland !== coordIsland) {
      issues.push(`Island mismatch: record says ${normalizedIsland}, coordinates appear to be ${coordIsland}`);
      suggestedFix.island = coordIsland;
    }

    if (normalizedIsland && textIsland && normalizedIsland !== textIsland) {
      issues.push(`Text/location mismatch: record says ${normalizedIsland}, text suggests ${textIsland}`);
      suggestedFix.island = textIsland;
    }

    if (!business.description?.trim()) {
      issues.push("Missing description");
    }

    if (!validImagePath(business.imageUrl)) {
      issues.push("Missing or invalid imageUrl");
    }

    if (!business.phone?.trim()) {
      issues.push("Missing phone");
    }

    if (!business.website?.trim()) {
      issues.push("Missing website");
    }

    if (issues.length > 0) {
      problems.push({
        id,
        name,
        issues,
        suggestedFix: Object.keys(suggestedFix).length ? suggestedFix : undefined,
      });
    }
  }

  console.log("\nBusiness audit complete.");
  console.log(`Total businesses: ${snap.size}`);
  console.log(`Problem records: ${problems.length}`);

  for (const problem of problems) {
    console.log("\n----------------------------------------");
    console.log(`${problem.name} (${problem.id})`);
    for (const issue of problem.issues) {
      console.log(`- ${issue}`);
    }

    if (problem.suggestedFix) {
      console.log("Suggested fix:", JSON.stringify(problem.suggestedFix, null, 2));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});