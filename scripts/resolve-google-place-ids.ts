import fs from "node:fs";
import path from "node:path";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebase-admin";

type CollectionName = "beaches" | "places";
type JsonRecord = Record<string, unknown>;
type Point = { latitude: number; longitude: number };
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: Point;
  types?: string[];
};
type ResolutionRow = {
  collection: CollectionName;
  documentId: string;
  sourceName: string;
  sourceIsland: string;
  sourceAddress: string;
  sourceLocation: Point | null;
  query: string;
  googlePlaceId: string;
  googleName: string;
  googleAddress: string;
  googleLocation: Point | null;
  score: number;
  nameScore: number;
  distanceKm: number | null;
  status: "auto-approved" | "review" | "not-found" | "error";
  error?: string;
};
type ResolutionPlan = {
  generatedAt: string;
  rows: ResolutionRow[];
};

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports", "google-place-resolution.json");
const REVIEW_PATH = path.join(ROOT, "reports", "google-place-resolution-review.csv");
const APPLY = process.argv.includes("--apply");
const KEY = process.env.GOOGLE_PLACES_API_KEY?.trim();

const ISLAND_NAMES: Record<string, string> = {
  STT: "St. Thomas",
  STJ: "St. John",
  STX: "St. Croix",
  WAT: "Water Island",
};
const ISLAND_CENTERS: Record<string, Point> = {
  STT: { latitude: 18.34, longitude: -64.93 },
  STJ: { latitude: 18.34, longitude: -64.74 },
  STX: { latitude: 17.74, longitude: -64.74 },
  WAT: { latitude: 18.32, longitude: -64.95 },
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function point(data: JsonRecord): Point | null {
  const nested = data.location && typeof data.location === "object"
    ? data.location as JsonRecord
    : {};
  const latitude = typeof data.lat === "number"
    ? data.lat
    : typeof data.latitude === "number"
      ? data.latitude
      : typeof nested.lat === "number"
        ? nested.lat
        : null;
  const longitude = typeof data.lng === "number"
    ? data.lng
    : typeof data.longitude === "number"
      ? data.longitude
      : typeof nested.lng === "number"
        ? nested.lng
        : null;
  return latitude === null || longitude === null ? null : { latitude, longitude };
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(the|restaurant|resort|hotel|beach|bar|grill|and|at|saint|st)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameSimilarity(a: string, b: string) {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;
  const aa = new Set(left.split(/\s+/));
  const bb = new Set(right.split(/\s+/));
  let overlap = 0;
  for (const token of aa) if (bb.has(token)) overlap += 1;
  return (2 * overlap) / (aa.size + bb.size);
}

function distanceKm(a: Point | null, b: Point | null) {
  if (!a || !b) return null;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const lat1 = a.latitude * rad;
  const lat2 = b.latitude * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function csv(value: unknown) {
  const output = String(value ?? "");
  return /[",\n]/.test(output) ? `"${output.replace(/"/g, '""')}"` : output;
}

function islandFromGoogleAddress(address: string) {
  if (/\bst\.?\s*croix\b/i.test(address)) return "STX";
  if (/\bst\.?\s*john\b/i.test(address)) return "STJ";
  if (/\b(?:st\.?|saint)\s*thomas\b/i.test(address)) return "STT";
  return "";
}

async function searchPlace(query: string, island: string) {
  const center = ISLAND_CENTERS[island] ?? ISLAND_CENTERS.STT;
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY!,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      regionCode: "US",
      maxResultCount: 3,
      locationBias: {
        circle: { center, radius: island === "STX" ? 42000 : 25000 },
      },
    }),
  });
  const payload = await response.json().catch(() => ({})) as { places?: GooglePlace[]; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || `Google Places returned ${response.status}.`);
  return payload.places ?? [];
}

async function resolveAll() {
  if (!KEY) throw new Error("GOOGLE_PLACES_API_KEY is missing.");
  const db = getAdminDb();
  const rows: ResolutionRow[] = [];
  for (const collectionName of ["beaches", "places"] as const) {
    const snapshot = await db.collection(collectionName).get();
    for (const document of snapshot.docs) {
      const data = document.data() as JsonRecord;
      const sourceName = text(data.name) || text(data.title) || document.id;
      const sourceIsland = text(data.island).toUpperCase();
      const nested = data.location && typeof data.location === "object" ? data.location as JsonRecord : {};
      const sourceAddress = text(data.address) || text(nested.address);
      const sourceLocation = point(data);
      const islandName = ISLAND_NAMES[sourceIsland] ?? sourceIsland;
      const query = [sourceName, sourceAddress, islandName, "U.S. Virgin Islands"].filter(Boolean).join(", ");
      try {
        const candidates = await searchPlace(query, sourceIsland);
        if (!candidates.length) {
          rows.push({ collection: collectionName, documentId: document.id, sourceName, sourceIsland, sourceAddress, sourceLocation, query, googlePlaceId: "", googleName: "", googleAddress: "", googleLocation: null, score: 0, nameScore: 0, distanceKm: null, status: "not-found" });
          continue;
        }
        const ranked = candidates.map((candidate) => {
          const googleName = text(candidate.displayName?.text);
          const googleLocation = candidate.location ?? null;
          const nameScore = nameSimilarity(sourceName, googleName);
          const distance = distanceKm(sourceLocation, googleLocation);
          const locationScore = distance === null ? 0.55 : distance <= 0.5 ? 1 : distance <= 2 ? 0.9 : distance <= 8 ? 0.65 : distance <= 25 ? 0.35 : 0;
          const score = nameScore * 0.78 + locationScore * 0.22;
          return { candidate, googleName, googleLocation, nameScore, distance, score };
        }).sort((a, b) => b.score - a.score);
        const best = ranked[0];
        const auto = best.nameScore >= 0.78 && best.score >= 0.76 && (best.distance === null || best.distance <= 25);
        rows.push({
          collection: collectionName,
          documentId: document.id,
          sourceName,
          sourceIsland,
          sourceAddress,
          sourceLocation,
          query,
          googlePlaceId: best.candidate.id ?? "",
          googleName: best.googleName,
          googleAddress: text(best.candidate.formattedAddress),
          googleLocation: best.googleLocation,
          score: Number(best.score.toFixed(4)),
          nameScore: Number(best.nameScore.toFixed(4)),
          distanceKm: best.distance === null ? null : Number(best.distance.toFixed(3)),
          status: auto ? "auto-approved" : "review",
        });
      } catch (error) {
        rows.push({ collection: collectionName, documentId: document.id, sourceName, sourceIsland, sourceAddress, sourceLocation, query, googlePlaceId: "", googleName: "", googleAddress: "", googleLocation: null, score: 0, nameScore: 0, distanceKm: null, status: "error", error: error instanceof Error ? error.message : String(error) });
      }
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }
  const plan: ResolutionPlan = { generatedAt: new Date().toISOString(), rows };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  const review = rows.filter((row) => row.status !== "auto-approved");
  const headings = ["collection", "documentId", "sourceName", "sourceIsland", "status", "score", "nameScore", "distanceKm", "googlePlaceId", "googleName", "googleAddress", "error"];
  fs.writeFileSync(REVIEW_PATH, [headings, ...review.map((row) => [row.collection, row.documentId, row.sourceName, row.sourceIsland, row.status, row.score, row.nameScore, row.distanceKm, row.googlePlaceId, row.googleName, row.googleAddress, row.error ?? ""])].map((row) => row.map(csv).join(",")).join("\n") + "\n");
  console.table({ total: rows.length, autoApproved: rows.filter((row) => row.status === "auto-approved").length, review: rows.filter((row) => row.status === "review").length, notFound: rows.filter((row) => row.status === "not-found").length, errors: rows.filter((row) => row.status === "error").length });
  console.log("No Firestore documents changed. Review reports/google-place-resolution-review.csv before applying.");
}

async function applyApproved() {
  if (!fs.existsSync(REPORT_PATH)) throw new Error("Run photos:resolve before photos:resolve:apply.");
  const plan = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")) as ResolutionPlan;
  const approved = plan.rows.filter((row) => {
    if (row.status !== "auto-approved" || !row.googlePlaceId) return false;
    if (row.sourceIsland === "WAT") return true;
    const googleIsland = islandFromGoogleAddress(row.googleAddress);
    return !googleIsland || googleIsland === row.sourceIsland;
  });
  const db = getAdminDb();
  for (let index = 0; index < approved.length; index += 450) {
    const batch = db.batch();
    for (const row of approved.slice(index, index + 450)) {
      batch.set(db.collection(row.collection).doc(row.documentId), {
        googlePlaceId: row.googlePlaceId,
        googlePlaceMatchStatus: "auto-approved",
        googlePlaceMatchedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
  }
  console.log(`Stored ${approved.length} approved Google Place IDs.`);
  console.log("Review rows and wrong-island matches were not written.");
}

(APPLY ? applyApproved() : resolveAll()).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
