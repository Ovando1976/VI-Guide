import "./test-official-taxi-fare-engine";

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, "components/booking-panel.tsx"), "utf8");
const lifecycle = fs.readFileSync(
  path.join(root, "components/mobility/ride-confirmation-lifecycle.tsx"),
  "utf8",
);
const bookingRoute = fs.readFileSync(path.join(root, "app/api/bookings/route.ts"), "utf8");
const serverBookings = fs.readFileSync(path.join(root, "lib/server-bookings.ts"), "utf8");

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Taxi confidence contract failed: ${label}`);
  }
}

function expectPattern(source: string, pattern: RegExp, label: string) {
  if (!pattern.test(source)) {
    throw new Error(`Taxi confidence contract failed: ${label}`);
  }
}

expectSource(
  panel,
  "Share the ride with other passengers",
  "shared rides are clearly described",
);
expectSource(
  panel,
  "No surge or distance-based substitute",
  "non-governed fare substitution is prohibited in the review UI",
);
expectPattern(
  panel,
  /paymentMethod\s*:\s*["']online_card["']/,
  "payment expectations remain explicit before checkout",
);
expectSource(
  panel,
  "Need to catch something? (optional)",
  "travelers can record a critical connection",
);
expectPattern(
  panel,
  /driver assignment.{0,80}(confirms availability|ride becomes confirmed)/i,
  "driver assignment remains the confirmation boundary",
);
expectSource(
  bookingRoute,
  "optionalFutureDate",
  "schedule fields are validated server-side",
);
expectPattern(
  bookingRoute,
  /paymentMethod\s*:\s*["']online_card["']/,
  "server controls the payment method record",
);
expectSource(
  serverBookings,
  "serviceExpectation",
  "trip records preserve shared/direct expectations",
);
expectSource(
  panel,
  "Pickup note (optional)",
  "travelers can provide exact pickup guidance",
);
expectSource(
  panel,
  "Drop-off note (optional)",
  "travelers can provide destination guidance",
);
expectPattern(
  panel,
  /(Verified|Governed) fare for this trip/,
  "fare review remains prominent",
);
expectSource(panel, 'id="trip-review"', "review action has a stable target");
expectPattern(
  panel,
  /We will not guess(?:, estimate,)? or substitute a fare/,
  "missing governed fares fail closed in traveler language",
);
expectSource(
  panel,
  "Confirm ride request",
  "traveler gets an explicit final confirmation action",
);
expectPattern(
  `${panel}\n${lifecycle}`,
  /Payment starts dispatch/i,
  "payment is described as starting dispatch rather than confirming a driver",
);
expectPattern(
  lifecycle,
  /ride becomes confirmed|ride becomes confirmed only|point when the ride becomes confirmed/i,
  "driver assignment is the explicit ride-confirmation boundary",
);
expectSource(
  bookingRoute,
  "cleanInstructions",
  "location instructions are normalized server-side",
);
expectSource(
  bookingRoute,
  "pickupInstructions ? { notes: pickupInstructions }",
  "pickup instructions reach dispatch records",
);

console.log("USVI Explorer taxi confidence contracts passed.");
