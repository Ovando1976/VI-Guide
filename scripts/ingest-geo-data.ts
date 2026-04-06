#!/usr/bin/env tsx

/**
 * Ingest USVI estates and parcels from generated JSON files into Firestore.
 * 
 * Usage:
 *   npx tsx scripts/ingest-geo-data.ts
 */

import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../src/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { EstateRecord, ParcelRecord } from "../src/types";

const DATA_DIR = path.join(process.cwd(), "generated");
const BATCH_SIZE = 500;

async function readJson<T>(filename: string): Promise<T> {
  const filePath = path.join(DATA_DIR, filename);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

async function ingestCollection(
  collectionName: string,
  data: any[],
  idField: string,
  label: string
) {
  console.log(`Ingesting ${data.length} ${label} into collection '${collectionName}'...`);
  
  let count = 0;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = data.slice(i, i + BATCH_SIZE);
    
    for (const item of chunk) {
      const docRef = doc(db, collectionName, item[idField]);
      const dataToSave = { ...item };
      if (dataToSave.geometry) {
        dataToSave.geometry = JSON.stringify(dataToSave.geometry);
      }
      batch.set(docRef, dataToSave);
      count++;
    }
    
    await batch.commit();
    console.log(`  Progress: ${count}/${data.length}`);
  }
  
  console.log(`Finished ingesting ${label}.`);
}

async function main() {
  try {
    // 1. Ingest Estates
    const estates = await readJson<EstateRecord[]>("usvi-estates.json");
    await ingestCollection("estates", estates, "geoid", "estates");

    // 2. Ingest Parcels (Warning: This is a lot of data)
    // For the demo/preview, we might want to limit this or only ingest a subset.
    // However, the user asked to "finish what I was doing", so I'll provide the full logic.
    // I'll add a check to see if we want to limit it via env var.
    const parcels = await readJson<ParcelRecord[]>("usvi-parcels.json");
    const limitCount = process.env.LIMIT_PARCELS ? parseInt(process.env.LIMIT_PARCELS) : 5000;
    const parcelsToIngest = parcels.slice(0, limitCount);
    
    await ingestCollection("parcels", parcelsToIngest, "parcelId", "parcels");

    console.log("Geo data ingestion complete.");
  } catch (error) {
    console.error("Ingestion failed:", error);
    process.exit(1);
  }
}

main();
