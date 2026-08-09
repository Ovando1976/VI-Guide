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

test("My Trip synchronizes live ride lifecycle from the booking API", () => {
  assert.match(component, /\/api\/bookings\//);
  assert.match(component, /cache: "no-store"/);
  assert.match(component, /15000/);
  assert.match(component, /Payment needed/);
  assert.match(component, /Driver assigned/);
  assert.match(component, /Driver en route/);
  assert.match(component, /Driver arrived/);
  assert.match(component, /Trip underway/);
  assert.match(component, /Completed/);
  assert.match(component, /Cancelled/);
});
