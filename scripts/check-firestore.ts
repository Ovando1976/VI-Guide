// scripts/check-firestore.ts

import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, limit, query } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId,
);

const collections = [
  "tourLeads",
  "users",
  "islands",
  "places",
  "parcels",
  "historic_sites",
  "transportation",
  "shopping",
  "grocery",
  "hiking-trails",
  "restaurants-st-thomas",
  "restaurants-st-john",
  "restaurants-st-croix",
  "ferry-terminals",
];

async function checkCollection(name: string) {
  try {
    const snap = await getDocs(
      query(collection(db, name), limit(1)),
    );

    console.log(
      `✅ ${name.padEnd(30)} ${snap.size > 0 ? "HAS DATA" : "EMPTY"}`
    );

    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.error(error);
    return false;
  }
}

async function main() {
  console.log("\n=== FIRESTORE AUDIT ===\n");
  console.log("Project:", firebaseConfig.projectId);
  console.log("Database:", firebaseConfig.firestoreDatabaseId);
  console.log("");

  for (const col of collections) {
    await checkCollection(col);
  }

  console.log("\nAudit Complete\n");
}

main();