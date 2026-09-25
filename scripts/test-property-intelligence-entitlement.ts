import assert from "node:assert/strict";

import { evaluatePropertyCheckout } from "../lib/property-intelligence-entitlement";

assert.deepEqual(
  evaluatePropertyCheckout({
    status: "complete",
    paymentStatus: "paid",
    amountSubtotal: 4900,
    amountTotal: 4900,
    amountDiscount: 0,
  }),
  { entitled: true, amountPaidCents: 4900, complimentary: false },
);

assert.deepEqual(
  evaluatePropertyCheckout({
    status: "complete",
    paymentStatus: "no_payment_required",
    amountSubtotal: 4900,
    amountTotal: 0,
    amountDiscount: 4900,
  }),
  { entitled: true, amountPaidCents: 0, complimentary: true },
);

for (const proof of [
  { status: "open", paymentStatus: "no_payment_required", amountSubtotal: 4900, amountTotal: 0, amountDiscount: 4900 },
  { status: "complete", paymentStatus: "unpaid", amountSubtotal: 4900, amountTotal: 4900, amountDiscount: 0 },
  { status: "complete", paymentStatus: "no_payment_required", amountSubtotal: 4900, amountTotal: 0, amountDiscount: 4800 },
  { status: "complete", paymentStatus: "no_payment_required", amountSubtotal: 0, amountTotal: 0, amountDiscount: 0 },
  { status: "complete", paymentStatus: "paid", amountSubtotal: 4900, amountTotal: -1, amountDiscount: 0 },
] as const) {
  assert.equal(evaluatePropertyCheckout(proof).entitled, false);
}

console.log("Property Intelligence entitlement boundary passed.");
