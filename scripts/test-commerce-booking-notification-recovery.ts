import assert from "node:assert/strict";

import { recoveryNotificationsForCommerceBooking } from "../lib/notifications/commerce-booking-notification-recovery";

const paidNotifications = recoveryNotificationsForCommerceBooking({
  id: "booking-1",
  data: {
    reference: "VI-TOUR-1",
    listingId: "tour-one",
    listingName: "Tour One",
    email: "guest@example.com",
    status: "confirmed",
    paymentStatus: "paid",
    paymentIntegrityStatus: "verified",
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T14:00:00.000Z",
    paidAt: "2026-08-05T13:00:00.000Z",
    refundStatus: "not_requested",
  },
});
assert.deepEqual(
  paidNotifications.map((notification) => notification.id).sort(),
  [
    "booking-1__booking_paid__merchant",
    "booking-1__booking_paid__operations",
    "booking-1__booking_paid__traveler",
  ],
);
assert.equal(
  paidNotifications.find(
    (notification) => notification.id === "booking-1__booking_paid__traveler",
  )?.recipientEmail,
  "guest@example.com",
);

const refundedNotifications = recoveryNotificationsForCommerceBooking({
  id: "booking-2",
  data: {
    reference: "VI-STAY-2",
    listingId: "stay-two",
    listingName: "Stay Two",
    email: "guest2@example.com",
    status: "cancelled",
    paymentStatus: "refunded",
    paymentIntegrityStatus: "verified",
    refundStatus: "succeeded",
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T15:00:00.000Z",
    paidAt: "2026-08-05T13:00:00.000Z",
    refundUpdatedAt: "2026-08-05T15:00:00.000Z",
  },
});
assert.deepEqual(
  refundedNotifications
    .filter((notification) => notification.event === "booking_paid")
    .map((notification) => notification.audience)
    .sort(),
  ["merchant", "operations", "traveler"],
);
assert.deepEqual(
  refundedNotifications
    .filter((notification) => notification.event === "booking_refunded")
    .map((notification) => notification.audience)
    .sort(),
  ["merchant", "operations", "traveler"],
);

const failedRefundNotifications = recoveryNotificationsForCommerceBooking({
  id: "booking-3",
  data: {
    reference: "VI-EXP-3",
    listingId: "experience-three",
    listingName: "Experience Three",
    email: "guest3@example.com",
    status: "paid",
    paymentStatus: "refund_failed",
    paymentIntegrityStatus: "verified",
    refundStatus: "failed",
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T16:00:00.000Z",
    paidAt: "2026-08-05T13:00:00.000Z",
    refundUpdatedAt: "2026-08-05T16:00:00.000Z",
  },
});
assert.deepEqual(
  failedRefundNotifications
    .filter((notification) => notification.event === "refund_failed")
    .map((notification) => notification.audience),
  ["operations"],
);

const reviewRequiredNotifications = recoveryNotificationsForCommerceBooking({
  id: "booking-4",
  data: {
    reference: "VI-TOUR-4",
    listingId: "tour-four",
    listingName: "Tour Four",
    email: "guest4@example.com",
    paymentStatus: "paid",
    paymentIntegrityStatus: "review_required",
    refundStatus: "review_required",
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T17:00:00.000Z",
    paidAt: "2026-08-05T13:00:00.000Z",
    refundUpdatedAt: "2026-08-05T17:00:00.000Z",
  },
});
assert.equal(
  reviewRequiredNotifications.some(
    (notification) => notification.event === "booking_paid",
  ),
  false,
);
assert.deepEqual(
  reviewRequiredNotifications.map((notification) => notification.audience),
  ["operations"],
);
assert.equal(
  reviewRequiredNotifications[0]?.event,
  "refund_review_required",
);

assert.deepEqual(
  recoveryNotificationsForCommerceBooking({
    id: "",
    data: { listingId: "missing-booking" },
  }),
  [],
);

console.log("Commerce booking notification recovery tests passed.");
