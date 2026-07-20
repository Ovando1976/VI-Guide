import { FieldValue } from "firebase-admin/firestore";
import { ACCOMMODATIONS } from "../lib/accommodations";
import { getAdminDb } from "../lib/firebase-admin";

async function main() {
  const db = getAdminDb();
  let batch = db.batch();
  let pending = 0;

  for (const stay of ACCOMMODATIONS) {
    const ref = db.collection("stays").doc(stay.slug);
    batch.set(ref, {
      ...stay,
      island: stay.island.toUpperCase(),
      kind: stay.category,
      imageUrl: stay.heroImage,
      shortDescription: stay.description,
      catalogManaged: true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    pending += 1;

    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending) await batch.commit();
  const stThomasCount = ACCOMMODATIONS.filter((stay) => stay.island === "stt").length;
  console.log(`Seeded ${ACCOMMODATIONS.length} verified stays (${stThomasCount} on St. Thomas).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
