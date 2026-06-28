import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DATABASE_ID = "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671";

const serviceAccount = JSON.parse(
  readFileSync(".secrets/firebase-admin.json", "utf8"),
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app, DATABASE_ID);

const imports = [
  { collection: "grocery", category: "grocery" },
  { collection: "shopping", category: "retail" },
  { collection: "transportation", category: "transportation" },
] as const;

function clean(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function titleCase(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 2) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function normalizeIsland(value: unknown) {
  const text = clean(value).toLowerCase();

  if (text === "st_thomas" || text === "st-thomas") return "st_thomas";
  if (text === "st_john" || text === "st-john") return "st_john";
  if (text === "st_croix" || text === "st-croix") return "st_croix";
  if (text === "water_island" || text === "water-island") return "water_island";

  return "st_thomas";
}

function getCoordinates(data: FirebaseFirestore.DocumentData) {
  if (
    data.coordinates &&
    typeof data.coordinates.lat === "number" &&
    typeof data.coordinates.lng === "number"
  ) {
    return {
      lat: data.coordinates.lat,
      lng: data.coordinates.lng,
    };
  }

  return undefined;
}

function inferLocation(data: FirebaseFirestore.DocumentData, island: string) {
  const explicit =
    clean(data.estate) ||
    clean(data.areaName) ||
    clean(data.neighborhood) ||
    clean(data.city) ||
    clean(data.town);

  if (explicit && explicit !== "grocery" && explicit !== "shopping") {
    return explicit;
  }

  const slug = clean(data.id || data.slug).toLowerCase();

  if (slug.includes("cruz-bay")) return "Cruz Bay";
  if (slug.includes("coral-bay")) return "Coral Bay";
  if (slug.includes("red-hook")) return "Red Hook";
  if (slug.includes("charlotte-amalie")) return "Charlotte Amalie";
  if (slug.includes("havensight")) return "Havensight";
  if (slug.includes("crown-bay")) return "Crown Bay";
  if (slug.includes("yacht-haven")) return "Yacht Haven Grande";
  if (slug.includes("christiansted")) return "Christiansted";
  if (slug.includes("frederiksted")) return "Frederiksted";
  if (slug.includes("sunny-isle")) return "Sunny Isle";
  if (slug.includes("st-john")) return "St. John";
  if (slug.includes("st-thomas")) return "St. Thomas";
  if (slug.includes("st-croix")) return "St. Croix";

  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  if (island === "water_island") return "Water Island";
  return "St. Thomas";
}

function inferTransportationCategory(data: FirebaseFirestore.DocumentData) {
  const text = `${clean(data.name)} ${clean(data.slug)} ${clean(data.description)}`.toLowerCase();

  if (text.includes("taxi")) return "taxi";
  if (text.includes("marina") || text.includes("yacht")) return "marina";
  if (text.includes("ferry")) return "ferry";
  if (text.includes("airport")) return "airport";
  if (text.includes("cruise")) return "cruise_port";

  return "transportation";
}

function getCategory(
  collection: string,
  defaultCategory: string,
  data: FirebaseFirestore.DocumentData,
) {
  if (collection === "transportation") {
    return inferTransportationCategory(data);
  }

  return defaultCategory;
}

function fallbackImage(category: string) {
  if (category === "grocery") return "/images/business/restaurants.jpg";
  if (category === "retail") return "/images/business/business-directory.jpg";
  if (category === "taxi") return "/images/business/business-directory.jpg";
  if (category === "marina") return "/images/beaches/brewers-bay.jpg";
  if (category === "ferry") return "/images/beaches/brewers-bay.jpg";
  if (category === "airport") return "/images/business/business-directory.jpg";
  if (category === "cruise_port") return "/images/events/events.jpg";

  return "/images/business/business-directory.jpg";
}

async function run() {
  const now = Date.now();
  let total = 0;

  console.log("Admin Firebase project:", serviceAccount.project_id);
  console.log("Firestore database:", DATABASE_ID);

  for (const item of imports) {
    const snap = await db.collection(item.collection).get();

    console.log(`Reading ${item.collection}: ${snap.size} records`);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();

      const slug = clean(data.slug, docSnap.id);
      const name = clean(data.name, titleCase(slug));
      const island = normalizeIsland(data.islandCode || data.island);
      const category = getCategory(item.collection, item.category, {
        ...data,
        slug,
        name,
      });

      const imageUrl =
        clean(data.coverImage) ||
        clean(data.imageUrl) ||
        clean(data.image) ||
        fallbackImage(category);

      const estate = inferLocation({ ...data, slug }, island);

      const business = {
        id: slug,
        name,
        slug,
        category,
        island,
        estate,
        address: clean(data.address, ""),
        description: clean(
          data.description,
          `${name} is a ${category.replace(/_/g, " ")} listing in the U.S. Virgin Islands.`,
        ),
        imageUrl,
        featured: Boolean(data.featured),
        premium: false,
        verified: true,
        claimStatus: "unclaimed",
        source: item.collection,
        importedFrom: `${item.collection}/${docSnap.id}`,
        coordinates: getCoordinates(data),
        createdAt: typeof data.createdAt === "number" ? data.createdAt : now,
        updatedAt: now,
      };

      await db.collection("businesses").doc(slug).set(business, {
        merge: true,
      });

      await db.collection("businessAnalytics").doc(slug).set(
        {
          businessId: slug,
          profileViews: 0,
          websiteClicks: 0,
          phoneClicks: 0,
          directionRequests: 0,
          leadCount: 0,
          updatedAt: now,
        },
        { merge: true },
      );

      total += 1;
      console.log(`Imported ${item.collection}: ${name} -> ${category}`);
    }
  }

  console.log(`Import complete. Total imported: ${total}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});