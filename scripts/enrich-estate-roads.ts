import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  initializeApp,
  cert,
  getApps,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { Polygon } from "geojson";

import { buildEstateRoadContext } from "@/lib/estate-road-context";

type EstateApiRecord = {
  geoid: string;
  baseName: string;
  fullName?: string;
  estateCode?: string | null;
  island: "stt" | "stj" | "stx";
  geometry: Polygon;
  internalPoint: {
    lat: number;
    lng: number;
  };
};

type EstatesApiResponse = {
  count: number;
  estates: EstateApiRecord[];
};

function resolveServiceAccount() {
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const fallbackPath = path.resolve(
    process.cwd(),
    "secrets/firebase-service-account.json"
  );

  const serviceAccountPath =
    explicitPath && existsSync(explicitPath)
      ? explicitPath
      : existsSync(fallbackPath)
      ? fallbackPath
      : null;

  if (!serviceAccountPath) {
    return null;
  }

  return JSON.parse(readFileSync(serviceAccountPath, "utf8"));
}

function ensureAdmin() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = resolveServiceAccount();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    serviceAccount?.project_id;

  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

async function fetchEstates(baseUrl: string) {
  const response = await fetch(`${baseUrl}/api/estates`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch estates: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as EstatesApiResponse;
}

async function main() {
  ensureAdmin();
  const db = getFirestore();

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const dryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const islandArg = process.argv.find((arg) => arg.startsWith("--island="));

  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const islandFilter = islandArg
    ? (islandArg.split("=")[1].trim().toLowerCase() as "stt" | "stj" | "stx")
    : null;

  if (limit !== null && (!Number.isFinite(limit) || limit <= 0)) {
    throw new Error(`Invalid --limit value: ${limitArg}`);
  }

  const apiData = await fetchEstates(baseUrl);

  let estates = apiData.estates.filter(
    (estate) =>
      estate.geometry?.type === "Polygon" &&
      Array.isArray(estate.geometry.coordinates) &&
      estate.geometry.coordinates.length > 0 &&
      typeof estate.internalPoint?.lat === "number" &&
      typeof estate.internalPoint?.lng === "number"
  );

  if (islandFilter) {
    estates = estates.filter((estate) => estate.island === islandFilter);
  }

  if (limit) {
    estates = estates.slice(0, limit);
  }

  console.log(`Loaded ${estates.length} estates for enrichment.`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const estate of estates) {
    processed += 1;

    try {
      console.log(
        `[${processed}/${estates.length}] Enriching ${estate.baseName} (${
          estate.geoid
        }, ${estate.island.toUpperCase()})`
      );

      const roadContext = await buildEstateRoadContext({
        geometry: estate.geometry,
        internalPoint: estate.internalPoint,
      });

      if (dryRun) {
        console.log(
          JSON.stringify(
            {
              geoid: estate.geoid,
              baseName: estate.baseName,
              roadContext,
            },
            null,
            2
          )
        );
      } else {
        await db
          .collection("estates")
          .doc(estate.geoid)
          .set(
            {
              geoid: estate.geoid,
              baseName: estate.baseName,
              fullName: estate.fullName ?? estate.baseName,
              estateCode: estate.estateCode ?? null,
              island: estate.island,
              internalPoint: estate.internalPoint,
              roadContext,
              roadContextUpdatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
      }

      succeeded += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `Failed to enrich ${estate.baseName} (${estate.geoid}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(
    `Done. Processed: ${processed}, succeeded: ${succeeded}, failed: ${failed}, dryRun: ${dryRun}`
  );
}

main().catch((error) => {
  console.error("Estate road enrichment failed:", error);
  process.exit(1);
});
