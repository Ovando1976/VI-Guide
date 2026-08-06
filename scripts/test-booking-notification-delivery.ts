import assert from "node:assert/strict";

import {
  normalizeNotificationRecipients,
  notificationClaimIsCurrent,
  notificationIsDue,
  notificationRetryDelayMs,
} from "../lib/notifications/booking-notification-delivery";

assert.deepEqual(
  normalizeNotificationRecipients([
    " Guest@Example.com ",
    "guest@example.com",
    "ops@example.com",
    "invalid",
    null,
  ]),
  ["guest@example.com", "ops@example.com"],
);
assert.deepEqual(
  normalizeNotificationRecipients("one@example.com, two@example.com, invalid"),
  ["one@example.com", "two@example.com"],
);
assert.deepEqual(normalizeNotificationRecipients(null), []);

assert.equal(notificationRetryDelayMs(1), 60_000);
assert.equal(notificationRetryDelayMs(2), 120_000);
assert.equal(notificationRetryDelayMs(8), 7_680_000);
assert.equal(notificationRetryDelayMs(20), 86_400_000);

const now = new Date("2026-08-05T16:00:00.000Z");
assert.equal(
  notificationIsDue(
    {
      status: "pending",
      nextAttemptAt: "2026-08-05T15:59:59.000Z",
      leaseUntil: null,
    },
    now,
  ),
  true,
);
assert.equal(
  notificationIsDue(
    {
      status: "pending",
      nextAttemptAt: "2026-08-05T16:00:01.000Z",
      leaseUntil: null,
    },
    now,
  ),
  false,
);
assert.equal(
  notificationIsDue(
    {
      status: "processing",
      nextAttemptAt: "2026-08-05T15:00:00.000Z",
      leaseUntil: "2026-08-05T16:00:30.000Z",
    },
    now,
  ),
  false,
);
assert.equal(
  notificationIsDue(
    {
      status: "processing",
      nextAttemptAt: "2026-08-05T15:00:00.000Z",
      leaseUntil: "2026-08-05T15:59:30.000Z",
    },
    now,
  ),
  true,
);
assert.equal(
  notificationIsDue(
    { status: "delivered", nextAttemptAt: null, leaseUntil: null },
    now,
  ),
  false,
);
assert.equal(
  notificationIsDue(
    { status: "failed", nextAttemptAt: null, leaseUntil: null },
    now,
  ),
  false,
);

assert.equal(
  notificationClaimIsCurrent(
    { status: "processing", leaseId: "lease-current" },
    "lease-current",
  ),
  true,
);
assert.equal(
  notificationClaimIsCurrent(
    { status: "processing", leaseId: "lease-newer" },
    "lease-stale",
  ),
  false,
);
assert.equal(
  notificationClaimIsCurrent(
    { status: "pending", leaseId: "lease-current" },
    "lease-current",
  ),
  false,
);

console.log("Booking notification delivery tests passed.");
