// src/seedBeaches.ts
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { USVI_BEACHES } from "./data/usviBeaches";

export async function seedBeaches() {
  for (const beach of USVI_BEACHES) {
    await setDoc(doc(db, "beaches", beach.slug), beach, { merge: true });
  }

  console.log(`Seeded ${USVI_BEACHES.length} beaches.`);
}
