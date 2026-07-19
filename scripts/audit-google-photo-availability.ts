import fs from "node:fs";
import path from "node:path";

import { getAdminDb } from "../lib/firebase-admin";

type Row = {
  collection: "beaches" | "places";
  id: string;
  name: string;
  island: string;
  googlePlaceId: string;
  status: "has-photo" | "no-place-id" | "no-photo" | "error";
  photoCount: number;
  error?: string;
};

const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
const reportPath = path.join(process.cwd(), "reports", "google-photo-availability.json");
const missingPath = path.join(process.cwd(), "reports", "google-photo-missing.csv");

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function csv(value: unknown) {
  const output = String(value ?? "");
  return /[",\n]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

async function photoCount(placeId: string) {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": key!,
        "X-Goog-FieldMask": "photos",
      },
    },
  );
  const payload = await response.json().catch(() => ({})) as {
    photos?: Array<{ name?: string }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Google Places returned ${response.status}.`);
  }
  return (payload.photos ?? []).filter((photo) => photo.name).length;
}

async function main() {
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY is missing.");
  const db = getAdminDb();
  const rows: Row[] = [];
  for (const collection of ["beaches", "places"] as const) {
    const snapshot = await db.collection(collection).get();
    for (const document of snapshot.docs) {
      const data = document.data();
      const googlePlaceId = text(data.googlePlaceId);
      const base = {
        collection,
        id: document.id,
        name: text(data.name) || text(data.title) || document.id,
        island: text(data.island),
        googlePlaceId,
      };
      if (!googlePlaceId) {
        rows.push({ ...base, status: "no-place-id", photoCount: 0 });
        continue;
      }
      try {
        const count = await photoCount(googlePlaceId);
        rows.push({ ...base, status: count ? "has-photo" : "no-photo", photoCount: count });
      } catch (error) {
        rows.push({ ...base, status: "error", photoCount: 0, error: error instanceof Error ? error.message : String(error) });
      }
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }
  const counts = rows.reduce<Record<string, number>>((summary, row) => {
    summary[row.status] = (summary[row.status] ?? 0) + 1;
    return summary;
  }, {});
  const missing = rows.filter((row) => row.status !== "has-photo");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary: { total: rows.length, ...counts }, rows }, null, 2)}\n`);
  const headings = ["collection", "id", "name", "island", "status", "googlePlaceId", "error"];
  fs.writeFileSync(missingPath, [headings, ...missing.map((row) => [row.collection, row.id, row.name, row.island, row.status, row.googlePlaceId, row.error ?? ""])].map((row) => row.map(csv).join(",")).join("\n") + "\n");
  console.table({ total: rows.length, ...counts, needsRepair: missing.length });
  console.log("Wrote reports/google-photo-availability.json");
  console.log("Wrote reports/google-photo-missing.csv");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
