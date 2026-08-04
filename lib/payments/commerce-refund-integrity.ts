import { createHash } from "node:crypto";

export type CommerceRefundStatus =
  | "not_requested"
  | "processing"
  | "succeeded"
  | "failed"
  | "review_required";

export type CommerceRefundEventDecision =
  | "apply"
  | "ignore_stale"
  | "review_multiple_refunds";

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

  if (
    !["paid", "confirmed", "completed", "cancelled"].includes(
      input.bookingStatus,
    )
  ) {
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

export function buildCommerceRefundIdempotencyKey(input: {
  operationId: string;
  attemptNumber: number;
}) {
  if (
    !input.operationId ||
    !Number.isSafeInteger(input.attemptNumber) ||
    input.attemptNumber <= 0
  ) {
    throw new Error("A valid refund operation and attempt are required.");
  }

  return `vi-guide-refund-${createHash("sha256")
    .update(
      [
        "vi-guide-commerce-refund-attempt",
        input.operationId,
        String(input.attemptNumber),
      ].join("|"),
    )
    .digest("hex")}`;
}

export function normalizeCommerceRefundStatus(value: unknown): CommerceRefundStatus {
  return value === "processing" ||
    value === "succeeded" ||
    value === "failed" ||
    value === "review_required"
    ? value
    : "not_requested";
}

export function hasCommerceRefundActivity(input: {
  paymentStatus: unknown;
  refundStatus: unknown;
}) {
  const paymentStatus = String(input.paymentStatus ?? "");
  return (
    normalizeCommerceRefundStatus(input.refundStatus) !== "not_requested" ||
    paymentStatus === "refund_pending" ||
    paymentStatus === "refunded" ||
    paymentStatus === "refund_failed"
  );
}

export function commerceRefundStatusFromStripe(value: unknown): CommerceRefundStatus {
  if (value === "succeeded") return "succeeded";
  if (value === "failed" || value === "canceled") return "failed";
  if (value === "pending") return "processing";
  return "review_required";
}

export function commerceRefundEventDecision(input: {
  currentStatus: unknown;
  currentRefundId: unknown;
  incomingStatus: CommerceRefundStatus;
  incomingRefundId: string;
}): CommerceRefundEventDecision {
  const currentStatus = normalizeCommerceRefundStatus(input.currentStatus);
  const currentRefundId = String(input.currentRefundId ?? "").trim();

  if (
    currentRefundId &&
    currentRefundId !== input.incomingRefundId &&
    currentStatus !== "not_requested"
  ) {
    return "review_multiple_refunds";
  }

  const rank: Record<CommerceRefundStatus, number> = {
    not_requested: 0,
    processing: 1,
    failed: 2,
    review_required: 3,
    succeeded: 4,
  };

  return rank[input.incomingStatus] < rank[currentStatus]
    ? "ignore_stale"
    : "apply";
}
