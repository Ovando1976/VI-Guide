import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DATABASE_ID = "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671";

const serviceAccount = JSON.parse(
  readFileSync(".secrets/firebase-admin.json", "utf8")
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app, DATABASE_ID);

const restaurantCollections = [
  {
    collection: "restaurants-st-thomas",
    island: "st_thomas",
  },
  {
    collection: "restaurants-st-john",
    island: "st_john",
  },
  {
    collection: "restaurants-st-croix",
    island: "st_croix",
  },
] as const;

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

async function importRestaurants() {
  const now = Date.now();
  let total = 0;

  console.log("Admin Firebase project:", serviceAccount.project_id);
  console.log("Firestore database:", DATABASE_ID);

  for (const source of restaurantCollections) {
    const snap = await db.collection(source.collection).get();

    console.log(`Reading ${source.collection}: ${snap.size} records`);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();

      const slug = cleanString(data.slug, docSnap.id);
      const name = cleanString(data.name, titleCaseFromSlug(slug));
      const description = cleanString(
        data.description,
        `${name} is a restaurant listing in the U.S. Virgin Islands.`
      );

      const coordinates =
        data.coordinates &&
        typeof data.coordinates.lat === "number" &&
        typeof data.coordinates.lng === "number"
          ? {
              lat: data.coordinates.lat,
              lng: data.coordinates.lng,
            }
          : null;

      const business = {
        id: slug,
        name,
        slug,
        category: "restaurant",
        island: source.island,
        estate: cleanString(data.areaName, cleanString(data.areaSlug, "")),
        address: cleanString(data.address, ""),
        description,
        imageUrl: cleanString(
          data.coverImage,
          "/images/business/restaurants.jpg"
        ),
        featured: Boolean(data.featured),
        premium: false,
        verified: true,
        claimStatus: "unclaimed",
        source: source.collection,
        importedFrom: `${source.collection}/${docSnap.id}`,
        coordinates,
        createdAt:
          typeof data.createdAt === "number" ? data.createdAt : now,
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
        { merge: true }
      );

      total += 1;
      console.log(`Imported restaurant: ${name}`);
    }
  }

  console.log(`Restaurant import complete. Total imported: ${total}`);
}

importRestaurants().catch((error) => {
  console.error(error);
  process.exit(1);
});