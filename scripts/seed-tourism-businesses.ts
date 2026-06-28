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

type BusinessCategory =
  | "hotel"
  | "villa"
  | "car_rental"
  | "taxi"
  | "charter"
  | "fishing"
  | "dive_shop"
  | "watersports";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

type SeedBusiness = {
  name: string;
  slug: string;
  category: BusinessCategory;
  island: IslandCode;
  estate?: string;
  description: string;
  imageUrl: string;
};

const businesses: SeedBusiness[] = [
  {
    name: "The Ritz-Carlton St. Thomas",
    slug: "ritz-carlton-st-thomas",
    category: "hotel",
    island: "st_thomas",
    estate: "Nazareth",
    description: "Luxury resort listing for visitors exploring St. Thomas.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Secret Harbour Beach Resort",
    slug: "secret-harbour-beach-resort",
    category: "hotel",
    island: "st_thomas",
    estate: "Nazareth",
    description: "Beachfront resort listing with visitor lodging visibility.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Bolongo Bay Beach Resort",
    slug: "bolongo-bay-beach-resort",
    category: "hotel",
    island: "st_thomas",
    estate: "Bolongo",
    description: "Island resort listing for stays, dining, and beach access.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Mafolie Hotel",
    slug: "mafolie-hotel",
    category: "hotel",
    island: "st_thomas",
    estate: "Mafolie",
    description: "Hotel listing overlooking Charlotte Amalie and the harbor.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "The Buccaneer",
    slug: "the-buccaneer-st-croix",
    category: "hotel",
    island: "st_croix",
    estate: "Christiansted",
    description: "Historic resort listing for St. Croix visitors.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "King Christian Hotel",
    slug: "king-christian-hotel",
    category: "hotel",
    island: "st_croix",
    estate: "Christiansted",
    description: "Christiansted hotel listing near historic waterfront attractions.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Cruz Bay Boutique Villas",
    slug: "cruz-bay-boutique-villas",
    category: "villa",
    island: "st_john",
    estate: "Cruz Bay",
    description: "Villa and vacation rental listing for St. John travelers.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "East End Villa Collection",
    slug: "east-end-villa-collection",
    category: "villa",
    island: "st_thomas",
    estate: "East End",
    description: "Vacation villa listing for families, groups, and long stays.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Centerline Car Rentals",
    slug: "centerline-car-rentals",
    category: "car_rental",
    island: "st_john",
    estate: "Cruz Bay",
    description: "Car rental listing for visitors exploring St. John.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Paradise Rental Car",
    slug: "paradise-rental-car",
    category: "car_rental",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    description: "Car rental listing for airport, hotel, and island travel.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Dependable Car Rental",
    slug: "dependable-car-rental",
    category: "car_rental",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    description: "Visitor car rental listing for St. Thomas transportation.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "VI Taxi Dispatch",
    slug: "vi-taxi-dispatch",
    category: "taxi",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    description: "Taxi and island transportation listing for visitors and locals.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Red Hook Taxi Service",
    slug: "red-hook-taxi-service",
    category: "taxi",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Taxi listing for ferry transfers, hotels, and beach routes.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Sonic Charters",
    slug: "sonic-charters",
    category: "charter",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Boat charter listing for private island trips and water adventures.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Stormy Pirates",
    slug: "stormy-pirates",
    category: "charter",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Charter listing for private excursions and island hopping.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "New Horizons Charters",
    slug: "new-horizons-charters",
    category: "charter",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Boat charter listing for sailing, snorkeling, and sunset trips.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Ocean Surfari",
    slug: "ocean-surfari",
    category: "charter",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Water adventure and charter listing for visitors.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Double Header Fishing",
    slug: "double-header-fishing",
    category: "fishing",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Fishing charter listing for offshore and sport fishing trips.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Cane Bay Dive Shop",
    slug: "cane-bay-dive-shop",
    category: "dive_shop",
    island: "st_croix",
    estate: "Cane Bay",
    description: "Dive shop listing for St. Croix underwater adventures.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "Red Hook Dive Center",
    slug: "red-hook-dive-center",
    category: "dive_shop",
    island: "st_thomas",
    estate: "Red Hook",
    description: "Dive shop listing for scuba, snorkeling, and guided dives.",
    imageUrl: "/images/business/business-directory.jpg",
  },
  {
    name: "St. John Watersports",
    slug: "st-john-watersports",
    category: "watersports",
    island: "st_john",
    estate: "Cruz Bay",
    description: "Watersports listing for beach rentals, snorkeling, and island fun.",
    imageUrl: "/images/business/business-directory.jpg",
  },
];

async function seed() {
  const now = Date.now();

  console.log("Admin Firebase project:", serviceAccount.project_id);
  console.log("Firestore database:", DATABASE_ID);

  for (const business of businesses) {
    const ref = db.collection("businesses").doc(business.slug);

    await ref.set(
      {
        ...business,
        featured: false,
        premium: false,
        verified: false,
        claimStatus: "unclaimed",
        source: "tourism-seed",
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
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
      { merge: true }
    );

    console.log(`Seeded: ${business.name}`);
  }

  console.log(`Seed complete. Total seeded: ${businesses.length}`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});