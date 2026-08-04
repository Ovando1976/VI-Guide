import { createHash } from "node:crypto";

export const MAX_COMMERCE_DEPOSIT_CENTS = 10_000_000;

export type CommerceCheckoutRejectionReason =
  | "checkout_session_mismatch"
  | "payment_intent_missing"
  | "amount_mismatch"
  | "currency_mismatch"
  | "customer_email_mismatch"
  | "booking_reference_mismatch";

export type CompletedCommerceCheckoutInput = {
  checkoutSessionId: string;
  expectedSessionId: string;
  paymentIntentId: string;
  expectedAmountCents: number;
  paidAmountCents: number;
  currency: string | null | undefined;
  expectedEmail: string;
  paidEmail: string;
  expectedReference: string;
  sessionReference: string;
};

export type CommerceCheckoutApplicationDecision =
  | "apply"
  | "already_applied"
  | "ignore_after_refund"
  | "review_required";

export function validateCompletedCommerceCheckout(
  input: CompletedCommerceCheckoutInput,
): CommerceCheckoutRejectionReason | null {
  if (
    !input.expectedSessionId ||
    input.checkoutSessionId !== input.expectedSessionId
  ) {
    return "checkout_session_mismatch";
  }

  if (!input.paymentIntentId) {
    return "payment_intent_missing";
  }

  if (
    !Number.isSafeInteger(input.expectedAmountCents) ||
    input.expectedAmountCents <= 0 ||
    input.paidAmountCents !== input.expectedAmountCents
  ) {
    return "amount_mismatch";
  }

  if (input.currency?.toLowerCase() !== "usd") {
    return "currency_mismatch";
  }

  if (!input.expectedEmail || input.paidEmail !== input.expectedEmail) {
    return "customer_email_mismatch";
  }

  if (
    !input.sessionReference ||
    input.sessionReference !== input.expectedReference
  ) {
    return "booking_reference_mismatch";
  }

  return null;
}

export function commerceCheckoutApplicationDecision(input: {
  bookingStatus: string;
  paymentStatus: string;
  refundStatus: string;
  existingPaymentIntentId: string;
  incomingPaymentIntentId: string;
  existingPaidAmountCents: number;
  incomingPaidAmountCents: number;
}): CommerceCheckoutApplicationDecision {
  if (
    ["refund_pending", "refunded", "refund_failed"].includes(
      input.paymentStatus,
    ) ||
    (input.refundStatus && input.refundStatus !== "not_requested")
  ) {
    return "ignore_after_refund";
  }

  if (
    input.paymentStatus === "paid" &&
    ["paid", "confirmed", "completed"].includes(input.bookingStatus) &&
    input.existingPaymentIntentId === input.incomingPaymentIntentId &&
    input.existingPaidAmountCents === input.incomingPaidAmountCents
  ) {
    return "already_applied";
  }

  if (
    input.bookingStatus === "payment_required" &&
    (input.paymentStatus === "" ||
      input.paymentStatus === "unpaid" ||
      input.paymentStatus === "pending")
  ) {
    return "apply";
  }

  return "review_required";
}

export function isValidCommerceDeposit(value: unknown) {
  const amount = Number(value);
  return (
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= MAX_COMMERCE_DEPOSIT_CENTS
  );
}

export function buildCommerceCheckoutIdempotencyKey(input: {
  bookingId: string;
  amountCents: number;
  requestVersion: string;
}) {
  return createHash("sha256")
    .update(
      [
        "vi-guide-commerce-checkout",
        input.bookingId,
        String(input.amountCents),
        input.requestVersion,
      ].join("|"),
    )
    .digest("hex");
}

export function normalizeCommerceEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
