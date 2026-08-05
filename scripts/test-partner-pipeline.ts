import assert from "node:assert/strict";

import {
  normalizePartnerFollowUpDate,
  normalizePartnerOwnerEmail,
  partnerFollowUpState,
  partnerPipelinePatch,
  partnerTodayDateKey,
  summarizePartnerPipeline,
} from "../lib/partners/partner-pipeline";

const now = new Date("2026-08-05T17:00:00.000Z");
assert.equal(partnerTodayDateKey(now), "2026-08-05");
assert.equal(normalizePartnerFollowUpDate("2026-08-06"), "2026-08-06");
assert.equal(normalizePartnerFollowUpDate("2026-02-30"), null);
assert.equal(normalizePartnerFollowUpDate("08/06/2026"), null);
assert.equal(normalizePartnerOwnerEmail(" Admin@Example.com "), "admin@example.com");
assert.equal(normalizePartnerOwnerEmail("not-an-email"), null);

assert.equal(
  partnerFollowUpState(
    { status: "reviewing", nextFollowUpDate: "2026-08-04" },
    now,
  ),
  "overdue",
);
assert.equal(
  partnerFollowUpState(
    { status: "reviewing", nextFollowUpDate: "2026-08-05" },
    now,
  ),
  "due_today",
);
assert.equal(
  partnerFollowUpState(
    { status: "reviewing", nextFollowUpDate: "2026-08-06" },
    now,
  ),
  "scheduled",
);
assert.equal(
  partnerFollowUpState({ status: "new", nextFollowUpDate: null }, now),
  "unscheduled",
);
assert.equal(
  partnerFollowUpState(
    { status: "approved", nextFollowUpDate: "2026-08-04" },
    now,
  ),
  "closed",
);

assert.deepEqual(
  partnerPipelinePatch({
    action: "assign_to_me",
    sessionUid: "user-1",
    sessionEmail: "ADMIN@example.com",
    now,
  }),
  {
    assignedToUid: "user-1",
    assignedToEmail: "admin@example.com",
    assignedAt: "2026-08-05T17:00:00.000Z",
    updatedAt: "2026-08-05T17:00:00.000Z",
  },
);
assert.equal(
  partnerPipelinePatch({
    action: "assign_to_me",
    sessionUid: "user-1",
    sessionEmail: null,
    now,
  }),
  null,
);
assert.deepEqual(
  partnerPipelinePatch({
    action: "schedule_follow_up",
    sessionUid: "user-1",
    nextFollowUpDate: "2026-08-06",
    now,
  }),
  {
    nextFollowUpDate: "2026-08-06",
    updatedAt: "2026-08-05T17:00:00.000Z",
  },
);
assert.equal(
  partnerPipelinePatch({
    action: "schedule_follow_up",
    sessionUid: "user-1",
    nextFollowUpDate: "2026-08-04",
    now,
  }),
  null,
);
assert.deepEqual(
  partnerPipelinePatch({
    action: "mark_contacted",
    sessionUid: "user-1",
    sessionEmail: "admin@example.com",
    now,
  }),
  {
    lastContactedAt: "2026-08-05T17:00:00.000Z",
    lastContactedByUid: "user-1",
    lastContactedByEmail: "admin@example.com",
    updatedAt: "2026-08-05T17:00:00.000Z",
  },
);

assert.deepEqual(
  summarizePartnerPipeline(
    [
      { status: "new" },
      {
        status: "reviewing",
        assignedToEmail: "admin@example.com",
        nextFollowUpDate: "2026-08-04",
        lastContactedAt: "2026-08-05T16:00:00.000Z",
      },
      {
        status: "needs_information",
        assignedToEmail: "admin@example.com",
        nextFollowUpDate: "2026-08-05",
      },
      { status: "approved", nextFollowUpDate: "2026-08-04" },
    ],
    now,
  ),
  {
    active: 3,
    unassigned: 1,
    overdue: 1,
    dueToday: 1,
    scheduled: 0,
    unscheduled: 1,
    contacted: 1,
    closed: 1,
  },
);

console.log("Partner pipeline tests passed.");
