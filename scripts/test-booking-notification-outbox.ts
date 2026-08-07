import assert from "node:assert/strict";

import type { OfficialCruisePortCall } from "../lib/cruise-port-calls";
import {
  bookingEventForStatus,
  bookingNotificationOutboxId,
  normalizeBookingNotification,
} from "../lib/notifications/booking-notification-outbox";
import {
  cruiseCapacityGapOutboxId,
  selectNearestCruiseCapacityGap,
} from "../lib/notifications/cruise-capacity-gap-notifications";

const input = {
  bookingId: "booking-123",
  reference: "VI-TOUR-123",
  event: "booking_requested" as const,
  audience: "traveler" as const,
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  recipientEmail: " Guest@Example.COM ",
  title: "Request received",
  message: "We received your request.",
  href: "/bookings?booking=booking-123",
  actor: null,
  createdAt: "2026-08-05T15:54:00.000Z",
};

assert.equal(
  bookingNotificationOutboxId(input),
  "booking-123__booking_requested__traveler",
);
assert.equal(
  bookingNotificationOutboxId(input),
  bookingNotificationOutboxId({ ...input }),
);
assert.equal(
  bookingNotificationOutboxId({
    ...input,
    event: "travel_advisor_followup",
    dedupeKey: "2026-08-07-message-a",
  }),
  "booking-123__travel_advisor_followup__traveler__2026-08-07-message-a",
);
assert.notEqual(
  bookingNotificationOutboxId({
    ...input,
    event: "travel_advisor_followup",
    dedupeKey: "message-a",
  }),
  bookingNotificationOutboxId({
    ...input,
    event: "travel_advisor_followup",
    dedupeKey: "message-b",
  }),
);

const normalized = normalizeBookingNotification(input);
assert.ok(normalized);
assert.equal(normalized?.recipientEmail, "guest@example.com");
assert.equal(normalized?.status, "pending");
assert.equal(normalized?.attempts, 0);
assert.equal(normalized?.nextAttemptAt, "2026-08-05T15:54:00.000Z");
assert.equal(normalized?.href, "/bookings?booking=booking-123");

assert.equal(
  normalizeBookingNotification({ ...input, href: "https://evil.example" })?.href,
  "/bookings",
);
assert.equal(
  normalizeBookingNotification({ ...input, href: "//evil.example" })?.href,
  "/bookings",
);
assert.equal(
  normalizeBookingNotification({ ...input, recipientEmail: "not-an-email" })
    ?.recipientEmail,
  null,
);
assert.equal(
  normalizeBookingNotification({ ...input, bookingId: "" }),
  null,
);
assert.equal(
  normalizeBookingNotification({ ...input, createdAt: "not-a-date" }),
  null,
);

assert.equal(bookingEventForStatus("requested"), "booking_requested");
assert.equal(bookingEventForStatus("reviewing"), "booking_reviewing");
assert.equal(bookingEventForStatus("payment_required"), "payment_required");
assert.equal(bookingEventForStatus("paid"), "booking_paid");
assert.equal(bookingEventForStatus("confirmed"), "booking_confirmed");
assert.equal(bookingEventForStatus("completed"), "booking_completed");
assert.equal(bookingEventForStatus("declined"), "booking_declined");
assert.equal(bookingEventForStatus("cancelled"), "booking_cancelled");
assert.equal(bookingEventForStatus("draft"), null);
assert.equal(bookingEventForStatus("unknown"), null);

const cruiseCalls = [
  {
    id: "2026-08-10_havensight_ship-one",
    date: "2026-08-10",
    island: "stt",
    portId: "havensight",
    terminalLabel: "Havensight · WICO Dock",
    shipName: "Ship One",
    arrivesAt: "08:00",
    departsAt: "18:00",
    status: "scheduled",
    sourceId: "official-source",
  },
  {
    id: "2026-08-11_havensight_ship-two",
    date: "2026-08-11",
    island: "stt",
    portId: "havensight",
    terminalLabel: "Havensight · WICO Dock",
    shipName: "Ship Two",
    arrivesAt: "09:00",
    departsAt: "18:00",
    status: "scheduled",
    sourceId: "official-source",
  },
  {
    id: "2026-08-12_crown_bay_ship-three",
    date: "2026-08-12",
    island: "stt",
    portId: "crown_bay",
    terminalLabel: "Crown Bay",
    shipName: "Ship Three",
    arrivesAt: "08:00",
    departsAt: "17:00",
    status: "scheduled",
    sourceId: "official-source",
  },
  {
    id: "2026-08-13_havensight_ship-four",
    date: "2026-08-13",
    island: "stt",
    portId: "havensight",
    terminalLabel: "Havensight · WICO Dock",
    shipName: "Ship Four",
    arrivesAt: "07:00",
    departsAt: "16:00",
    status: "scheduled",
    sourceId: "official-source",
  },
] satisfies OfficialCruisePortCall[];

const firstGap = selectNearestCruiseCapacityGap({
  today: "2026-08-07",
  latest: "2026-08-21",
  supportedPorts: ["havensight"],
  offerValidFrom: "2026-08-01",
  offerValidThrough: "2026-08-31",
  savedAvailabilityDates: new Set(["2026-08-10"]),
  calls: cruiseCalls,
});
assert.equal(firstGap?.date, "2026-08-11");
assert.equal(firstGap?.calls[0]?.shipName, "Ship Two");
assert.equal(firstGap?.additionalMissingDates, 1);

const nextGapAfterOperatorDecision = selectNearestCruiseCapacityGap({
  today: "2026-08-07",
  latest: "2026-08-21",
  supportedPorts: ["havensight"],
  offerValidFrom: "2026-08-01",
  offerValidThrough: "2026-08-31",
  savedAvailabilityDates: new Set(["2026-08-10", "2026-08-11"]),
  calls: cruiseCalls,
});
assert.equal(nextGapAfterOperatorDecision?.date, "2026-08-13");
assert.equal(nextGapAfterOperatorDecision?.additionalMissingDates, 0);

assert.equal(
  selectNearestCruiseCapacityGap({
    today: "2026-08-07",
    latest: "2026-08-21",
    supportedPorts: ["havensight"],
    offerValidFrom: "2026-08-20",
    offerValidThrough: "2026-08-31",
    savedAvailabilityDates: new Set(),
    calls: cruiseCalls,
  }),
  null,
);

assert.equal(
  cruiseCapacityGapOutboxId("offer-one", "2026-08-11"),
  cruiseCapacityGapOutboxId("offer-one", "2026-08-11"),
);
assert.notEqual(
  cruiseCapacityGapOutboxId("offer-one", "2026-08-11"),
  cruiseCapacityGapOutboxId("offer-one", "2026-08-13"),
);

console.log("Booking notification outbox tests passed.");
