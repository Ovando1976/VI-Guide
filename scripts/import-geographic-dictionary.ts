import fs from "node:fs/promises";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, WriteBatch } from "firebase-admin/firestore";

import type {
  GeographicAliasIndex,
  GeographicDictionaryEntry,
} from "@/types/geographic";
import { normalizeGeoText } from "@/lib/geographic-normalize";

async function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  const raw = await fs.readFile(path.resolve(credentialsPath), "utf8");
  return JSON.parse(raw);
}

async function ensureAdmin() {
  if (getApps().length) return;

  const serviceAccount = await getServiceAccount();

  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

function buildAliasDocs(
  entry: GeographicDictionaryEntry
): GeographicAliasIndex[] {
  const now = new Date().toISOString();
  const docs: GeographicAliasIndex[] = [];

  const push = (alias: string, strength: GeographicAliasIndex["strength"]) => {
    const normalizedAlias = normalizeGeoText(alias);
    if (!normalizedAlias) return;

    docs.push({
      id: `${entry.id}__${normalizedAlias}`,
      alias,
      normalizedAlias,
      entryId: entry.id,
      canonicalName: entry.canonicalName,
      featureType: entry.featureType,
      island: entry.island,
      strength,
      updatedAt: now,
    });
  };

  push(entry.canonicalName, "canonical");
  entry.aliases.forEach((value) => push(value, "alias"));
  entry.variantSpellings.forEach((value) => push(value, "variant"));
  entry.obsoleteNames.forEach((value) => push(value, "obsolete"));
  entry.linguisticEquivalents.forEach((value) => push(value, "linguistic"));

  return docs;
}

async function commitBatch(batch: WriteBatch, dryRun: boolean) {
  if (!dryRun) {
    await batch.commit();
  }
}

async function main() {
  await ensureAdmin();

  const db = getFirestore();

  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const positionalArgs = args.filter((arg) => !arg.startsWith("--"));

  const inputPath =
    positionalArgs[0] ||
    path.join(
      process.cwd(),
      "data",
      "generated",
      "geographic-dictionary-normalized.json"
    );

  const raw = await fs.readFile(inputPath, "utf8");
  const entries = JSON.parse(raw) as GeographicDictionaryEntry[];

  console.log(`Loaded ${entries.length} geographic entries from ${inputPath}.`);

  let imported = 0;
  let aliasImported = 0;
  let opsInBatch = 0;
  let batch = db.batch();

  for (const entry of entries) {
    const aliasDocs = buildAliasDocs(entry);

    batch.set(
      db.collection("geographic_dictionary_entries").doc(entry.id),
      entry,
      { merge: true }
    );
    opsInBatch += 1;

    for (const aliasDoc of aliasDocs) {
      batch.set(
        db.collection("geographic_alias_index").doc(aliasDoc.id),
        aliasDoc,
        { merge: true }
      );
      opsInBatch += 1;

      if (opsInBatch >= 450) {
        await commitBatch(batch, dryRun);
        console.log(
          `Committed batch at entry ${imported + 1}/${
            entries.length
          } (${aliasImported} aliases so far)`
        );
        batch = db.batch();
        opsInBatch = 0;
      }
    }

    imported += 1;
    aliasImported += aliasDocs.length;

    if (imported % 25 === 0) {
      console.log(
        `Processed ${imported}/${entries.length} entries (${aliasImported} aliases)`
      );
    }
  }

  if (opsInBatch > 0) {
    await commitBatch(batch, dryRun);
    console.log("Committed final batch.");
  }

  console.log(
    `Done. entries=${imported}, aliases=${aliasImported}, dryRun=${dryRun}`
  );
}

main().catch((error) => {
  console.error("Geographic dictionary import failed:", error);
  process.exit(1);
});
