import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function main() {
  console.log("Project:", firebaseConfig.projectId);
  console.log("Database:", firebaseConfig.firestoreDatabaseId);
  console.log("Collection: tourLeads");

  const snap = await getDocs(collection(db, "tourLeads"));

  console.log("Docs found:", snap.size);

  snap.docs.forEach((doc) => {
    console.log(doc.id, doc.data());
  });
}

main().catch((error) => {
  console.error("Database check failed:", error);
  process.exit(1);
});
