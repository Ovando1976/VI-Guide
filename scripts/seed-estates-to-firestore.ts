import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  initializeApp,
  applicationDefault,
  cert,
  getApps,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type IslandCode = "stt" | "stj" | "stx";

type FirestoreEstateDoc = {
  geoid: string;
  baseName: string;
  fullName: string;
  normalizedName: string;
  estateCode: string | null;
  island: IslandCode;
  county: string | null;
  centroid: { lat: number; lng: number } | null;
  internalPoint: { lat: number; lng: number } | null;
  geometry: unknown | null;
  aliases: string[];
  historicalAliases: string[];
  historicalNotes: string[];
  sources: string[];
};

const INPUT_PATH = path.resolve("data/derived/estates.firestore-import.json");
const COLLECTION_NAME = "usvi_estates";

function ensureFirebaseAdmin() {
  if (getApps().length) return getApps()[0];

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(credentialsPath);
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
  }

  if (projectId) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
  });
}

function buildSearchTokens(doc: FirestoreEstateDoc): string[] {
  const raw = [
    doc.geoid,
    doc.baseName,
    doc.fullName,
    doc.normalizedName,
    doc.estateCode ?? "",
    ...doc.aliases,
    ...doc.historicalAliases,
  ];

  return [...new Set(raw.filter(Boolean).map((v) => String(v).trim()))].sort(
    (a, b) => a.localeCompare(b)
  );
}

function mapIslandLabel(island: IslandCode): string {
  switch (island) {
    case "stt":
      return "St. Thomas";
    case "stj":
      return "St. John";
    case "stx":
      return "St. Croix";
  }
}

async function main() {
  ensureFirebaseAdmin();
  const db = getFirestore();

  const raw = await readFile(INPUT_PATH, "utf8");
  const estates = JSON.parse(raw) as FirestoreEstateDoc[];

  if (!Array.isArray(estates) || !estates.length) {
    throw new Error(`No estate docs found in ${INPUT_PATH}`);
  }

  let batch = db.batch();
  let ops = 0;
  let written = 0;

  for (const estate of estates) {
    const ref = db.collection(COLLECTION_NAME).doc(estate.geoid);

    batch.set(
      ref,
      {
        geoid: estate.geoid,
        baseName: estate.baseName,
        fullName: estate.fullName,
        normalizedName: estate.normalizedName,
        estateCode: estate.estateCode,
        island: estate.island,
        county: estate.county,
        countyCode: estate.county,
        centroid: estate.centroid,
        internalPoint: estate.internalPoint,
        interiorPoint: estate.internalPoint,
        aliases: estate.aliases,
        historicalAliases: estate.historicalAliases,
        historicalNotes: estate.historicalNotes,
        sources: estate.sources,
        islandLabel: mapIslandLabel(estate.island),
        searchTokens: buildSearchTokens(estate),
        updatedAt: new Date().toISOString(),
        geometryJson: estate.geometry ? JSON.stringify(estate.geometry) : null,
      },
      { merge: true }
    );

    ops += 1;
    written += 1;

    if (ops === 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
      console.log(`Committed ${written} estate docs...`);
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(`Seeded ${written} estate docs into ${COLLECTION_NAME}`);
}

main().catch((error) => {
  console.error("Estate Firestore seed failed:", error);
  process.exit(1);
});
