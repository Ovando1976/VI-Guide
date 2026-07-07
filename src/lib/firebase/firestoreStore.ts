import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { getAnonymousUid, getFirebaseDb } from "./firebaseClient";

export async function mirrorUserRecord(
  collectionName: string,
  recordId: string,
  data: Record<string, unknown>
) {
  const db = getFirebaseDb();
  if (!db) return { stored: false, reason: "firebase_not_configured" };

  const uid = await getAnonymousUid();
  if (!uid) return { stored: false, reason: "auth_not_available" };

  await setDoc(
    doc(db, "users", uid, collectionName, recordId),
    {
      ...data,
      mirroredAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { stored: true };
}
