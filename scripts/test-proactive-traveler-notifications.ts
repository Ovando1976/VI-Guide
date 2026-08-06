import assert from "node:assert/strict";

import {
  canAccessNotificationAudience,
  canMutateStoredNotification,
} from "../lib/notifications/notification-auth";
import {
  materialTripRiskIssues,
  normalizeTripNotificationPreferences,
  proactiveTripRiskFingerprint,
  shouldCreateTripRiskNotification,
} from "../lib/notifications/proactive-trip-notifications";
import type {
  TripRiskIssue,
  TripRiskReport,
} from "../lib/intelligence/trip-risk";

const defaults = normalizeTripNotificationPreferences(undefined);
assert.deepEqual(defaults, {
  tripMonitoring: true,
  inApp: true,
  email: false,
  minimumSeverity: "high",
  notifyOnRecovery: true,
});

const optedIn = normalizeTripNotificationPreferences({
  tripMonitoring: true,
  inApp: false,
  email: true,
  minimumSeverity: "medium",
  notifyOnRecovery: false,
});
assert.equal(optedIn.email, true);
assert.equal(optedIn.inApp, false);
assert.equal(optedIn.minimumSeverity, "medium");
assert.equal(optedIn.notifyOnRecovery, false);

const issues: TripRiskIssue[] = [
  {
    id: "timing_watch",
    severity: "medium",
    category: "timing",
    title: "A stop needs a time",
    detail: "The final stop is flexible.",
    recommendation: "Add an approximate time.",
    penalty: 10,
  },
  {
    id: "return_critical",
    severity: "critical",
    category: "return_window",
    title: "Return window is unsafe",
    detail: "The day runs past all aboard.",
    recommendation: "Return to the ship earlier.",
    penalty: 40,
  },
];

const report: TripRiskReport = {
  status: "critical",
  score: 42,
  summary: "Critical trip risks need attention.",
  issueCount: 2,
  criticalCount: 1,
  highCount: 0,
  mediumCount: 1,
  issues,
  returnWindow: {
    allAboardTime: "16:00",
    safeReturnByTime: "14:00",
    latestScheduledEndTime: "16:30",
    estimatedBufferMinutes: -30,
    requiredBufferMinutes: 120,
  },
};

assert.deepEqual(
  materialTripRiskIssues(report, "high").map((issue) => issue.id),
  ["return_critical"],
);
assert.deepEqual(
  materialTripRiskIssues(report, "medium").map((issue) => issue.id),
  ["timing_watch", "return_critical"],
);
assert.deepEqual(materialTripRiskIssues(report, "critical").length, 1);

const criticalOnly = materialTripRiskIssues(report, "high");
const fingerprint = proactiveTripRiskFingerprint(report, criticalOnly);
assert.equal(fingerprint.length, 64);
assert.equal(
  fingerprint,
  proactiveTripRiskFingerprint(report, criticalOnly),
);
assert.notEqual(
  fingerprint,
  proactiveTripRiskFingerprint(
    { ...report, score: 75, status: "attention" },
    criticalOnly,
  ),
);

const now = new Date("2026-08-06T20:00:00.000Z");
assert.equal(
  shouldCreateTripRiskNotification(null, fingerprint, "critical", now),
  true,
);
assert.equal(
  shouldCreateTripRiskNotification(
    {
      fingerprint,
      severity: "critical",
      lastNotifiedAt: "2026-08-06T19:00:00.000Z",
    },
    fingerprint,
    "critical",
    now,
  ),
  false,
);
assert.equal(
  shouldCreateTripRiskNotification(
    {
      fingerprint: "different",
      severity: "high",
      lastNotifiedAt: "2026-08-06T19:55:00.000Z",
    },
    fingerprint,
    "critical",
    now,
  ),
  true,
);
assert.equal(
  shouldCreateTripRiskNotification(
    {
      fingerprint: "different",
      severity: "critical",
      lastNotifiedAt: "2026-08-06T19:55:00.000Z",
    },
    fingerprint,
    "high",
    now,
  ),
  false,
);
assert.equal(
  shouldCreateTripRiskNotification(
    {
      fingerprint: "different",
      severity: "critical",
      lastNotifiedAt: "2026-08-06T12:00:00.000Z",
    },
    fingerprint,
    "high",
    now,
  ),
  true,
);

const traveler = {
  uid: "traveler_1",
  email: "traveler@example.com",
  role: "rider",
};
const merchant = {
  uid: "merchant_1",
  email: "merchant@example.com",
  role: "merchant",
};
const dispatcher = {
  uid: "dispatcher_1",
  email: "dispatch@example.com",
  role: "dispatcher",
};

assert.equal(canAccessNotificationAudience(traveler, "traveler"), true);
assert.equal(canAccessNotificationAudience(traveler, "operations"), false);
assert.equal(canAccessNotificationAudience(merchant, "merchant"), true);
assert.equal(canAccessNotificationAudience(dispatcher, "operations"), true);
assert.equal(
  canMutateStoredNotification(traveler, {
    audience: "traveler",
    recipientUid: "traveler_1",
  }),
  true,
);
assert.equal(
  canMutateStoredNotification(traveler, {
    audience: "traveler",
    recipientUid: "traveler_2",
  }),
  false,
);
assert.equal(
  canMutateStoredNotification(dispatcher, { audience: "operations" }),
  true,
);

console.log("Proactive traveler notification tests passed.");
