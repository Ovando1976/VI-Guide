import assert from "node:assert/strict";

import {
  buildBookingStatusHref,
  createSynchronizedBookingJourneyPlan,
  mergeTrackedBookings,
  normalizeTrackedBooking,
  type BookingStatusSnapshot,
} from "../lib/booking/booking-tracker";
import type { JourneyPlan } from "../lib/journey-planner";

const tracked = normalizeTrackedBooking({
  bookingId: "booking_123",
  reference: " vi-stay-me7f3k-ab12 ",
  email: " Traveler@Example.com ",
  status: "requested",
  kind: "accommodation",
  island: "stt",
  listingId: "ritz-carlton-st-thomas",
  listingName: "The Ritz-Carlton, St. Thomas",
  startDate: "2026-09-10",
  endDate: "2026-09-14",
  listingHref: "https://evil.example/steal",
  updatedAt: "2026-08-05T12:00:00.000Z",
});

assert.ok(tracked);
assert.equal(tracked.reference, "VI-STAY-ME7F3K-AB12");
assert.equal(tracked.email, "traveler@example.com");
assert.equal(tracked.listingHref, undefined);

assert.equal(
  normalizeTrackedBooking({
    ...tracked,
    reference: "VI-TOUR-ME7F3K-AB12",
  }),
  null,
  "reference prefix must match the booking kind",
);

const newer = {
  ...tracked,
  status: "confirmed" as const,
  updatedAt: "2026-08-06T12:00:00.000Z",
};
const merged = mergeTrackedBookings([tracked], newer);
assert.equal(merged.length, 1);
assert.equal(merged[0]?.status, "confirmed");
assert.equal(merged[0]?.updatedAt, "2026-08-06T12:00:00.000Z");

const statusHref = buildBookingStatusHref(tracked.reference);
assert.equal(statusHref, "/bookings?reference=VI-STAY-ME7F3K-AB12");
assert.equal(statusHref.includes("email="), false);

const requested = booking({ status: "requested" });
const requestedPlan = createSynchronizedBookingJourneyPlan(
  requested,
  null,
  new Date("2026-08-05T12:00:00.000Z"),
);
assert.ok(requestedPlan);
assert.equal(requestedPlan.status, "draft");
assert.match(requestedPlan.notes, /Request received/);
assert.match(requestedPlan.plan[0]?.summary ?? "", /awaiting review/);
assert.equal(
  requestedPlan.plan[0]?.bookingHref,
  "/bookings?reference=VI-STAY-ME7F3K-AB12",
);

const extraStop = {
  id: "place-magens-bay",
  placeId: "magens-bay",
  title: "Magens Bay",
  island: "stt" as const,
  kind: "beach",
  summary: "Beach stop after check-in.",
};
const customized: JourneyPlan = {
  ...requestedPlan,
  title: "Our St. Thomas arrival day",
  notes: `${requestedPlan.notes}\n\nPick up groceries before the hotel.`,
  plan: [...requestedPlan.plan, extraStop],
};
const confirmedPlan = createSynchronizedBookingJourneyPlan(
  booking({ status: "confirmed" }),
  customized,
  new Date("2026-08-06T12:00:00.000Z"),
);
assert.ok(confirmedPlan);
assert.equal(confirmedPlan.status, "ready");
assert.equal(confirmedPlan.title, "Our St. Thomas arrival day");
assert.equal(confirmedPlan.plan.length, 2);
assert.equal(confirmedPlan.plan[1]?.id, "place-magens-bay");
assert.match(confirmedPlan.notes, /Confirmed/);
assert.match(confirmedPlan.notes, /Pick up groceries/);
assert.equal(
  (confirmedPlan.notes.match(/Booking VI-STAY-ME7F3K-AB12 status:/g) ?? [])
    .length,
  1,
  "status synchronization must remain idempotent",
);

const cancelledPlan = createSynchronizedBookingJourneyPlan(
  booking({ status: "cancelled" }),
  confirmedPlan,
  new Date("2026-08-07T12:00:00.000Z"),
);
assert.ok(cancelledPlan);
assert.equal(cancelledPlan.status, "draft");
assert.match(cancelledPlan.plan[0]?.summary ?? "", /cancelled/i);
assert.match(cancelledPlan.plan[0]?.summary ?? "", /remove or replace/i);

console.log("Booking tracker tests passed.");

function booking(
  overrides: Partial<BookingStatusSnapshot> = {},
): BookingStatusSnapshot {
  return {
    id: "booking_123",
    reference: "VI-STAY-ME7F3K-AB12",
    status: "requested",
    kind: "accommodation",
    listingId: "ritz-carlton-st-thomas",
    listingName: "The Ritz-Carlton, St. Thomas",
    listingHref: "/accommodations/ritz-carlton-st-thomas?island=stt",
    island: "stt",
    startDate: "2026-09-10",
    endDate: "2026-09-14",
    preferredTime: null,
    adults: 2,
    children: 0,
    updatedAt: "2026-08-05T12:00:00.000Z",
    paymentStatus: null,
    refundStatus: null,
    refundAmountCents: 0,
    refundRequestedAt: null,
    refundUpdatedAt: null,
    merchantNote: null,
    proposedTime: null,
    depositAmountCents: 0,
    paidAmountCents: 0,
    paymentHref: null,
    ...overrides,
  };
}
