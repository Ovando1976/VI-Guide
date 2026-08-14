import assert from "node:assert/strict";

import { jsonBodyErrorMessage, parseJsonBody } from "../lib/api/request";
import {
  isMerchantCommerceTransition,
  merchantCommerceTransitionError,
  normalizeCommerceLifecycleStatus,
} from "../lib/payments/commerce-booking-lifecycle";
import {
  buildCommerceCheckoutIdempotencyKey,
  commerceCheckoutApplicationDecision,
  isValidCommerceDeposit,
  MAX_COMMERCE_DEPOSIT_CENTS,
  normalizeCommerceEmail,
  validateCompletedCommerceCheckout,
  type CompletedCommerceCheckoutInput,
} from "../lib/payments/commerce-checkout-integrity";
import {
  buildCommerceRefundOperationId,
  commerceRefundEligibilityError,
  commerceRefundStatusFromStripe,
  hasCommerceRefundActivity,
  normalizeCommerceRefundStatus,
} from "../lib/payments/commerce-refund-integrity";
import { normalizeTimestamp, normalizeTimestampOrEpoch } from "../lib/timestamps";

async function testRequestParsing() {
  const valid = await parseJsonBody<{ name: string }>(
    new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ name: "USVI Explorer" }),
    }),
  );
  assert.deepEqual(valid, { ok: true, value: { name: "USVI Explorer" } });

  const missingContentType = await parseJsonBody<{ enabled: boolean }>(
    new Request("http://localhost/test", {
      method: "POST",
      body: new TextEncoder().encode(JSON.stringify({ enabled: true })),
    }),
  );
  assert.deepEqual(missingContentType, { ok: true, value: { enabled: true } });

  const invalidContentType = await parseJsonBody(
    new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "not-json",
    }),
  );
  assert.deepEqual(invalidContentType, { ok: false, reason: "invalid-content-type" });
  if (!invalidContentType.ok) {
    assert.equal(jsonBodyErrorMessage(invalidContentType), "Content-Type must be application/json.");
  }

  const invalidJson = await parseJsonBody(
    new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  assert.deepEqual(invalidJson, { ok: false, reason: "invalid-json" });
  if (!invalidJson.ok) {
    assert.equal(jsonBodyErrorMessage(invalidJson), "Request body must contain valid JSON.");
  }
}

function testTimestampNormalization() {
  const iso = "2026-08-02T12:00:00.000Z";
  const milliseconds = Date.parse(iso);
  const seconds = milliseconds / 1000;

  assert.equal(normalizeTimestamp(iso), iso);
  assert.equal(normalizeTimestamp(milliseconds), iso);
  assert.equal(normalizeTimestamp(new Date(milliseconds)), iso);
  assert.equal(normalizeTimestamp({ seconds }), iso);
  assert.equal(normalizeTimestamp({ toDate: () => new Date(milliseconds) }), iso);

  assert.equal(normalizeTimestamp(undefined), undefined);
  assert.equal(normalizeTimestamp(null), undefined);
  assert.equal(normalizeTimestamp(""), undefined);
  assert.equal(normalizeTimestamp("not-a-date"), undefined);
  assert.equal(normalizeTimestamp({}), undefined);
  assert.equal(normalizeTimestampOrEpoch("not-a-date"), "1970-01-01T00:00:00.000Z");
}

function testCommerceCheckoutIntegrity() {
  const valid: CompletedCommerceCheckoutInput = {
    checkoutSessionId: "cs_live_expected",
    expectedSessionId: "cs_live_expected",
    paymentIntentId: "pi_live_expected",
    expectedAmountCents: 12_500,
    paidAmountCents: 12_500,
    currency: "usd",
    expectedEmail: "traveler@example.com",
    paidEmail: "traveler@example.com",
    expectedReference: "VI-STAY-ABC123",
    sessionReference: "VI-STAY-ABC123",
  };

  assert.equal(validateCompletedCommerceCheckout(valid), null);
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, expectedSessionId: "" }),
    "checkout_session_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({
      ...valid,
      checkoutSessionId: "cs_live_unexpected",
    }),
    "checkout_session_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, paymentIntentId: "" }),
    "payment_intent_missing",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, paidAmountCents: 12_499 }),
    "amount_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, expectedAmountCents: 0 }),
    "amount_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, currency: "eur" }),
    "currency_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, currency: null }),
    "currency_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({
      ...valid,
      paidEmail: "other@example.com",
    }),
    "customer_email_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, expectedEmail: "" }),
    "customer_email_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({
      ...valid,
      sessionReference: "VI-STAY-WRONG",
    }),
    "booking_reference_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, sessionReference: "" }),
    "booking_reference_mismatch",
  );

  const application = {
    bookingStatus: "payment_required",
    paymentStatus: "unpaid",
    refundStatus: "not_requested",
    existingPaymentIntentId: "",
    incomingPaymentIntentId: "pi_live_expected",
    existingPaidAmountCents: 0,
    incomingPaidAmountCents: 12_500,
  };
  assert.equal(commerceCheckoutApplicationDecision(application), "apply");
  assert.equal(
    commerceCheckoutApplicationDecision({
      ...application,
      bookingStatus: "confirmed",
      paymentStatus: "paid",
      existingPaymentIntentId: "pi_live_expected",
      existingPaidAmountCents: 12_500,
    }),
    "already_applied",
  );
  assert.equal(
    commerceCheckoutApplicationDecision({
      ...application,
      bookingStatus: "cancelled",
    }),
    "review_required",
  );
  assert.equal(
    commerceCheckoutApplicationDecision({
      ...application,
      bookingStatus: "cancelled",
      paymentStatus: "refunded",
      refundStatus: "succeeded",
    }),
    "ignore_after_refund",
  );
  assert.equal(
    commerceCheckoutApplicationDecision({
      ...application,
      bookingStatus: "confirmed",
      paymentStatus: "paid",
      existingPaymentIntentId: "pi_other",
      existingPaidAmountCents: 12_500,
    }),
    "review_required",
  );

  assert.equal(normalizeCommerceEmail(" Traveler@Example.COM "), "traveler@example.com");
  assert.equal(normalizeCommerceEmail(null), "");

  assert.equal(isValidCommerceDeposit(1), true);
  assert.equal(isValidCommerceDeposit(MAX_COMMERCE_DEPOSIT_CENTS), true);
  assert.equal(isValidCommerceDeposit(0), false);
  assert.equal(isValidCommerceDeposit(-1), false);
  assert.equal(isValidCommerceDeposit(10.5), false);
  assert.equal(isValidCommerceDeposit(MAX_COMMERCE_DEPOSIT_CENTS + 1), false);

  const keyInput = {
    bookingId: "booking-123",
    amountCents: 12_500,
    requestVersion: "2026-08-04T20:00:00.000Z",
  };
  const idempotencyKey = buildCommerceCheckoutIdempotencyKey(keyInput);
  assert.match(idempotencyKey, /^[a-f0-9]{64}$/);
  assert.equal(idempotencyKey, buildCommerceCheckoutIdempotencyKey(keyInput));
  assert.notEqual(
    idempotencyKey,
    buildCommerceCheckoutIdempotencyKey({ ...keyInput, amountCents: 12_501 }),
  );
  assert.notEqual(
    idempotencyKey,
    buildCommerceCheckoutIdempotencyKey({
      ...keyInput,
      requestVersion: "2026-08-04T20:01:00.000Z",
    }),
  );
}

function testCommerceLifecycleIntegrity() {
  assert.equal(isMerchantCommerceTransition("payment_required"), true);
  assert.equal(isMerchantCommerceTransition("confirmed"), true);
  assert.equal(isMerchantCommerceTransition("paid"), false);
  assert.equal(normalizeCommerceLifecycleStatus("paid"), "paid");
  assert.equal(normalizeCommerceLifecycleStatus("unknown"), "requested");

  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "requested",
      nextStatus: "payment_required",
      depositAmountCents: 5_000,
    }),
    null,
  );
  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "requested",
      nextStatus: "payment_required",
      depositAmountCents: 0,
    }),
    "Enter a valid deposit amount before requesting payment.",
  );
  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "payment_required",
      nextStatus: "confirmed",
      depositAmountCents: 0,
    }),
    "Only a Stripe-verified paid booking can be confirmed.",
  );
  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "paid",
      nextStatus: "confirmed",
      depositAmountCents: 0,
    }),
    null,
  );
  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "confirmed",
      nextStatus: "completed",
      depositAmountCents: 0,
    }),
    null,
  );
  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "paid",
      nextStatus: "cancelled",
      depositAmountCents: 0,
    }),
    "Paid bookings must use the refund workflow before cancellation.",
  );
  assert.equal(
    merchantCommerceTransitionError({
      currentStatus: "payment_required",
      nextStatus: "cancelled",
      depositAmountCents: 0,
      hasActiveCheckout: true,
    }),
    "Expire the active Stripe Checkout Session before closing this booking.",
  );
}

function testCommerceRefundIntegrity() {
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
    commerceRefundEligibilityError({
      ...valid,
      confirmedReference: "VI-STAY-WRONG",
    }),
    "Type the exact booking reference to authorize this refund.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, paymentStatus: "unpaid" }),
    "Only a Stripe-verified paid booking can be refunded.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, paymentIntentId: "" }),
    "This booking does not have a Stripe PaymentIntent to refund.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, paidAmountCents: 0 }),
    "The captured payment amount is not valid for an automatic refund.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, bookingStatus: "requested" }),
    "This booking is not in a refundable lifecycle state.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, refundStatus: "processing" }),
    "A refund is already processing for this booking.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, refundStatus: "succeeded" }),
    "This booking has already been refunded.",
  );
  assert.equal(
    commerceRefundEligibilityError({ ...valid, refundStatus: "failed" }),
    "This refund failed and requires manual financial review before another attempt.",
  );
  assert.equal(
    commerceRefundEligibilityError({
      ...valid,
      refundStatus: "review_required",
    }),
    "This booking requires manual financial review before another refund attempt.",
  );

  const operationInput = {
    bookingId: "booking-123",
    paymentIntentId: "pi_123",
    paidAmountCents: 12_500,
  };
  const operationId = buildCommerceRefundOperationId(operationInput);
  assert.match(operationId, /^[a-f0-9]{64}$/);
  assert.equal(operationId, buildCommerceRefundOperationId(operationInput));
  assert.notEqual(
    operationId,
    buildCommerceRefundOperationId({
      ...operationInput,
      paidAmountCents: 12_501,
    }),
  );

  assert.equal(normalizeCommerceRefundStatus(undefined), "not_requested");
  assert.equal(normalizeCommerceRefundStatus("processing"), "processing");
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "paid",
      refundStatus: "not_requested",
    }),
    false,
  );
  assert.equal(
    hasCommerceRefundActivity({
      paymentStatus: "refund_failed",
      refundStatus: "failed",
    }),
    true,
  );
  assert.equal(commerceRefundStatusFromStripe("pending"), "processing");
  assert.equal(commerceRefundStatusFromStripe("succeeded"), "succeeded");
  assert.equal(commerceRefundStatusFromStripe("failed"), "failed");
  assert.equal(commerceRefundStatusFromStripe("canceled"), "failed");
  assert.equal(commerceRefundStatusFromStripe("requires_action"), "review_required");
}

async function main() {
  await testRequestParsing();
  testTimestampNormalization();
  testCommerceCheckoutIntegrity();
  testCommerceLifecycleIntegrity();
  testCommerceRefundIntegrity();
  console.log("API, payment, and refund contract tests passed.");
}

main().catch((error: unknown) => {
  console.error("API, payment, and refund contract tests failed.", error);
  process.exitCode = 1;
});
