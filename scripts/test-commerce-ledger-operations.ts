import assert from "node:assert/strict";

import {
  hasCommerceFinancialActivity,
  normalizeStoredCommerceLedgerEntry,
  resolveStoredCommerceLedgerPolicy,
  summarizeCommerceLedgerListings,
  summarizeCommerceLedgerReconciliation,
  validateStoredCommerceLedgerEntries,
} from "../lib/payments/commerce-ledger-operations";
import {
  buildCommerceCaptureLedgerEntry,
  buildCommerceRefundLedgerEntry,
  commerceCaptureLedgerId,
} from "../lib/payments/commerce-ledger";

assert.equal(
  hasCommerceFinancialActivity({
    id: "booking-1",
    paymentIntentId: "pi_1",
    paymentStatus: "paid",
  }),
  true,
);
assert.equal(
  hasCommerceFinancialActivity({
    id: "booking-2",
    paymentIntentId: "pi_2",
    paymentStatus: "unpaid",
  }),
  false,
);
assert.equal(
  hasCommerceFinancialActivity({
    id: "booking-3",
    paymentStatus: "paid",
  }),
  false,
);

assert.deepEqual(resolveStoredCommerceLedgerPolicy({ id: "legacy" }), {
  feeBps: 0,
  source: "unconfigured",
});
assert.deepEqual(
  resolveStoredCommerceLedgerPolicy({
    id: "configured",
    commercePlatformFeeBps: 1250,
    commerceFeePolicySource: "environment",
  }),
  { feeBps: 1250, source: "environment" },
);
assert.deepEqual(
  resolveStoredCommerceLedgerPolicy({
    id: "invalid",
    commercePlatformFeeBps: "bad",
    commerceFeePolicySource: "environment",
  }),
  { feeBps: 0, source: "unconfigured" },
);

const captureA = buildCommerceCaptureLedgerEntry({
  bookingId: "booking-a",
  bookingReference: "VI-TOUR-A",
  listingId: "listing-a",
  listingName: "Business A",
  paymentIntentId: "pi_a",
  checkoutSessionId: "cs_a",
  stripeEventId: "evt_a",
  grossAmountCents: 10_000,
  currency: "usd",
  policy: { feeBps: 1000, source: "environment" },
  verified: true,
  occurredAt: "2026-08-05T19:00:00.000Z",
  now: new Date("2026-08-05T19:00:01.000Z"),
});
const captureB = buildCommerceCaptureLedgerEntry({
  bookingId: "booking-b",
  bookingReference: "VI-TOUR-B",
  listingId: "listing-b",
  listingName: "Business B",
  paymentIntentId: "pi_b",
  checkoutSessionId: "cs_b",
  stripeEventId: "evt_b",
  grossAmountCents: 20_000,
  currency: "usd",
  policy: { feeBps: 1000, source: "environment" },
  verified: true,
  occurredAt: "2026-08-05T20:00:00.000Z",
  now: new Date("2026-08-05T20:00:01.000Z"),
});
assert.ok(captureA);
assert.ok(captureB);

const partialRefundB = buildCommerceRefundLedgerEntry({
  bookingId: captureB.bookingId,
  bookingReference: captureB.bookingReference,
  listingId: captureB.listingId,
  listingName: captureB.listingName,
  paymentIntentId: captureB.paymentIntentId,
  checkoutSessionId: captureB.checkoutSessionId,
  refundId: "re_b_partial",
  stripeEventId: "evt_b_refund",
  refundStatus: "succeeded",
  refundAmountCents: 5_000,
  currency: "usd",
  paymentIntentMatches: true,
  fullRefund: false,
  captureEntryId: captureB.id,
  captureGrossAmountCents: captureB.grossAmountCents,
  capturePlatformFeeCents: captureB.platformFeeCents,
  captureMerchantSettlementCents: captureB.merchantSettlementCents,
  feeBps: captureB.feeBps,
  feePolicySource: captureB.feePolicySource,
  occurredAt: "2026-08-05T21:00:00.000Z",
  now: new Date("2026-08-05T21:00:01.000Z"),
});
assert.ok(partialRefundB);
assert.equal(partialRefundB.status, "review_required");

assert.deepEqual(
  summarizeCommerceLedgerListings([captureA, captureB, partialRefundB]),
  [
    {
      listingId: "listing-b",
      listingName: "Business B",
      captures: 1,
      refunds: 1,
      grossCents: 20_000,
      platformFeeCents: 2_000,
      merchantSettlementCents: 18_000,
      unallocatedCents: -5_000,
      reviewCount: 1,
      latestAt: "2026-08-05T21:00:00.000Z",
    },
    {
      listingId: "listing-a",
      listingName: "Business A",
      captures: 1,
      refunds: 0,
      grossCents: 10_000,
      platformFeeCents: 1_000,
      merchantSettlementCents: 9_000,
      unallocatedCents: 0,
      reviewCount: 0,
      latestAt: "2026-08-05T19:00:00.000Z",
    },
  ],
);

const fullRefundA = buildCommerceRefundLedgerEntry({
  bookingId: captureA.bookingId,
  bookingReference: captureA.bookingReference,
  listingId: captureA.listingId,
  listingName: captureA.listingName,
  paymentIntentId: captureA.paymentIntentId,
  checkoutSessionId: captureA.checkoutSessionId,
  refundId: "re_a_full",
  stripeEventId: "evt_a_refund",
  refundStatus: "succeeded",
  refundAmountCents: captureA.grossAmountCents,
  currency: "usd",
  paymentIntentMatches: true,
  fullRefund: true,
  captureEntryId: captureA.id,
  captureGrossAmountCents: captureA.grossAmountCents,
  capturePlatformFeeCents: captureA.platformFeeCents,
  captureMerchantSettlementCents: captureA.merchantSettlementCents,
  feeBps: captureA.feeBps,
  feePolicySource: captureA.feePolicySource,
  occurredAt: "2026-08-05T22:00:00.000Z",
  now: new Date("2026-08-05T22:00:01.000Z"),
});
assert.ok(fullRefundA);

assert.deepEqual(
  normalizeStoredCommerceLedgerEntry({ id: captureA.id, data: captureA }),
  captureA,
);
assert.deepEqual(
  normalizeStoredCommerceLedgerEntry({ id: fullRefundA.id, data: fullRefundA }),
  fullRefundA,
);
assert.equal(
  normalizeStoredCommerceLedgerEntry({
    id: captureA.id,
    data: { ...captureA, platformFeeCents: captureA.platformFeeCents + 1 },
  }),
  null,
);
assert.equal(
  normalizeStoredCommerceLedgerEntry({
    id: "commerce_capture_wrong",
    data: captureA,
  }),
  null,
);
assert.equal(
  normalizeStoredCommerceLedgerEntry({
    id: fullRefundA.id,
    data: { ...fullRefundA, reversalOfEntryId: null },
  }),
  null,
);
assert.equal(
  normalizeStoredCommerceLedgerEntry({
    id: partialRefundB.id,
    data: { ...partialRefundB, occurredAt: "not-a-date" },
  }),
  null,
);

assert.deepEqual(
  validateStoredCommerceLedgerEntries([
    { id: captureA.id, data: captureA },
    { id: fullRefundA.id, data: fullRefundA },
    {
      id: captureB.id,
      data: { ...captureB, merchantSettlementCents: 17_999 },
    },
  ]),
  {
    entries: [captureA, fullRefundA],
    rejectedRecordCount: 1,
  },
);

const captureOne = commerceCaptureLedgerId("pi_1");
assert.deepEqual(
  summarizeCommerceLedgerReconciliation(
    [
      {
        id: "booking-1",
        paymentIntentId: "pi_1",
        paymentStatus: "paid",
      },
      {
        id: "booking-2",
        paymentIntentId: "pi_2",
        paymentStatus: "refunded",
        refundStatus: "review_required",
      },
      {
        id: "booking-3",
        paymentIntentId: "pi_3",
        paymentStatus: "unpaid",
      },
      {
        id: "booking-4",
        paymentIntentId: "pi_4",
        paymentStatus: "paid",
        paymentIntegrityStatus: "review_required",
      },
    ],
    [captureOne],
  ),
  {
    scannedBookings: 4,
    financialBookings: 3,
    missingCaptureEntries: 2,
    reviewRequiredBookings: 2,
  },
);

console.log("Commerce ledger operations tests passed.");
