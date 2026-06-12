import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { safeForFirestore, withTimestamps } from "./seedSafe";

export async function seedCollection(collectionName: string, records: any[]) {
  for (const record of records) {
    const id = record.slug ?? record.id ?? record.code ?? record.key ?? record.geoid ?? record.parcelId;

    if (!id) {
      console.warn(`Skipping ${collectionName} record with no id`, record);
      continue;
    }

    await setDoc(
      doc(db, collectionName, id),
      safeForFirestore(withTimestamps(record)),
      { merge: true }
    );
  }
}