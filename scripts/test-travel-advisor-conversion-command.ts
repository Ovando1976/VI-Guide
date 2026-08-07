import assert from "node:assert/strict";

import {
  summarizeTravelAdvisorFunnel,
  travelAdvisorConversionStage,
  travelAdvisorNextAction,
} from "../lib/travel-advisor-conversion";
import {
  summarizeTravelAdvisorBookings,
  type AdvisorCommerceBooking,
} from "../lib/travel-advisor-commerce";

function booking(
  status: AdvisorCommerceBooking["status"],
  paidAmountCents = 0,
): AdvisorCommerceBooking {
  return {
    id: `booking-${status}`,
    reference: `VI-${status}`,
    listingName: "Test booking",
    kind: "experience",
    status,
    paymentStatus: paidAmountCents > 0 ? "paid" : "unpaid",
    startDate: "2026-09-01",
    endDate: null,
    paidAmountCents,
    depositAmountCents: 5000,
    paymentHref: null,
    sourceProposalShareId: "abcdef123456",
    createdAt: "2026-08-07T12:00:00.000Z",
    updatedAt: "2026-08-07T13:00:00.000Z",
  };
}

function stageFor(
  status: string,
  proposalSentAt: string | null,
  commerceBookings: AdvisorCommerceBooking[],
) {
  return travelAdvisorConversionStage({
    status,
    proposalSentAt,
    commerceBookings,
    commerceSummary: summarizeTravelAdvisorBookings(commerceBookings),
  });
}

assert.equal(stageFor("new", null, []), "lead");
assert.equal(stageFor("reviewing", null, []), "planning");
assert.equal(
  stageFor("contacted", "2026-08-07T12:00:00.000Z", []),
  "proposal_sent",
);
assert.equal(stageFor("contacted", null, [booking("requested")]), "booking_requested");
assert.equal(
  stageFor("contacted", null, [booking("payment_required")]),
  "payment_required",
);
assert.equal(stageFor("contacted", null, [booking("paid", 5000)]), "paid");
assert.equal(stageFor("contacted", null, [booking("confirmed", 5000)]), "confirmed");
assert.equal(stageFor("contacted", null, [booking("completed", 5000)]), "completed");
assert.equal(
  stageFor("contacted", null, [booking("declined"), booking("cancelled")]),
  "needs_alternative",
);
assert.equal(stageFor("closed", null, [booking("confirmed", 5000)]), "closed");
assert.match(travelAdvisorNextAction("payment_required"), /payment/i);
assert.match(travelAdvisorNextAction("needs_alternative"), /alternative/i);

const empty = summarizeTravelAdvisorBookings([]);
const confirmed = summarizeTravelAdvisorBookings([booking("confirmed", 12000)]);
const funnel = summarizeTravelAdvisorFunnel([
  { proposalSentAt: "2026-08-07T12:00:00.000Z", commerceSummary: confirmed },
  { proposalSentAt: "2026-08-07T12:00:00.000Z", commerceSummary: empty },
  { proposalSentAt: null, commerceSummary: empty },
]);

assert.equal(funnel.leads, 3);
assert.equal(funnel.proposalsSent, 2);
assert.equal(funnel.bookingRequests, 1);
assert.equal(funnel.travelersWithBookings, 1);
assert.equal(funnel.confirmed, 1);
assert.equal(funnel.travelersConfirmed, 1);
assert.equal(funnel.paidAmountCents, 12000);
assert.equal(funnel.leadToProposalRate, 67);
assert.equal(funnel.proposalToBookingRate, 50);
assert.equal(funnel.bookingToConfirmationRate, 100);

console.log("Travel Advisor conversion command tests passed.");
