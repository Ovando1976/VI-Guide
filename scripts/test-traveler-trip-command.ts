import assert from "node:assert/strict";

import {
  bookingHref,
  serializeTravelerAdvisorTrip,
  serializeTravelerCommerceBooking,
  summarizeTravelerTrip,
} from "@/lib/traveler-trip-command";

const requested = serializeTravelerCommerceBooking("booking_1", {
  reference: "VI-EXP-ABC123",
  kind: "experience",
  listingName: "Island sail",
  listingHref: "/experiences/island-sail",
  island: "stt",
  startDate: "2026-08-20",
  status: "requested",
  paymentStatus: "unpaid",
  depositAmountCents: 0,
  paidAmountCents: 0,
  updatedAt: "2026-08-07T12:00:00.000Z",
});
assert.ok(requested);
assert.equal(requested.status, "requested");
assert.equal(bookingHref(requested.reference), "/bookings?reference=VI-EXP-ABC123");

const payment = serializeTravelerCommerceBooking("booking_2", {
  reference: "VI-TOUR-PAY123",
  kind: "tour",
  listingName: "North Shore tour",
  island: "stj",
  startDate: "2026-08-22",
  status: "payment_required",
  paymentStatus: "unpaid",
  depositAmountCents: 12500,
  paidAmountCents: 0,
  updatedAt: "2026-08-07T13:00:00.000Z",
});
assert.ok(payment);

const confirmed = serializeTravelerCommerceBooking("booking_3", {
  reference: "VI-STAY-CONF123",
  kind: "accommodation",
  listingName: "Harbor stay",
  island: "stt",
  startDate: "2026-08-19",
  endDate: "2026-08-23",
  status: "confirmed",
  paymentStatus: "paid",
  depositAmountCents: 25000,
  paidAmountCents: 25000,
  updatedAt: "2026-08-07T14:00:00.000Z",
});
assert.ok(confirmed);

const proposal = serializeTravelerAdvisorTrip("travel_123", {
  reference: "VI-TRIP-20260807-ABC123",
  status: "contacted",
  island: "stt",
  proposalTitle: "Five days on St. Thomas",
  proposalHref: "/shared-trip/proposal_123",
  proposalSentAt: "2026-08-07T11:00:00.000Z",
  updatedAt: "2026-08-07T11:00:00.000Z",
});
assert.ok(proposal);

const paymentSummary = summarizeTravelerTrip({
  bookings: [requested, confirmed, payment],
  advisorTrips: [proposal],
  journeyPlanCount: 2,
  journeyStopCount: 7,
});
assert.equal(paymentSummary.activeBookings, 3);
assert.equal(paymentSummary.paymentRequired, 1);
assert.equal(paymentSummary.confirmedBookings, 1);
assert.equal(paymentSummary.paidAmountCents, 25000);
assert.equal(paymentSummary.nextAction.label, "Payment ready");
assert.equal(paymentSummary.nextAction.cta, "Complete payment");
assert.match(paymentSummary.nextAction.detail, /\$125\.00/);

const proposalSummary = summarizeTravelerTrip({
  bookings: [],
  advisorTrips: [proposal],
  journeyPlanCount: 1,
  journeyStopCount: 3,
});
assert.equal(proposalSummary.nextAction.label, "Your advisor proposal is ready");
assert.equal(proposalSummary.nextAction.href, "/shared-trip/proposal_123");

const journeySummary = summarizeTravelerTrip({
  bookings: [],
  advisorTrips: [],
  journeyPlanCount: 2,
  journeyStopCount: 5,
});
assert.equal(journeySummary.nextAction.label, "Keep building your trip");
assert.equal(journeySummary.nextAction.href, "/planner");

const emptySummary = summarizeTravelerTrip({
  bookings: [],
  advisorTrips: [],
});
assert.equal(emptySummary.nextAction.label, "Start your Virgin Islands trip");
assert.equal(emptySummary.nextAction.href, "/places");

assert.equal(
  serializeTravelerCommerceBooking("bad", {
    reference: "VI-EXP-BAD",
    kind: "unknown",
    listingName: "Bad record",
    island: "stt",
    startDate: "2026-08-20",
    status: "requested",
  }),
  null,
);

console.log("Traveler trip command center tests passed.");
