import assert from "node:assert/strict";

import {
  advisorCommerceStatusLabel,
  normalizeAdvisorCommerceStatus,
  serializeAdvisorCommerceBooking,
  summarizeTravelAdvisorBookings,
} from "../lib/travel-advisor-commerce";

const requested = serializeAdvisorCommerceBooking("booking_requested", {
  reference: "VI-STAY-REQUESTED",
  listingName: "Harbor View Stay",
  kind: "accommodation",
  status: "requested",
  paymentStatus: "unpaid",
  startDate: "2026-10-10",
  endDate: "2026-10-14",
  depositAmountCents: 25000,
  paidAmountCents: 0,
  sourceProposalShareId: "ProposalABC123",
  updatedAt: "2026-08-07T20:00:00.000Z",
});

const paymentRequired = serializeAdvisorCommerceBooking("booking_payment", {
  reference: "VI-TOUR-PAYMENT",
  listingName: "Island Tour",
  kind: "tour",
  status: "payment_required",
  paymentStatus: "unpaid",
  startDate: "2026-10-12",
  depositAmountCents: 15000,
  paidAmountCents: 0,
  paymentHref: "/checkout/booking_payment",
  sourceProposalShareId: "ProposalABC123",
  updatedAt: "2026-08-07T21:00:00.000Z",
});

const confirmed = serializeAdvisorCommerceBooking("booking_confirmed", {
  reference: "VI-EXP-CONFIRMED",
  listingName: "Sunset Sail",
  kind: "experience",
  status: "confirmed",
  paymentStatus: "paid",
  startDate: "2026-10-13",
  paidAmountCents: 32000,
  paymentHref: "https://evil.example/checkout",
  sourceProposalShareId: "ProposalABC123",
  updatedAt: "2026-08-07T22:00:00.000Z",
});

const summary = summarizeTravelAdvisorBookings([
  requested,
  paymentRequired,
  confirmed,
]);

assert.equal(summary.totalBookings, 3);
assert.equal(summary.activeBookings, 3);
assert.equal(summary.paymentRequired, 1);
assert.equal(summary.paidBookings, 1);
assert.equal(summary.confirmedBookings, 1);
assert.equal(summary.completedBookings, 0);
assert.equal(summary.paidAmountCents, 32000);
assert.equal(summary.latestStatus, "confirmed");
assert.equal(paymentRequired.paymentHref, "/checkout/booking_payment");
assert.equal(confirmed.paymentHref, null);
assert.equal(normalizeAdvisorCommerceStatus("garbage"), "requested");
assert.equal(advisorCommerceStatusLabel("payment_required"), "Payment Required");

console.log("Travel Advisor booking revenue loop tests passed.");
