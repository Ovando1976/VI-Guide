import fs from "node:fs";
import path from "node:path";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebase-admin";

type AuditStatus = "missing" | "generic" | "broken-local" | "remote" | "valid-local";
type AuditRow = {
  collection: "beaches" | "places";
  id: string;
  name: string;
  island: string;
  category: string;
  currentImage: string;
  status: AuditStatus;
  candidates: string[];
};
type AuditReport = { rows: AuditRow[] };

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports", "directory-image-audit.json");
const PLAN_PATH = path.join(ROOT, "reports", "directory-image-repair-plan.json");
const APPLY = process.argv.includes("--apply");

// Only use an existing photograph when the asset identifies the same property
// or shoreline. Similar words alone are intentionally not enough.
const VERIFIED_LOCAL_MATCHES: Record<string, string> = {
  "beaches/bolongo-bay": "/images/accommodations/bolongo-bay-beach-resort.jpg",
  "beaches/buccaneer-beach": "/images/accommodations/the-buccaneer-hotel.jpg",
  "beaches/hull-bay": "/images/accommodations/the-hideaway-at-hull-bay.jpg",
  "beaches/lindbergh-bay": "/images/accommodations/lindbergh-bay-hotel-villas.jpg",
  "beaches/protestant-cay": "/images/accommodations/hotel-on-the-cay.jpg",
  "beaches/sapphire-beach": "/images/accommodations/sapphire-beach-resort-and-marina.jpg",
  "beaches/secret-harbor": "/images/accommodations/secret-harbour-beach-resort.jpg",
  "beaches/tamarind-reef": "/images/accommodations/tamarind-reef-resort-spa-marina.jpg",
  "places/STT-bluebeard-s-castle-resort": "/images/accommodations/bluebeards-castle-resort.jpg",
  "places/STT-buoy-haus-beach-resort-at-frenchman-s-reef": "/images/accommodations/buoy-haus-st-thomas-beach-resort-autograph-collection.jpg",
  "places/STT-frenchman-s-cove": "/images/accommodations/marriotts-frenchmans-cove.jpg",
};

const ISLAND_LABEL: Record<string, string> = {
  STT: "St. Thomas",
  STJ: "St. John",
  STX: "St. Croix",
  WAT: "Water Island",
};

const PALETTES: Record<string, [string, string, string]> = {
  STT: ["#043331", "#0f766e", "#f5b942"],
  STJ: ["#063b32", "#0ea5a0", "#f6c85f"],
  STX: ["#082f49", "#0369a1", "#f59e0b"],
  WAT: ["#164e63", "#06b6d4", "#fde68a"],
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "location";
}

function wrapTitle(value: string) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > 28 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function coverPath(row: AuditRow) {
  return `/images/directory/${row.collection}/${safeSlug(row.id)}.svg`;
}

function createCover(row: AuditRow, destination: string) {
  const [dark, aqua, gold] = PALETTES[row.island] ?? PALETTES.STT;
  const titleLines = wrapTitle(row.name);
  const title = titleLines
    .map((line, index) =>
      `<tspan x="72" dy="${index === 0 ? 0 : 66}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  const eyebrow = row.collection === "beaches" ? "BEACH" : (row.category || "PLACE").toUpperCase();
  const island = ISLAND_LABEL[row.island] ?? row.island;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(row.name)}</title>
  <desc id="description">USVI Explorer location cover for ${escapeXml(row.name)} on ${escapeXml(island)}</desc>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="0.62" stop-color="${aqua}"/><stop offset="1" stop-color="#67e8f9"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#99f6e4" stop-opacity=".9"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="30"/></filter>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <circle cx="970" cy="150" r="92" fill="${gold}" opacity=".95"/>
  <circle cx="950" cy="130" r="150" fill="#fff" opacity=".12" filter="url(#soft)"/>
  <path d="M0 430 C170 370 300 465 470 420 C650 370 805 390 1200 300 L1200 800 L0 800Z" fill="url(#sea)"/>
  <path d="M0 570 C210 500 370 625 590 555 C790 490 945 560 1200 485" fill="none" stroke="#fff" stroke-opacity=".62" stroke-width="12"/>
  <path d="M735 434 C815 300 930 282 1040 407 C943 380 836 392 735 434Z" fill="${dark}" opacity=".88"/>
  <rect x="50" y="48" width="1100" height="704" rx="42" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>
  <text x="72" y="104" fill="${gold}" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="8">VI GUIDE · ${escapeXml(eyebrow)}</text>
  <text x="72" y="520" fill="#fff" font-family="Arial, sans-serif" font-size="58" font-weight="800">${title}</text>
  <text x="74" y="706" fill="#fff" fill-opacity=".86" font-family="Arial, sans-serif" font-size="25" font-weight="600" letter-spacing="4">${escapeXml(island.toUpperCase())} · U.S. VIRGIN ISLANDS</text>
</svg>`;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, svg);
}

function main() {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Missing ${path.relative(ROOT, REPORT_PATH)}. Run npm run images:audit first.`);
  }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")) as AuditReport;
  const repairRows = report.rows.filter((row) =>
    ["missing", "generic", "broken-local"].includes(row.status),
  );
  const plan = repairRows.map((row) => {
    const key = `${row.collection}/${row.id}`;
    const verified = VERIFIED_LOCAL_MATCHES[key];
    const imageUrl = verified ?? coverPath(row);
    return {
      ...row,
      imageUrl,
      strategy: verified ? "verified-local-photo" : "branded-location-cover",
    };
  });
  fs.mkdirSync(path.dirname(PLAN_PATH), { recursive: true });
  fs.writeFileSync(PLAN_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, rows: plan }, null, 2)}\n`);

  const summary = {
    records: plan.length,
    verifiedLocalPhotos: plan.filter((row) => row.strategy === "verified-local-photo").length,
    brandedLocationCovers: plan.filter((row) => row.strategy === "branded-location-cover").length,
    mode: APPLY ? "APPLY" : "DRY RUN",
  };
  console.table(summary);
  console.log("Wrote reports/directory-image-repair-plan.json");
  if (!APPLY) {
    console.log("No files or Firestore documents changed. Re-run with --apply after reviewing the plan.");
    return;
  }

  for (const row of plan) {
    if (row.strategy !== "branded-location-cover") continue;
    createCover(row, path.join(ROOT, "public", row.imageUrl.replace(/^\//, "")));
  }

  const db = getAdminDb();
  const batch = db.batch();
  for (const row of plan) {
    const reference = db.collection(row.collection).doc(row.id);
    batch.set(reference, {
      imageUrl: row.imageUrl,
      imageReviewStatus: row.strategy,
      imageUpdatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  return batch.commit().then(() => {
    console.log(`Updated ${plan.length} Firestore records.`);
    console.log("Generated branded covers under public/images/directory/.");
  });
}

Promise.resolve(main()).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
