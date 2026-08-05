import assert from "node:assert/strict";

import {
  bookingEventForStatus,
  bookingNotificationOutboxId,
  normalizeBookingNotification,
} from "../lib/notifications/booking-notification-outbox";

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

console.log("Booking notification outbox tests passed.");
