import assert from "node:assert/strict";

import {
  manualNotificationRetryPatch,
  normalizeNotificationOutboxStatus,
  normalizeNotificationRetryIds,
  notificationCanBeManuallyRetried,
  summarizeNotificationOutbox,
} from "../lib/notifications/booking-notification-operations";

assert.equal(normalizeNotificationOutboxStatus("pending"), "pending");
assert.equal(normalizeNotificationOutboxStatus("unknown"), null);

assert.deepEqual(
  normalizeNotificationRetryIds([
    " booking__paid__traveler ",
    "booking__paid__traveler",
    "booking/invalid",
    null,
  ]),
  ["booking__paid__traveler"],
);
assert.equal(normalizeNotificationRetryIds(new Array(40).fill("same")).length, 1);
assert.deepEqual(normalizeNotificationRetryIds(null), []);

const now = new Date("2026-08-05T16:00:00.000Z");
assert.equal(notificationCanBeManuallyRetried({ status: "pending" }, now), true);
assert.equal(notificationCanBeManuallyRetried({ status: "failed" }, now), true);
assert.equal(notificationCanBeManuallyRetried({ status: "delivered" }, now), false);
assert.equal(
  notificationCanBeManuallyRetried(
    {
      status: "processing",
      leaseUntil: "2026-08-05T16:01:00.000Z",
    },
    now,
  ),
  false,
);
assert.equal(
  notificationCanBeManuallyRetried(
    {
      status: "processing",
      leaseUntil: "2026-08-05T15:59:00.000Z",
    },
    now,
  ),
  true,
);

assert.deepEqual(
  manualNotificationRetryPatch({
    actorUid: " admin-1 ",
    actorEmail: " ADMIN@EXAMPLE.COM ",
    now,
  }),
  {
    status: "pending",
    attempts: 0,
    nextAttemptAt: "2026-08-05T16:00:00.000Z",
    leaseId: null,
    leaseUntil: null,
    failedAt: null,
    lastError: null,
    manualRetryAt: "2026-08-05T16:00:00.000Z",
    manualRetryActorUid: "admin-1",
    manualRetryActorEmail: "admin@example.com",
    updatedAt: "2026-08-05T16:00:00.000Z",
  },
);

assert.deepEqual(
  summarizeNotificationOutbox(
    [
      { status: "pending" },
      {
        status: "processing",
        leaseUntil: "2026-08-05T16:01:00.000Z",
      },
      {
        status: "processing",
        leaseUntil: "2026-08-05T15:59:00.000Z",
      },
      { status: "delivered" },
      { status: "failed" },
      { status: "unknown" },
      null,
    ],
    now,
  ),
  {
    total: 5,
    pending: 1,
    processing: 2,
    delivered: 1,
    failed: 1,
    retryable: 3,
  },
);

console.log("Booking notification operations tests passed.");
