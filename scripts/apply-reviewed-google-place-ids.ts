import fs from "node:fs";
import path from "node:path";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebase-admin";

type Row = {
  collection: "beaches" | "places";
  documentId: string;
  sourceName: string;
  googlePlaceId: string;
  googleName: string;
  googleAddress: string;
};
type Plan = { rows: Row[] };

const APPLY = process.argv.includes("--apply");
const planPath = path.join(process.cwd(), "reports", "google-place-resolution.json");

const APPROVED = new Set([
  "beaches/salt-pond-bay",
  "beaches/teague-bay",
  "places/STT-arian-s",
  "places/STT-artistic-villas-by-donald-schnell",
  "places/STT-at-home-in-the-tropics-b-b",
  "places/STT-beach-bar-and-grill-at-lindbergh-beach",
  "places/STT-beni-iguanas-sushi-bar",
  "places/STT-blue-11",
  "places/STT-bluebeard-s-castle-hilltop-villas-marriott-s-frenchman-s-cove-timeshares",
  "places/STT-bumpa-s",
  "places/STT-bungalows-on-the-bay-chenay",
  "places/STT-buoy-haus-beach-resort-at-frenchman-s-reef",
  "places/STT-caneel-bay-resort-currently-closed",
  "places/STT-carambola-beach-resort",
  "places/STT-carina-bay-campground-cane-bay",
  "places/STT-catered-to-vacation-homes",
  "places/STT-club-st-croix-beach-tennis-resort",
  "places/STT-concordia-eco-resort",
  "places/STT-cottages-by-the-sea",
  "places/STT-cruz-bay-boutique-hotel",
  "places/STT-divi-carina-bay-all-inclusive-beach-resort-casino",
  "places/STT-eco-serendib-villa-and-spa",
  "places/STT-estate-lindholm",
  "places/STT-feather-leaf-inn",
  "places/STT-gallows-point-resort",
  "places/STT-grande-bay-resort",
  "places/STT-island-view-guest-house",
  "places/STT-king-christian-hotel",
  "places/STT-lovango-resort-beach-club",
  "places/STT-maho-bay-camps",
  "places/STT-margaritaville-vacation-club-by-wyndham",
  "places/STT-mim-s-seafood-bistro",
  "places/STT-oceana-multicuisine",
  "places/STT-pangea-terra-table-farm-to-table",
  "places/STT-petit-pump-room",
  "places/STT-pizza-pi-floating-pizza-boat",
  "places/STT-ritz-carlton-club-timeshare",
  "places/STT-sand-castle-on-the-beach",
  "places/STT-sand-castle-on-the-beach-again",
  "places/STT-sibs-mountain-bar-restaurant",
  "places/STT-smoky-rooster",
  "places/STT-st-john-inn",
  "places/STT-the-buccaneer-hotel",
  "places/STT-the-fred",
  "places/STT-the-green-house",
  "places/STT-the-holger-danske-hotel",
  "places/STT-the-meat-up",
  "places/STT-the-waves-at-cane-bay",
  "places/STT-the-waves-cane-bay",
  "places/STT-the-westin-st-john-resort-villas",
  "places/STT-two-sandals-by-the-sea",
  "places/STT-virgilio-s-italian",
]);

const ISLAND_CORRECTIONS: Record<string, string> = {
  "STT-artistic-villas-by-donald-schnell": "STJ",
  "STT-bungalows-on-the-bay-chenay": "STX",
  "STT-caneel-bay-resort-currently-closed": "STJ",
  "STT-carambola-beach-resort": "STX",
  "STT-carina-bay-campground-cane-bay": "STX",
  "STT-catered-to-vacation-homes": "STJ",
  "STT-club-st-croix-beach-tennis-resort": "STX",
  "STT-concordia-eco-resort": "STJ",
  "STT-cottages-by-the-sea": "STX",
  "STT-cruz-bay-boutique-hotel": "STJ",
  "STT-divi-carina-bay-all-inclusive-beach-resort-casino": "STX",
  "STT-eco-serendib-villa-and-spa": "STJ",
  "STT-estate-lindholm": "STJ",
  "STT-feather-leaf-inn": "STX",
  "STT-gallows-point-resort": "STJ",
  "STT-grande-bay-resort": "STJ",
  "STT-king-christian-hotel": "STX",
  "STT-lovango-resort-beach-club": "STJ",
  "STT-maho-bay-camps": "STJ",
  "STT-sand-castle-on-the-beach": "STX",
  "STT-sand-castle-on-the-beach-again": "STX",
  "STT-st-john-inn": "STJ",
  "STT-the-buccaneer-hotel": "STX",
  "STT-the-fred": "STX",
  "STT-the-holger-danske-hotel": "STX",
  "STT-the-waves-at-cane-bay": "STX",
  "STT-the-waves-cane-bay": "STX",
  "STT-the-westin-st-john-resort-villas": "STJ",
};

async function main() {
  if (!fs.existsSync(planPath)) throw new Error("Missing reports/google-place-resolution.json.");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8")) as Plan;
  const rows = plan.rows.filter((row) => APPROVED.has(`${row.collection}/${row.documentId}`) && row.googlePlaceId);
  console.table({ reviewedMatches: rows.length, islandCorrections: rows.filter((row) => ISLAND_CORRECTIONS[row.documentId]).length, mode: APPLY ? "APPLY" : "DRY RUN" });
  if (!APPLY) {
    console.log("No Firestore documents changed. Re-run photos:reviewed:apply after checking the counts.");
    return;
  }
  const db = getAdminDb();
  const batch = db.batch();
  for (const row of rows) {
    const island = ISLAND_CORRECTIONS[row.documentId];
    batch.set(db.collection(row.collection).doc(row.documentId), {
      googlePlaceId: row.googlePlaceId,
      googlePlaceMatchStatus: "reviewed-approved",
      googlePlaceMatchedAt: FieldValue.serverTimestamp(),
      ...(island ? { island, islandCorrectedBy: "google-place-review" } : {}),
    }, { merge: true });
  }
  await batch.commit();
  console.log(`Applied ${rows.length} reviewed Google Place matches.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
