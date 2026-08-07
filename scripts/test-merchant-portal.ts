import assert from "node:assert/strict";

import {
  applyProviderAvailabilityWindowDecision,
  buildProviderAvailabilityDays,
  humanizeListingId,
  resolveMerchantListingSelection,
  selectProviderAvailabilityDecisions,
  summarizeMerchantBookings,
} from "../lib/merchant-portal";

assert.equal(
  humanizeListingId("ritz-carlton-st-thomas"),
  "Ritz Carlton St Thomas",
);
assert.equal(humanizeListingId("  island_tour_one  "), "Island Tour One");
assert.equal(humanizeListingId(null), "Assigned business");

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "tour-two",
    managedListingIds: ["hotel-one", "tour-two"],
    restricted: true,
  }),
  "tour-two",
);

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "another-business",
    managedListingIds: ["hotel-one", "tour-two"],
    restricted: true,
  }),
  "hotel-one",
);

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "free-form-listing",
    managedListingIds: ["hotel-one"],
    restricted: false,
  }),
  "free-form-listing",
);

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "missing",
    managedListingIds: [],
    restricted: true,
  }),
  "",
);

const availabilityDays = buildProviderAvailabilityDays(12, "2026-08-05");
assert.equal(availabilityDays.length, 14);
assert.deepEqual(availabilityDays[0], {
  date: "2026-08-05",
  isOpen: true,
  capacity: 12,
  startTime: "09:00",
  endTime: "17:00",
});
assert.equal(availabilityDays[13]?.date, "2026-08-18");
assert.equal(buildProviderAvailabilityDays(900, "2026-12-25")[0]?.capacity, 500);
assert.equal(
  buildProviderAvailabilityDays(Number.NaN, "2026-12-31")[1]?.date,
  "2027-01-01",
);

assert.deepEqual(
  selectProviderAvailabilityDecisions(availabilityDays, [
    "2026-08-06",
    "2026-08-11",
    "not-a-date",
  ]),
  [availabilityDays[1], availabilityDays[6]],
);
assert.deepEqual(
  selectProviderAvailabilityDecisions(availabilityDays, new Set()),
  [],
);

const bulkSource = availabilityDays.map((day, index) =>
  index === 1
    ? {
        ...day,
        isOpen: false,
        capacity: 3,
        startTime: "08:00",
        endTime: "11:00",
        note: "Already reviewed",
      }
    : day,
);
const bulkOpen = applyProviderAvailabilityWindowDecision(
  bulkSource,
  ["2026-08-06"],
  {
    startDate: "2026-08-05",
    windowDays: 7,
    isOpen: true,
    startTime: "08:30",
    endTime: "13:30",
    capacity: 24,
  },
);
assert.equal(bulkOpen.appliedCount, 6);
assert.equal(bulkOpen.startDate, "2026-08-05");
assert.equal(bulkOpen.endDate, "2026-08-11");
assert.deepEqual(bulkOpen.days[1], bulkSource[1]);
assert.deepEqual(bulkOpen.days[0], {
  ...bulkSource[0],
  isOpen: true,
  capacity: 24,
  startTime: "08:30",
  endTime: "13:30",
});
assert.deepEqual(bulkOpen.days[7], bulkSource[7]);
assert.deepEqual(bulkOpen.decisionDates, [
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
  "2026-08-11",
]);

const bulkRepeat = applyProviderAvailabilityWindowDecision(
  bulkOpen.days,
  bulkOpen.decisionDates,
  {
    startDate: "2026-08-05",
    windowDays: 7,
    isOpen: false,
  },
);
assert.equal(bulkRepeat.appliedCount, 0);
assert.deepEqual(bulkRepeat.days, bulkOpen.days);

const bulkClose = applyProviderAvailabilityWindowDecision(
  availabilityDays,
  ["2026-08-05"],
  {
    startDate: "2026-08-05",
    windowDays: 3,
    isOpen: false,
  },
);
assert.equal(bulkClose.appliedCount, 2);
assert.equal(bulkClose.days[0]?.isOpen, true);
assert.equal(bulkClose.days[1]?.isOpen, false);
assert.equal(bulkClose.days[2]?.isOpen, false);

const targetedBulk = applyProviderAvailabilityWindowDecision(
  availabilityDays,
  ["2026-08-08"],
  {
    startDate: "2026-08-05",
    windowDays: 7,
    isOpen: true,
    startTime: "07:30",
    endTime: "15:30",
    capacity: 30,
    targetDates: ["2026-08-06", "2026-08-08", "2026-08-11", "2026-08-18"],
  },
);
assert.equal(targetedBulk.appliedCount, 2);
assert.deepEqual(targetedBulk.decisionDates, [
  "2026-08-06",
  "2026-08-08",
  "2026-08-11",
]);
assert.equal(targetedBulk.days[0]?.capacity, 12);
assert.deepEqual(targetedBulk.days[1], {
  ...availabilityDays[1],
  isOpen: true,
  capacity: 30,
  startTime: "07:30",
  endTime: "15:30",
});
assert.deepEqual(targetedBulk.days[3], availabilityDays[3]);
assert.deepEqual(targetedBulk.days[6], {
  ...availabilityDays[6],
  isOpen: true,
  capacity: 30,
  startTime: "07:30",
  endTime: "15:30",
});
assert.deepEqual(targetedBulk.days[13], availabilityDays[13]);

const invalidBulk = applyProviderAvailabilityWindowDecision(
  availabilityDays,
  [],
  {
    startDate: "not-a-date",
    windowDays: 14,
    isOpen: true,
  },
);
assert.equal(invalidBulk.appliedCount, 0);
assert.equal(invalidBulk.startDate, "");
assert.deepEqual(invalidBulk.days, availabilityDays);

assert.deepEqual(
  summarizeMerchantBookings([
    { status: "requested" },
    { status: "reviewing" },
    { status: "payment_required" },
    { status: "paid" },
    { status: "confirmed" },
    { status: "completed" },
    { status: "completed", paymentStatus: "refunded" },
    { status: "declined" },
    { status: "cancelled" },
    { status: "draft" },
    { status: "unknown" },
    null,
  ]),
  {
    total: 9,
    active: 5,
    needsAction: 2,
    awaitingPayment: 1,
    readyToConfirm: 1,
    confirmed: 1,
    completed: 1,
    closed: 3,
  },
);
assert.deepEqual(summarizeMerchantBookings(null), {
  total: 0,
  active: 0,
  needsAction: 0,
  awaitingPayment: 0,
  readyToConfirm: 0,
  confirmed: 0,
  completed: 0,
  closed: 0,
});

console.log("Merchant portal tests passed.");