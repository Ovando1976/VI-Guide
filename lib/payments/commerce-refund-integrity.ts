import { createHash } from "node:crypto";

export type CommerceRefundStatus =
  | "not_requested"
  | "processing"
  | "succeeded"
  | "failed"
  | "review_required";

export function commerceRefundEligibilityError(input: {
  bookingStatus: string;
  paymentStatus: string;
  paymentIntentId: string;
  paidAmountCents: number;
  refundStatus: CommerceRefundStatus;
  expectedReference: string;
  confirmedReference: string;
}) {
  if (
    !input.expectedReference ||
    input.confirmedReference.trim() !== input.expectedReference
  ) {
    return "Type the exact booking reference to authorize this refund.";
  }

  if (input.paymentStatus !== "paid") {
    return "Only a Stripe-verified paid booking can be refunded.";
  }

  if (!input.paymentIntentId) {
    return "This booking does not have a Stripe PaymentIntent to refund.";
  }

  if (
    !Number.isSafeInteger(input.paidAmountCents) ||
    input.paidAmountCents <= 0 ||
    input.paidAmountCents > 10_000_000
  ) {
    return "The captured payment amount is not valid for an automatic refund.";
  }

  if (![
    "paid",
    "confirmed",
    "completed",
  ].includes(input.bookingStatus)) {
    return "This booking is not in a refundable lifecycle state.";
  }

  if (input.refundStatus === "processing") {
    return "A refund is already processing for this booking.";
  }

  if (input.refundStatus === "succeeded") {
    return "This booking has already been refunded.";
  }

  if (input.refundStatus === "review_required") {
    return "This booking requires manual financial review before another refund attempt.";
  }

  return null;
}

export function buildCommerceRefundOperationId(input: {
  bookingId: string;
  paymentIntentId: string;
  paidAmountCents: number;
}) {
  return createHash("sha256")
    .update(
      [
        "vi-guide-commerce-refund",
        input.bookingId,
        input.paymentIntentId,
        String(input.paidAmountCents),
      ].join("|"),
    )
    .digest("hex");
}

export function normalizeCommerceRefundStatus(value: unknown): CommerceRefundStatus {
  return value === "processing" ||
    value === "succeeded" ||
    value === "failed" ||
    value === "review_required"
    ? value
    : "not_requested";
}

export function commerceRefundStatusFromStripe(value: unknown): CommerceRefundStatus {
  if (value === "succeeded") return "succeeded";
  if (value === "failed" || value === "canceled") return "failed";
  return "processing";
}
