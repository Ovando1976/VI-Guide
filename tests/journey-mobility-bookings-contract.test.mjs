import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const component = fs.readFileSync("components/journey/journey-mobility-bookings.tsx", "utf8");
const wrapper = fs.readFileSync("components/journey/booking-aware-journey-planner.tsx", "utf8");

test("My Trip surfaces mobility booking checkout actions", () => {
  assert.match(component, /stop\.kind === "mobility_booking"/);
  assert.match(component, /stop\.bookingHref/);
  assert.match(component, /Continue ride/);
  assert.match(component, /readJourneyPlans/);
  assert.match(wrapper, /<JourneyMobilityBookings \/>/);
});
