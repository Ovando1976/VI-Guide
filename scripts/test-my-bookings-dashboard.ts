import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bookingsPage = fs.readFileSync(
  path.join(root, "app/bookings/page.tsx"),
  "utf8",
);
const rememberedPanel = fs.readFileSync(
  path.join(root, "components/booking/remembered-bookings-panel.tsx"),
  "utf8",
);
const statusLookup = fs.readFileSync(
  path.join(root, "components/booking/booking-status-lookup.tsx"),
  "utf8",
);
const tracker = fs.readFileSync(
  path.join(root, "lib/booking/booking-tracker.ts"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`My Bookings dashboard contract failed: ${label}`);
  }
}

for (const [value, label] of [
  ["ViPublicHeader", "My Bookings keeps shared public chrome"],
  ["RememberedBookingsPanel", "My Bookings surfaces remembered requests"],
  ["CommercePaymentReturnNotice", "Stripe return verification stays ahead of booking lookup"],
  ["BookingStatusLookup", "secure live status lookup remains present"],
  ['actionHref="/planner"', "My Trip remains a primary continuation"],
] as const) {
  expectSource(bookingsPage, value, label);
}

for (const [value, label] of [
  ["readTrackedBookings", "dashboard reads validated local booking records"],
  ["TRACKED_BOOKINGS_UPDATED_EVENT", "dashboard reacts to local booking updates"],
  ["buildBookingStatusHref", "remembered cards reopen the canonical status route"],
  ["Opening one still performs the secure email + reference lookup", "local cards do not claim to be live server status"],
  ["Open live status", "cards clearly distinguish local memory from live status"],
  ["/images/usvi-harbor-hero.jpg", "dashboard stays in the VI Guide visual system"],
] as const) {
  expectSource(rememberedPanel, value, label);
}

if (rememberedPanel.includes("booking.email")) {
  throw new Error(
    "My Bookings dashboard contract failed: remembered cards must not render the stored lookup email",
  );
}

for (const [value, label] of [
  ['fetch("/api/commerce-bookings/status"', "live status still comes from the secure status API"],
  ["reference: normalizedReference", "status lookup still submits the normalized reference"],
  ["email: normalizedEmail", "status lookup still submits the normalized email"],
  ["15_000", "live booking status polling remains active"],
  ['fetch("/api/payments/create-checkout-session"', "deposit checkout remains server initiated"],
  ["syncBookingJourneyWithStatus", "live status still synchronizes into My Trip"],
] as const) {
  expectSource(statusLookup, value, label);
}

for (const [value, label] of [
  ["const MAX_TRACKED_BOOKINGS = 8", "device history remains bounded"],
  ["normalizeTrackedBooking", "stored booking records remain validated before use"],
  ["safeInternalDestinationOrNull", "stored listing links remain internal-path sanitized"],
] as const) {
  expectSource(tracker, value, label);
}

console.log("VI Guide My Bookings dashboard contracts passed.");
