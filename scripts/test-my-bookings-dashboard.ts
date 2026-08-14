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
  ['actionHref="/trips"', "My Trip uses the canonical traveler workspace"],
  ['actionLabel="My Trip"', "My Trip uses the shared traveler label"],
  ['secondaryHref="/planner"', "Journey Planner remains directly available"],
  ['secondaryLabel="Planner"', "Journey Planner keeps a distinct planning identity"],
] as const) {
  expectSource(bookingsPage, value, label);
}

if (bookingsPage.includes('actionHref="/planner"')) {
  throw new Error(
    "My Bookings dashboard contract failed: the primary My Trip action must not bypass /trips for /planner",
  );
}

for (const [value, label] of [
  ["readTrackedBookings", "dashboard reads validated local booking records"],
  ["TRACKED_BOOKINGS_UPDATED_EVENT", "dashboard reacts to local booking updates"],
  ["buildBookingStatusHref", "remembered cards reopen the canonical status route"],
  ["Opening one still performs the secure email + reference lookup", "local cards do not claim to be live server status"],
  ["Open live status", "cards clearly distinguish local memory from live status"],
  ["/images/usvi-harbor-hero.jpg", "dashboard stays in the USVI Explorer visual system"],
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
  ['href="/trips"', "live booking status continues into the canonical My Trip workspace"],
  ["Open synchronized trip", "synchronized booking status keeps the trip continuation label"],
  ["Open my trip", "unsynchronized booking status keeps the trip continuation label"],
] as const) {
  expectSource(statusLookup, value, label);
}

if (/href="\/planner"[\s\S]{0,260}(Open synchronized trip|Open my trip)/.test(statusLookup)) {
  throw new Error(
    "My Bookings dashboard contract failed: live booking status must not label Journey Planner as My Trip",
  );
}

for (const [value, label] of [
  ["const MAX_TRACKED_BOOKINGS = 8", "device history remains bounded"],
  ["normalizeTrackedBooking", "stored booking records remain validated before use"],
  ["safeInternalDestinationOrNull", "stored listing links remain internal-path sanitized"],
] as const) {
  expectSource(tracker, value, label);
}

console.log("USVI Explorer My Bookings dashboard contracts passed.");
