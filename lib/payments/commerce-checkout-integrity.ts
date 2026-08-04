import { createHash } from "node:crypto";

export const MAX_COMMERCE_DEPOSIT_CENTS = 10_000_000;

export type CommerceCheckoutRejectionReason =
  | "checkout_session_mismatch"
  | "amount_mismatch"
  | "currency_mismatch"
  | "customer_email_mismatch"
  | "booking_reference_mismatch";

export type CompletedCommerceCheckoutInput = {
  checkoutSessionId: string;
  expectedSessionId: string;
  expectedAmountCents: number;
  paidAmountCents: number;
  currency: string | null | undefined;
  expectedEmail: string;
  paidEmail: string;
  expectedReference: string;
  sessionReference: string;
};

export function validateCompletedCommerceCheckout(
  input: CompletedCommerceCheckoutInput,
): CommerceCheckoutRejectionReason | null {
  if (
    !input.expectedSessionId ||
    input.checkoutSessionId !== input.expectedSessionId
  ) {
    return "checkout_session_mismatch";
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
