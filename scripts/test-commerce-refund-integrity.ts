import assert from "node:assert/strict";

import {
  commerceRefundEligibilityError,
  commerceRefundEventDecision,
  commerceRefundStatusFromStripe,
  hasCommerceRefundActivity,
} from "../lib/payments/commerce-refund-integrity";

function testRefundableLifecycleStates() {
  const valid = {
    bookingStatus: "paid",
    paymentStatus: "paid",
    paymentIntentId: "pi_123",
    paidAmountCents: 12_500,
    refundStatus: "not_requested" as const,
    expectedReference: "VI-STAY-ABC123",
    confirmedReference: "VI-STAY-ABC123",
  };

  assert.equal(commerceRefundEligibilityError(valid), null);
  assert.equal(
    commerceRefundEligibilityError({ ...valid, bookingStatus: "confirmed" }),
    null,
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, bookingStatus: "completed" }),
    null,
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, bookingStatus: "cancelled" }),
    null,
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, bookingStatus: "declined" }),
    "This booking is not in a refundable lifecycle state.",
  );
}

function testStripeRefundStatusMapping() {
  assert.equal(commerceRefundStatusFromStripe("pending"), "processing");
  assert.equal(commerceRefundStatusFromStripe("succeeded"), "succeeded");
  assert.equal(commerceRefundStatusFromStripe("failed"), "failed");
  assert.equal(commerceRefundStatusFromStripe("canceled"), "failed");
  assert.equal(
    commerceRefundStatusFromStripe("requires_action"),
    "review_required",
  );
  assert.equal(commerceRefundStatusFromStripe("future_status"), "review_required");
  assert.equal(commerceRefundStatusFromStripe(null), "review_required");
}

function testCheckoutSuppressionDuringRefunds() {
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "paid",
      refundStatus: "not_requested",
    }),
    false,
  );
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "refund_pending",
      refundStatus: "not_requested",
    }),
    true,
  );
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "paid",
      refundStatus: "processing",
    }),
    true,
  );
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "refunded",
      refundStatus: "succeeded",
    }),
    true,
  );
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "refund_failed",
      refundStatus: "failed",
    }),
    true,
  );
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "paid",
      refundStatus: "review_required",
    }),
    true,
  );
}

function testRefundEventPrecedence() {
  assert.equal(
    commerceRefundEventDecision({
      currentStatus: "processing",
      currentRefundId: "re_123",
      incomingStatus: "succeeded",
      incomingRefundId: "re_123",
    }),
    "apply",
  );
  assert.equal(
    commerceRefundEventDecision({
      currentStatus: "succeeded",
      currentRefundId: "re_123",
      incomingStatus: "processing",
      incomingRefundId: "re_123",
    }),
    "ignore_stale",
  );
  assert.equal(
    commerceRefundEventDecision({
      currentStatus: "review_required",
      currentRefundId: "re_123",
      incomingStatus: "failed",
      incomingRefundId: "re_123",
    }),
    "ignore_stale",
  );
  assert.equal(
    commerceRefundEventDecision({
      currentStatus: "processing",
      currentRefundId: "re_123",
      incomingStatus: "processing",
      incomingRefundId: "re_456",
    }),
    "review_multiple_refunds",
  );
}

function main() {
  testRefundableLifecycleStates();
  testStripeRefundStatusMapping();
  testCheckoutSuppressionDuringRefunds();
  testRefundEventPrecedence();
  console.log("Commerce refund lifecycle edge-case tests passed.");
}

try {
  main();
} catch (error) {
  console.error("Commerce refund lifecycle edge-case tests failed.", error);
  process.exitCode = 1;
}
