import fs from "fs";
import admin from "firebase-admin";
import serviceAccount from "../serviceAccountKey.json" assert { type: "json" };
import firebaseConfig from "../firebase-applet-config.json" assert { type: "json" };

const EVENTS_FILE = "src/data/events.json";
const DATABASE_ID = firebaseConfig.firestoreDatabaseId || "(default)";

if (!fs.existsSync(EVENTS_FILE)) {
  console.error(`Missing ${EVENTS_FILE}. Run build-events-calendar first.`);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: firebaseConfig.storageBucket,
  });
}

const db = admin.firestore();
db.settings({ databaseId: DATABASE_ID });

const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8"));

const validEvents = events.filter(
  (event) =>
    event.slug &&
    event.title &&
    event.islandCode &&
    event.status === "published" &&
    typeof event.startAt === "number" &&
    Number.isFinite(event.startAt) &&
    event.coordinates?.lat &&
    event.coordinates?.lng
);

console.log(`Database: ${DATABASE_ID}`);
console.log(`Events loaded: ${events.length}`);
console.log(`Valid events: ${validEvents.length}`);

let batch = db.batch();
let count = 0;
let batchCount = 0;

for (const event of validEvents) {
  const id = String(event.id || `${event.slug}-${event.startAt}`);
  const ref = db.collection("events").doc(id);

  batch.set(
    ref,
    {
      ...event,
      id,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  count++;
  batchCount++;

  if (batchCount === 450) {
    await batch.commit();
    console.log(`Committed ${count} events...`);
    batch = db.batch();
    batchCount = 0;
  }
}

if (batchCount > 0) await batch.commit();

console.log(`Seeded Firestore events: ${count}`);
