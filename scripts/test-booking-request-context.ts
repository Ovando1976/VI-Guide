import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bookPage = fs.readFileSync(path.join(root, "app/book/page.tsx"), "utf8");
const bookingExperience = fs.readFileSync(
  path.join(root, "components/booking/commerce-booking-experience.tsx"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Booking request context contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "booking page keeps shared public chrome"],
  ['actionHref="/bookings"', "booking page keeps My Bookings handoff"],
  ['secondaryHref="/planner"', "booking page keeps My Trip handoff"],
  ["safeInternalDestinationOrNull", "listing return paths stay sanitized"],
  ["getTravelKnowledge", "booking visuals resolve from canonical travel knowledge"],
  ["GooglePlacePhoto", "Google listing imagery keeps attribution-aware rendering"],
  ["Verified listing context", "resolved catalog imagery is labeled honestly"],
  ["Island context", "unresolved imagery is labeled as island context"],
  ["item.id === key || item.slug === key", "catalog matching stays exact by id or slug"],
  ["item.island === island", "catalog matching remains island scoped"],
  ["/images/usvi-harbor-hero.jpg", "St. Thomas context fallback remains available"],
  ["/images/places/st-john/trunk-bay-overlook-1.jpg", "St. John context fallback remains available"],
  ["/images/places/st-croix/cane-bay-beach-1.jpg", "St. Croix context fallback remains available"],
] as const) {
  expectSource(bookPage, value, label);
}

for (const [value, label] of [
  ['fetch("/api/commerce-bookings"', "commerce request endpoint remains unchanged"],
  ["normalizeProposalShareId", "Travel Advisor proposal linkage remains intact"],
  ["rememberTrackedBooking", "device booking tracking remains intact"],
  ["buildBookingPlannerHref", "confirmation still supports planner handoff"],
  ["buildBookingStatusHref", "confirmation still supports status lookup"],
  ["sourceProposalShareId", "proposal identity remains in booking payload"],
  ["Submission does not guarantee availability or create a charge.", "request semantics remain non-confirming and non-charging"],
] as const) {
  expectSource(bookingExperience, value, label);
}

console.log("USVI Explorer booking request context contracts passed.");
