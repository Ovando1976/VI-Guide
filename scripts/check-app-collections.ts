import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const collections = [
  "areas",
  "beaches",
  "community_posts",
  "community_comments",
  "documents",
  "estates",
  "events",
  "featured_sections",
  "ferry-terminals",
  "grocery",
  "historic_sites",
  "inquiries",
  "islands",
  "mobility_drivers",
  "mobility_fare_rules",
  "mobility_trips",
  "parcels",
  "places",
  "restaurants-st-croix",
  "restaurants-st-john",
  "restaurants-st-thomas",
  "tourLeads",
  "transit_routes",
  "transportation",
  "user_memories",
  "users",
];

async function checkCollection(name: string) {
  try {
    const snap = await getDocs(query(collection(db, name), limit(3)));
    console.log(
      `${snap.size > 0 ? "✅" : "⚪"} ${name.padEnd(28)} ${
        snap.size > 0 ? `${snap.size} sample docs` : "empty or readable"
      }`,
    );
  } catch (error: any) {
    console.log(`❌ ${name.padEnd(28)} ${error.code || error.message}`);
  }
}

async function main() {
  console.log("Project:", firebaseConfig.projectId);
  console.log("Database:", firebaseConfig.firestoreDatabaseId);
  console.log("");

  for (const name of collections) {
    await checkCollection(name);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
