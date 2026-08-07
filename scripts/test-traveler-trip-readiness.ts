import assert from "node:assert/strict";

import { evaluateTravelerTripReadiness } from "../lib/traveler-trip-readiness";
import type { TravelerCommerceBooking } from "../lib/traveler-trip-command";
import type { IntelligenceActiveTrip } from "../types/intelligence";

const now = new Date("2026-08-07T21:00:00.000Z");

const readyTrip: IntelligenceActiveTrip = {
  id: "trip_stt_1",
  title: "St. Thomas weekend",
  island: "stt",
  date: "2026-08-10",
  status: "ready",
  updatedAt: now.toISOString(),
  stops: [
    {
      id: "stop_1",
      title: "Magens Bay",
      kind: "beach",
      startTime: "10:00",
    },
  ],
};

const empty = evaluateTravelerTripReadiness({
  bookings: [],
  now,
});
assert.equal(empty.status, "planning");
assert.equal(empty.tripDate, null);
assert.equal(empty.score, 45);
assert.equal(empty.items[0]?.id, "itinerary");

const ready = evaluateTravelerTripReadiness({
  activeTrip: readyTrip,
  bookings: [],
  now,
});
assert.equal(ready.status, "ready");
assert.equal(ready.score, 100);
assert.equal(ready.daysUntilTrip, 3);
assert.equal(ready.blockerCount, 0);

const paymentRequired = evaluateTravelerTripReadiness({
  activeTrip: readyTrip,
  bookings: [
    booking({
      status: "payment_required",
      depositAmountCents: 12500,
    }),
  ],
  now,
});
assert.equal(paymentRequired.status, "blocked");
assert.equal(paymentRequired.paymentRequiredCount, 1);
assert.equal(paymentRequired.blockerCount, 1);
assert.ok(paymentRequired.score < ready.score);
assert.equal(
  paymentRequired.items.find((item) => item.id === "payment")?.href,
  "/bookings?reference=VI-STAY-TEST-123456",
);

const unavailable = evaluateTravelerTripReadiness({
  activeTrip: readyTrip,
  bookings: [booking({ status: "declined" })],
  now,
});
assert.equal(unavailable.status, "blocked");
assert.match(
  unavailable.items.find((item) => item.id === "booking-availability")?.href ?? "",
  /^\/concierge\?open=true&prompt=/,
);

const closePending = evaluateTravelerTripReadiness({
  activeTrip: {
    ...readyTrip,
    date: "2026-08-08",
    status: "draft",
  },
  bookings: [booking({ status: "reviewing", startDate: "2026-08-08" })],
  now,
});
assert.equal(closePending.status, "attention");
assert.equal(closePending.daysUntilTrip, 1);
assert.ok(closePending.attentionCount >= 2);

const withProposal = evaluateTravelerTripReadiness({
  activeTrip: readyTrip,
  bookings: [],
  advisorTrips: [
    {
      id: "travel_123",
      reference: "VI-TRIP-20260807-ABC123",
      status: "planned",
      island: "stt",
      arrival: "2026-08-10",
      departure: "2026-08-12",
      proposalTitle: "Your St. Thomas plan",
      proposalHref: "/shared-trip/proposal123",
      proposalSentAt: "2026-08-07T20:00:00.000Z",
      updatedAt: "2026-08-07T20:00:00.000Z",
    },
  ],
  now,
});
assert.equal(withProposal.status, "ready");
assert.equal(
  withProposal.items.find((item) => item.id === "advisor")?.status,
  "done",
);

const past = evaluateTravelerTripReadiness({
  activeTrip: { ...readyTrip, date: "2026-08-01" },
  bookings: [],
  now,
});
assert.equal(past.status, "past");
assert.ok((past.daysUntilTrip ?? 0) < 0);

console.log("Traveler trip readiness tests passed.");

function booking(
  patch: Partial<TravelerCommerceBooking> = {},
): TravelerCommerceBooking {
  return {
    id: "booking_1",
    reference: "VI-STAY-TEST-123456",
    kind: "accommodation",
    listingName: "Island Stay",
    listingHref: "/accommodations/island-stay",
    island: "stt",
    startDate: "2026-08-10",
    endDate: "2026-08-12",
    status: "requested",
    paymentStatus: "unpaid",
    depositAmountCents: 0,
    paidAmountCents: 0,
    updatedAt: "2026-08-07T20:00:00.000Z",
    ...patch,
  };
}
