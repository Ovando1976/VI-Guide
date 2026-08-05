import assert from "node:assert/strict";

import {
  allocateCommerceCapture,
  buildCommerceCaptureLedgerEntry,
  buildCommerceRefundLedgerEntry,
  commerceCaptureLedgerId,
  commerceRefundLedgerId,
  resolveCommerceLedgerPolicy,
  summarizeCommerceLedger,
} from "../lib/payments/commerce-ledger";

const now = new Date("2026-08-05T21:00:00.000Z");

assert.deepEqual(resolveCommerceLedgerPolicy(undefined), {
  feeBps: 0,
  source: "unconfigured",
});
assert.deepEqual(resolveCommerceLedgerPolicy("1250"), {
  feeBps: 1250,
  source: "environment",
});
assert.deepEqual(resolveCommerceLedgerPolicy("10001"), {
  feeBps: 0,
  source: "unconfigured",
});
assert.deepEqual(resolveCommerceLedgerPolicy("not-a-number"), {
  feeBps: 0,
  source: "unconfigured",
});

assert.deepEqual(
  allocateCommerceCapture({ grossAmountCents: 10_000, feeBps: 1250 }),
  {
    grossAmountCents: 10_000,
    platformFeeCents: 1_250,
    merchantSettlementCents: 8_750,
  },
);
assert.deepEqual(
  allocateCommerceCapture({ grossAmountCents: 999, feeBps: 333 }),
  {
    grossAmountCents: 999,
    platformFeeCents: 33,
    merchantSettlementCents: 966,
  },
);
assert.equal(
  allocateCommerceCapture({ grossAmountCents: 0, feeBps: 1250 }),
  null,
);
assert.equal(
  allocateCommerceCapture({ grossAmountCents: 10_000, feeBps: -1 }),
  null,
);

const captureId = commerceCaptureLedgerId("pi_verified_123");
assert.match(captureId, /^commerce_capture_[a-f0-9]{40}$/);
assert.equal(captureId, commerceCaptureLedgerId(" pi_verified_123 "));
assert.equal(commerceCaptureLedgerId(""), "");

const capture = buildCommerceCaptureLedgerEntry({
  bookingId: "booking_123",
  bookingReference: "VI-TOUR-123",
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  paymentIntentId: "pi_verified_123",
  checkoutSessionId: "cs_test_123",
  stripeEventId: "evt_capture_123",
  grossAmountCents: 10_000,
  currency: "USD",
  policy: { feeBps: 1250, source: "environment" },
  verified: true,
  occurredAt: "2026-08-05T20:58:00.000Z",
  now,
});
assert.ok(capture);
assert.equal(capture.id, captureId);
assert.equal(capture.status, "held");
assert.equal(capture.grossAmountCents, 10_000);
assert.equal(capture.platformFeeCents, 1_250);
assert.equal(capture.merchantSettlementCents, 8_750);
assert.equal(capture.unallocatedAmountCents, 0);
assert.equal(capture.currency, "usd");

const reviewCapture = buildCommerceCaptureLedgerEntry({
  bookingId: "booking_review",
  bookingReference: "VI-TOUR-REVIEW",
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  paymentIntentId: "pi_review_123",
  checkoutSessionId: "cs_review_123",
  stripeEventId: "evt_review_123",
  grossAmountCents: 10_000,
  currency: "usd",
  policy: { feeBps: 1250, source: "environment" },
  verified: false,
  occurredAt: "2026-08-05T20:59:00.000Z",
  now,
});
assert.ok(reviewCapture);
assert.equal(reviewCapture.status, "review_required");
assert.equal(reviewCapture.grossAmountCents, 0);
assert.equal(reviewCapture.platformFeeCents, 0);
assert.equal(reviewCapture.merchantSettlementCents, 0);
assert.equal(reviewCapture.unallocatedAmountCents, 10_000);

const refundId = commerceRefundLedgerId("re_verified_123");
assert.match(refundId, /^commerce_refund_[a-f0-9]{40}$/);
assert.equal(refundId, commerceRefundLedgerId(" re_verified_123 "));

const refund = buildCommerceRefundLedgerEntry({
  bookingId: "booking_123",
  bookingReference: "VI-TOUR-123",
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  paymentIntentId: "pi_verified_123",
  checkoutSessionId: "cs_test_123",
  refundId: "re_verified_123",
  stripeEventId: "evt_refund_123",
  refundStatus: "succeeded",
  refundAmountCents: 10_000,
  currency: "usd",
  paymentIntentMatches: true,
  fullRefund: true,
  captureEntryId: captureId,
  captureGrossAmountCents: 10_000,
  capturePlatformFeeCents: 1_250,
  captureMerchantSettlementCents: 8_750,
  feeBps: 1250,
  feePolicySource: "environment",
  occurredAt: "2026-08-05T21:02:00.000Z",
  now,
});
assert.ok(refund);
assert.equal(refund.id, refundId);
assert.equal(refund.status, "posted");
assert.equal(refund.grossAmountCents, -10_000);
assert.equal(refund.platformFeeCents, -1_250);
assert.equal(refund.merchantSettlementCents, -8_750);
assert.equal(refund.unallocatedAmountCents, 0);
assert.equal(refund.reversalOfEntryId, captureId);

const partialRefund = buildCommerceRefundLedgerEntry({
  bookingId: "booking_123",
  bookingReference: "VI-TOUR-123",
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  paymentIntentId: "pi_verified_123",
  checkoutSessionId: "cs_test_123",
  refundId: "re_partial_123",
  stripeEventId: "evt_partial_123",
  refundStatus: "succeeded",
  refundAmountCents: 5_000,
  currency: "usd",
  paymentIntentMatches: true,
  fullRefund: false,
  captureEntryId: captureId,
  captureGrossAmountCents: 10_000,
  capturePlatformFeeCents: 1_250,
  captureMerchantSettlementCents: 8_750,
  feeBps: 1250,
  feePolicySource: "environment",
  occurredAt: "2026-08-05T21:03:00.000Z",
  now,
});
assert.ok(partialRefund);
assert.equal(partialRefund.status, "review_required");
assert.equal(partialRefund.grossAmountCents, 0);
assert.equal(partialRefund.platformFeeCents, 0);
assert.equal(partialRefund.merchantSettlementCents, 0);
assert.equal(partialRefund.unallocatedAmountCents, -5_000);

const processingRefund = buildCommerceRefundLedgerEntry({
  bookingId: "booking_123",
  bookingReference: "VI-TOUR-123",
  listingId: "island-tour-one",
  listingName: "Island Tour One",
  paymentIntentId: "pi_verified_123",
  checkoutSessionId: "cs_test_123",
  refundId: "re_pending_123",
  stripeEventId: "evt_pending_123",
  refundStatus: "pending",
  refundAmountCents: 10_000,
  currency: "usd",
  paymentIntentMatches: true,
  fullRefund: true,
  captureEntryId: captureId,
  captureGrossAmountCents: 10_000,
  capturePlatformFeeCents: 1_250,
  captureMerchantSettlementCents: 8_750,
  feeBps: 1250,
  feePolicySource: "environment",
  occurredAt: "2026-08-05T21:01:00.000Z",
  now,
});
assert.ok(processingRefund);
assert.equal(processingRefund.status, "processing");
assert.equal(processingRefund.grossAmountCents, 0);

assert.deepEqual(summarizeCommerceLedger([capture, refund]), {
  captureCount: 1,
  refundCount: 1,
  reviewCount: 0,
  processingCount: 0,
  failedCount: 0,
  grossCapturedCents: 10_000,
  grossRefundedCents: 10_000,
  netGrossCents: 0,
  platformFeeReserveCents: 0,
  merchantSettlementCents: 0,
  unallocatedCents: 0,
});

assert.deepEqual(
  summarizeCommerceLedger([capture, reviewCapture, partialRefund, processingRefund]),
  {
    captureCount: 2,
    refundCount: 2,
    reviewCount: 2,
    processingCount: 1,
    failedCount: 0,
    grossCapturedCents: 10_000,
    grossRefundedCents: 0,
    netGrossCents: 10_000,
    platformFeeReserveCents: 1_250,
    merchantSettlementCents: 8_750,
    unallocatedCents: 5_000,
  },
);

console.log("Commerce ledger tests passed.");
