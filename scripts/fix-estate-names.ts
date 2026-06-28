// scripts/fix-estate-names.ts
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, WriteBatch } from "firebase-admin/firestore";
import firebaseConfig from "../firebase-applet-config.json";

initializeApp({
  credential: applicationDefault(),
  projectId: firebaseConfig.projectId,
});

const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const COLLECTION = "estates";
const DRY_RUN = process.env.DRY_RUN !== "false";
const BATCH_SIZE = 450;

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function getEstateName(data: FirebaseFirestore.DocumentData): string {
  return clean(
    data.raw?.ESTATE ||
      data.raw?.Estate ||
      data.raw?.estate ||
      data.ESTATE ||
      data.Estate ||
      data.estate ||
      data.estateName ||
      data.baseName ||
      data.fullName ||
      "",
  );
}

async function commitBatch(batch: WriteBatch, count: number) {
  if (!DRY_RUN && count > 0) {
    await batch.commit();
  }
}

async function main() {
  console.log("Project:", firebaseConfig.projectId);
  console.log("Database:", firebaseConfig.firestoreDatabaseId);
  console.log("Collection:", COLLECTION);
  console.log("Dry run:", DRY_RUN);
  console.log("");

  const snap = await db.collection(COLLECTION).get();

  let checked = 0;
  let queued = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snap.docs) {
    checked += 1;

    const data = docSnap.data();
    const currentName = clean(data.name);
    const fixedName = getEstateName(data);

    const currentIsUnknown =
      !currentName || currentName.toLowerCase() === "unknown estate";

    if (!fixedName || fixedName.toLowerCase() === "unknown estate") {
      skipped += 1;
      continue;
    }

    if (!currentIsUnknown && currentName === fixedName) {
      skipped += 1;
      continue;
    }

    if (!currentIsUnknown) {
      skipped += 1;
      continue;
    }

    queued += 1;
    console.log(`${docSnap.id}: "${currentName}" -> "${fixedName}"`);

    if (!DRY_RUN) {
      batch.update(docSnap.ref, {
        name: fixedName,
        estateName: fixedName,
        baseName: fixedName,
        aliases: Array.from(
          new Set([...(Array.isArray(data.aliases) ? data.aliases : []), fixedName]),
        ),
        updatedAt: Timestamp.now(),
      });

      batchCount += 1;

      if (batchCount >= BATCH_SIZE) {
        await commitBatch(batch, batchCount);
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  await commitBatch(batch, batchCount);

  console.log("");
  console.log("Checked:", checked);
  console.log("Queued:", queued);
  console.log("Skipped:", skipped);

  if (DRY_RUN) {
    console.log("");
    console.log("Dry run only. To actually update Firestore, run:");
    console.log("DRY_RUN=false npx tsx scripts/fix-estate-names.ts");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});