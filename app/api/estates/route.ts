import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  debugFirestoreEstateDoc,
  normalizeEstateCollection,
  normalizeFirestoreEstateCollection,
  type FirestoreEstateDoc,
} from "@/lib/usvi";
import type { EstateCollection, EstateRecord } from "@/types/usvi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMOTE_SOURCE_TIMEOUT_MS = 4_000;

const ESTATES_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/" +
  "TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/0/query?" +
  new URLSearchParams({
    where: "STATE='78'",
    outFields:
      "GEOID,STATE,COUNTY,BASENAME,NAME,CENTLAT,CENTLON,INTPTLAT,INTPTLON,ESTATE",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  }).toString();

async function loadFirestoreEstates(): Promise<{
  estates: EstateRecord[];
  rawDocs: FirestoreEstateDoc[];
}> {
  const snapshot = await getAdminDb().collection("usvi_estates").get();
  const rawDocs = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as FirestoreEstateDoc[];

  return {
    estates: normalizeFirestoreEstateCollection(rawDocs),
    rawDocs,
  };
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${label} timed out.`)),
      REMOTE_SOURCE_TIMEOUT_MS,
    );
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function loadCensusEstates(): Promise<EstateRecord[]> {
  const response = await withTimeout(
    fetch(ESTATES_URL, {
      next: { revalidate: 60 * 60 * 24 },
    }),
    "Census estate service",
  );

  if (!response.ok) {
    throw new Error(`Census estate service returned ${response.status}.`);
  }

  const collection = (await response.json()) as EstateCollection;
  return normalizeEstateCollection(collection);
}

async function loadLocalEstates(): Promise<EstateRecord[]> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "generated",
    "modern-estates.normalized.json",
  );
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as EstateRecord[];
  if (!Array.isArray(parsed) || !parsed.length) {
    throw new Error("The local estate snapshot is empty.");
  }
  return parsed;
}

export async function GET() {
  let localError: string | null = null;

  // Estate boundaries are static geography. Prefer the bundled, validated
  // snapshot so the customer map never waits on credentials or a remote SDK.
  try {
    const estates = await loadLocalEstates();
    return NextResponse.json({
      estates,
      count: estates.length,
      meta: {
        source: "local-snapshot",
        normalizedCount: estates.length,
      },
    });
  } catch (error) {
    localError =
      error instanceof Error ? error.message : "Local snapshot unavailable.";
    console.warn("Local estate snapshot failed; trying remote sources.");
  }

  if (hasFirebaseAdminConfiguration()) {
    try {
      const { estates, rawDocs } = await withTimeout(
        loadFirestoreEstates(),
        "Firestore estate load",
      );
      if (estates.length) {
        return NextResponse.json({
          estates,
          count: estates.length,
          meta: {
            source: "firestore",
            rawCount: rawDocs.length,
            normalizedCount: estates.length,
            ...(process.env.NODE_ENV === "development"
              ? {
                  localError,
                  sampleRaw: rawDocs.slice(0, 3).map(debugFirestoreEstateDoc),
                }
              : {}),
          },
        });
      }

      console.warn("The usvi_estates collection is empty.");
    } catch (error) {
      console.warn(
        "Firestore estate load failed; using Census fallback.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  try {
    const estates = await loadCensusEstates();
    return NextResponse.json({
      estates,
      count: estates.length,
      meta: {
        source: "census-fallback",
        normalizedCount: estates.length,
      },
    });
  } catch (error) {
    console.error("All estate data sources failed.", error);
    return NextResponse.json(
      {
        error:
          "Estate data is temporarily unavailable. Check Firebase Admin credentials and network access.",
      },
      { status: 503 },
    );
  }
}
