import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DATABASE_ID = "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671";

const serviceAccount = JSON.parse(
  readFileSync(".secrets/firebase-admin.json", "utf8"),
);

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app, DATABASE_ID);

const businesses = [
  {
    name: "Sea Glass Properties",
    slug: "sea-glass-properties",
    category: "real_estate",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    description: "Real estate listing for Virgin Islands homes, villas, and investment properties.",
  },
  {
    name: "Blue Sky Real Estate",
    slug: "blue-sky-real-estate",
    category: "real_estate",
    island: "st_croix",
    estate: "Christiansted",
    description: "Real estate listing for St. Croix property sales and rentals.",
  },
  {
    name: "St. John Properties",
    slug: "st-john-properties",
    category: "real_estate",
    island: "st_john",
    estate: "Cruz Bay",
    description: "Real estate listing for St. John villas, land, and homes.",
  },
  {
    name: "Cutting Edge Carpentry Services",
    slug: "cutting-edge-carpentry-services",
    category: "contractor",
    island: "st_thomas",
    estate: "East End",
    description: "Carpentry, repairs, renovations, and property improvement services.",
  },
  {
    name: "VI Property Maintenance",
    slug: "vi-property-maintenance",
    category: "contractor",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    description: "Property maintenance, repairs, and improvement services for island homes.",
  },
  {
    name: "Island Marine Services",
    slug: "island-marine-services",
    category: "marine_service",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Marine repair, boat support, and vessel services.",
  },
  {
    name: "St. Thomas Healthcare Clinic",
    slug: "st-thomas-healthcare-clinic",
    category: "medical",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    description: "Medical services listing for residents and visitors.",
  },
  {
    name: "Christiansted Pharmacy",
    slug: "christiansted-pharmacy",
    category: "pharmacy",
    island: "st_croix",
    estate: "Christiansted",
    description: "Pharmacy and wellness listing for St. Croix.",
  },
];

async function run() {
  const now = Date.now();

  for (const business of businesses) {
    await db.collection("businesses").doc(business.slug).set(
      {
        ...business,
        imageUrl: "/images/business/business-directory.jpg",
        featured: false,
        premium: false,
        verified: false,
        claimStatus: "unclaimed",
        source: "expanded-business-seed",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );

    await db.collection("businessAnalytics").doc(business.slug).set(
      {
        businessId: business.slug,
        profileViews: 0,
        websiteClicks: 0,
        phoneClicks: 0,
        directionRequests: 0,
        leadCount: 0,
        updatedAt: now,
      },
      { merge: true },
    );

    console.log(`Seeded: ${business.name}`);
  }

  console.log(`Expanded business seed complete: ${businesses.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});