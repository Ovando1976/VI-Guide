import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };
import config from "../firebase-applet-config.json" assert { type: "json" };

const DATABASE_ID = config.firestoreDatabaseId || "(default)";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: config.storageBucket,
  });
}

const db = admin.firestore();
db.settings({ databaseId: DATABASE_ID });

const snap = await db
  .collection("events")
  .orderBy("startAt", "asc")
  .limit(10)
  .get();

console.log(`Database: ${DATABASE_ID}`);
console.log(`Firestore events found: ${snap.size}`);

snap.docs.forEach((doc) => {
  const e = doc.data();
  console.log({
    title: e.title,
    island: e.islandCode,
    status: e.status,
    startAt: new Date(e.startAt).toISOString(),
  });
});
