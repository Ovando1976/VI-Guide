import assert from "node:assert/strict";

import {
  hasCommerceFinancialActivity,
  resolveStoredCommerceLedgerPolicy,
  summarizeCommerceLedgerListings,
  summarizeCommerceLedgerReconciliation,
} from "../lib/payments/commerce-ledger-operations";
import { commerceCaptureLedgerId } from "../lib/payments/commerce-ledger";

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

assert.deepEqual(
  summarizeCommerceLedgerListings([
    {
      kind: "capture",
      status: "held",
      listingId: "listing-b",
      listingName: "Business B",
      grossAmountCents: 20_000,
      platformFeeCents: 2_000,
      merchantSettlementCents: 18_000,
      unallocatedAmountCents: 0,
      occurredAt: "2026-08-05T20:00:00.000Z",
    },
    {
      kind: "capture",
      status: "held",
      listingId: "listing-a",
      listingName: "Business A",
      grossAmountCents: 10_000,
      platformFeeCents: 1_000,
      merchantSettlementCents: 9_000,
      unallocatedAmountCents: 0,
      occurredAt: "2026-08-05T19:00:00.000Z",
    },
    {
      kind: "refund",
      status: "posted",
      listingId: "listing-b",
      listingName: "Business B",
      grossAmountCents: -5_000,
      platformFeeCents: -500,
      merchantSettlementCents: -4_500,
      unallocatedAmountCents: 0,
      occurredAt: "2026-08-05T21:00:00.000Z",
    },
    {
      kind: "refund",
      status: "review_required",
      listingId: "listing-a",
      listingName: "Business A",
      grossAmountCents: 0,
      platformFeeCents: 0,
      merchantSettlementCents: 0,
      unallocatedAmountCents: -3_000,
      occurredAt: "not-a-date",
    },
  ]),
  [
    {
      listingId: "listing-b",
      listingName: "Business B",
      captures: 1,
      refunds: 1,
      grossCents: 15_000,
      platformFeeCents: 1_500,
      merchantSettlementCents: 13_500,
      unallocatedCents: 0,
      reviewCount: 0,
      latestAt: "2026-08-05T21:00:00.000Z",
    },
    {
      listingId: "listing-a",
      listingName: "Business A",
      captures: 1,
      refunds: 1,
      grossCents: 10_000,
      platformFeeCents: 1_000,
      merchantSettlementCents: 9_000,
      unallocatedCents: -3_000,
      reviewCount: 1,
      latestAt: "2026-08-05T19:00:00.000Z",
    },
  ],
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
