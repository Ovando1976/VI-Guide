import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../.secrets/firebase-admin.json";

initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore(undefined, "ai-studio-ef9b22ac-987a-4e06-8e0f-d7e4254a2671");

const cols = await db.listCollections();

console.log(cols.map(c => c.id));
