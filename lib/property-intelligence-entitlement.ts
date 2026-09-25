export type PropertyCheckoutProof = {
  status: string | null;
  paymentStatus: string | null;
  amountSubtotal: number | null;
  amountTotal: number | null;
  amountDiscount: number | null;
};

export type PropertyCheckoutDecision =
  | { entitled: true; amountPaidCents: number; complimentary: boolean }
  | { entitled: false; amountPaidCents: 0; complimentary: false };

/**
 * Stripe reports a successfully completed 100%-off Checkout Session as
 * `no_payment_required`. Accept that narrow case without weakening the paid
 * checkout boundary or treating a complimentary redemption as revenue.
 */
export function evaluatePropertyCheckout(
  checkout: PropertyCheckoutProof,
): PropertyCheckoutDecision {
  if (checkout.status !== "complete") return denied();

  const subtotal = checkout.amountSubtotal;
  const total = checkout.amountTotal;
  const discount = checkout.amountDiscount;
  if (![subtotal, total, discount].every(isNonNegativeSafeInteger)) return denied();

  if (checkout.paymentStatus === "paid" && total! > 0) {
    return { entitled: true, amountPaidCents: total!, complimentary: false };
  }

  const fullyDiscounted =
    checkout.paymentStatus === "no_payment_required" &&
    subtotal! > 0 &&
    total === 0 &&
    discount === subtotal;

  return fullyDiscounted
    ? { entitled: true, amountPaidCents: 0, complimentary: true }
    : denied();
}

function isNonNegativeSafeInteger(value: number | null): value is number {
  return Number.isSafeInteger(value) && value! >= 0;
}

function denied(): PropertyCheckoutDecision {
  return { entitled: false, amountPaidCents: 0, complimentary: false };
}
