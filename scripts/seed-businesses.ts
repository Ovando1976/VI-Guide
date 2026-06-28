import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  readFileSync(".secrets/firebase-admin.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(
  "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671"
);


type BusinessSeed = {
  name: string;
  slug: string;
  category:
    | "restaurant"
    | "taxi"
    | "tour"
    | "hotel"
    | "retail"
    | "real_estate"
    | "contractor"
    | "service";
  description: string;
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  estate?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  imageUrl?: string;
  featured: boolean;
  premium: boolean;
  verified: boolean;
  rating?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
};


const businesses: BusinessSeed[] = [
  {
    name: "VI Guide Demo Taxi",
    slug: "vi-guide-demo-taxi",
    category: "taxi",
    description:
      "Airport transfers, local rides, ferry connections, and island transportation across St. Thomas.",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    featured: true,
    premium: true,
    verified: true,
    rating: 4.8,
    coordinates: { lat: 18.3419, lng: -64.9307 },
  },
  {
    name: "Red Hook Island Tours",
    slug: "red-hook-island-tours",
    category: "tour",
    description:
      "Private island tours, beach hopping, history routes, and custom visitor experiences.",
    island: "st_thomas",
    estate: "Red Hook",
    featured: true,
    premium: false,
    verified: true,
    rating: 4.7,
    coordinates: { lat: 18.3269, lng: -64.8496 },
  },
  {
    name: "Charlotte Amalie Eats",
    slug: "charlotte-amalie-eats",
    category: "restaurant",
    description:
      "Local food, lunch specials, seafood plates, and visitor-friendly dining near downtown.",
    island: "st_thomas",
    estate: "Charlotte Amalie",
    featured: true,
    premium: false,
    verified: true,
    rating: 4.6,
    coordinates: { lat: 18.3419, lng: -64.9307 },
  },
  {
    name: "Magens Bay Beach Service",
    slug: "magens-bay-beach-service",
    category: "service",
    description:
      "Beach day support, local guidance, visitor assistance, and convenience services near Magens Bay.",
    island: "st_thomas",
    estate: "Magens Bay",
    featured: false,
    premium: false,
    verified: false,
    rating: 4.5,
    coordinates: { lat: 18.3611, lng: -64.9244 },
  },
  {
    name: "Cruz Bay Visitor Services",
    slug: "cruz-bay-visitor-services",
    category: "tour",
    description:
      "St. John visitor support, Cruz Bay recommendations, ferry guidance, and island experiences.",
    island: "st_john",
    estate: "Cruz Bay",
    featured: true,
    premium: false,
    verified: true,
    rating: 4.8,
    coordinates: { lat: 18.3317, lng: -64.7944 },
  },
  {
    name: "Christiansted Heritage Walks",
    slug: "christiansted-heritage-walks",
    category: "tour",
    description:
      "Guided historic walks, cultural routes, colonial architecture, and heritage storytelling.",
    island: "st_croix",
    estate: "Christiansted",
    featured: true,
    premium: true,
    verified: true,
    rating: 4.9,
    coordinates: { lat: 17.7466, lng: -64.7041 },
  },
  {
    name: "East End Property Pros",
    slug: "east-end-property-pros",
    category: "real_estate",
    description:
      "Property search, estate guidance, buyer support, and local real estate intelligence.",
    island: "st_thomas",
    estate: "East End",
    featured: false,
    premium: false,
    verified: false,
    rating: 4.4,
    coordinates: { lat: 18.3269, lng: -64.8496 },
  },
  {
    name: "Cutting Edge Carpentry Services",
    slug: "cutting-edge-carpentry-services",
    category: "contractor",
    description:
      "Mobile carpentry, repairs, renovations, decks, trim, doors, and weather-resilient island upgrades.",
    island: "st_thomas",
    estate: "East End",
    featured: true,
    premium: true,
    verified: true,
    rating: 5.0,
    coordinates: { lat: 18.331, lng: -64.85 },
  },
];

async function seedBusinesses() {
  const now = Date.now();

  for (const business of businesses) {
    const ref = db.collection("businesses").doc(business.slug);

    await ref.set(
      {
        ...business,
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

  console.log("Business seed complete.");
}

seedBusinesses().catch((error) => {
  console.error(error);
  process.exit(1);
});