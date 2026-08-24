import "./test-official-taxi-fare-engine";

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  TAXI_DRIVER_SHARE_BPS,
  TAXI_DRIVER_SIGNUP_FEE_CENTS,
  TAXI_PLATFORM_COMMISSION_BPS,
  allocateTaxiRideCents,
} from "../lib/taxi-commission-policy";

const root = process.cwd();
const panel = fs.readFileSync(path.join(root, "components/booking-panel.tsx"), "utf8");
const bookingRoute = fs.readFileSync(path.join(root, "app/api/bookings/route.ts"), "utf8");
const serverBookings = fs.readFileSync(path.join(root, "lib/server-bookings.ts"), "utf8");
const taxiSettlement = fs.readFileSync(path.join(root, "lib/taxi-settlement.ts"), "utf8");
const legacyPayout = fs.readFileSync(path.join(root, "lib/payouts.ts"), "utf8");
const driverEconomics = fs.readFileSync(
  path.join(root, "components/mobility/driver-economics-policy.tsx"),
  "utf8",
);
const driverPage = fs.readFileSync(path.join(root, "app/driver/page.tsx"), "utf8");

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) throw new Error(`Taxi confidence contract failed: ${label}`);
}

expectSource(panel, "Share the ride with other passengers", "shared rides are clearly described");
expectSource(panel, "No surge or distance-based substitute", "non-governed fare substitution is prohibited in the review UI");
expectSource(panel, 'paymentMethod:"online_card"', "payment expectations remain explicit before checkout");
expectSource(panel, "Need to catch something? (optional)", "travelers can record a critical connection");
expectSource(panel, "Your driver assignment confirms availability", "schedule semantics remain honest");
expectSource(bookingRoute, "optionalFutureDate", "schedule fields are validated server-side");
expectSource(bookingRoute, 'paymentMethod: "online_card"', "server controls the payment method record");
expectSource(serverBookings, "serviceExpectation", "trip records preserve shared/direct expectations");
expectSource(panel, "Pickup note (optional)", "travelers can provide exact pickup guidance");
expectSource(panel, "Drop-off note (optional)", "travelers can provide destination guidance");
expectSource(panel, "Verified fare for this trip", "fare review remains prominent");
expectSource(panel, 'id="trip-review"', "review action has a stable target");
expectSource(panel, "We will not guess or substitute a fare", "missing governed fares fail closed in traveler language");
expectSource(bookingRoute, "cleanInstructions", "location instructions are normalized server-side");
expectSource(bookingRoute, "pickupInstructions ? { notes: pickupInstructions }", "pickup instructions reach dispatch records");

assert.equal(TAXI_DRIVER_SIGNUP_FEE_CENTS, 0, "driver signup must remain free");
assert.equal(TAXI_PLATFORM_COMMISSION_BPS, 1_500, "taxi commission must remain 15%");
assert.equal(TAXI_DRIVER_SHARE_BPS, 8_500, "driver ride share must remain 85%");
assert.deepEqual(allocateTaxiRideCents(10_000), {
  grossAmountCents: 10_000,
  platformCommissionCents: 1_500,
  driverShareCents: 8_500,
});
assert.deepEqual(allocateTaxiRideCents(1_001), {
  grossAmountCents: 1_001,
  platformCommissionCents: 150,
  driverShareCents: 851,
});

expectSource(taxiSettlement, "TAXI_PLATFORM_COMMISSION_RATE", "completion settlement uses the fixed taxi policy");
expectSource(taxiSettlement, "TAXI_FEE_AGREEMENT_ID", "completion settlement records the fixed 15% agreement");
assert.doesNotMatch(
  taxiSettlement,
  /process\.env\.TAXI_PLATFORM_COMMISSION_RATE/,
  "taxi commission must not be silently overridden by environment configuration",
);
expectSource(legacyPayout, "TAXI_PLATFORM_COMMISSION_RATE", "legacy payout helper no longer defaults to 20%");
assert.doesNotMatch(legacyPayout, /\?\?\s*0\.2/, "the stale 20% payout default must not return");
expectSource(driverEconomics, "No signup fee", "driver UI states that joining is free");
expectSource(driverEconomics, "TAXI_PLATFORM_COMMISSION_BPS", "driver UI reads the platform commission from policy");
expectSource(driverEconomics, "TAXI_DRIVER_SHARE_BPS", "driver UI reads the driver share from policy");
expectSource(driverEconomics, "remain pending", "driver UI does not misstate reviewed earnings as immediately payable");
expectSource(driverPage, "DriverEconomicsPolicy", "driver economics policy is visible in Driver OS");

console.log("USVI Explorer taxi confidence contracts passed.");
