import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedTripPage = fs.readFileSync(
  path.join(root, "app/shared-trip/[shareId]/page.tsx"),
  "utf8",
);

function expectSource(value: string, label: string) {
  if (!sharedTripPage.includes(value)) {
    throw new Error(`Shared trip shell contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "shared trips stay inside the USVI Explorer public shell"],
  ['actionHref="/planner"', "shared trips keep My Trip continuation"],
  ['secondaryHref="/concierge"', "shared trips keep Concierge continuation"],
  ["ISLAND_CONTEXT_IMAGES", "shared trip hero remains island-context aware"],
  ["/images/usvi-harbor-hero.jpg", "St. Thomas context imagery remains available"],
  ["/images/places/st-john/trunk-bay-overlook-1.jpg", "St. John context imagery remains available"],
  ["/images/places/st-croix/cane-bay-beach-1.jpg", "St. Croix context imagery remains available"],
  ["Island context ·", "context photography remains labeled honestly"],
  ['export const dynamic = "force-dynamic"', "shared trip lookup stays dynamic"],
  ["hasFirebaseAdminConfiguration", "Firebase Admin configuration remains required"],
  ["/^[a-zA-Z0-9]{12,40}$/", "share IDs remain validated before lookup"],
  ['collection("sharedJourneys")', "shared journey Firestore collection remains canonical"],
  ["normalizeJourneyPlan", "stored shared journey data remains normalized"],
  ['data.source === "travel_advisor_proposal"', "Travel Advisor proposal identity remains explicit"],
  ["data.proposalVersion", "proposal versioning remains intact"],
  ["buildTravelAdvisorBookingHref", "advisor proposal stops keep booking-link generation"],
  ["SaveSharedJourneyButton", "shared journeys remain savable into the traveler trip"],
  ["buildJourneyMapHref", "shared journeys keep the Living Map handoff"],
  ["A request does not", "proposal booking copy remains non-confirming"],
  ["guarantee availability and does not", "proposal booking copy remains non-guaranteeing"],
  ["create a charge", "proposal booking copy remains non-charging"],
  ["Prepared through the USVI Explorer Travel Advisor workflow", "advisor disclosure remains visible"],
  ["This is a planning proposal for review, not a confirmation.", "proposal remains explicitly read-only planning"],
] as const) {
  expectSource(value, label);
}

console.log("USVI Explorer shared trip traveler shell contracts passed.");
