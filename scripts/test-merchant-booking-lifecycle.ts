import assert from "node:assert/strict";

import {
  canMerchantCommerceTransition,
  merchantCommerceTransitionError,
  merchantCommerceTransitionsForStatus,
} from "../lib/payments/commerce-booking-lifecycle";

assert.deepEqual(merchantCommerceTransitionsForStatus("requested"), [
  "reviewing",
  "payment_required",
  "declined",
  "cancelled",
]);
assert.equal(
  canMerchantCommerceTransition("requested", "confirmed"),
  false,
  "new requests must not be confirmed before Stripe verifies payment",
);
assert.equal(
  canMerchantCommerceTransition("reviewing", "confirmed"),
  false,
  "reviewing requests must not bypass payment",
);
assert.deepEqual(merchantCommerceTransitionsForStatus("paid"), ["confirmed"]);
assert.deepEqual(merchantCommerceTransitionsForStatus("confirmed"), [
  "completed",
]);
assert.deepEqual(merchantCommerceTransitionsForStatus("completed"), []);

assert.equal(
  merchantCommerceTransitionError({
    currentStatus: "requested",
    nextStatus: "payment_required",
    depositAmountCents: 5000,
  }),
  null,
);
assert.match(
  merchantCommerceTransitionError({
    currentStatus: "requested",
    nextStatus: "payment_required",
    depositAmountCents: 0,
  }) ?? "",
  /valid deposit amount/i,
);
assert.match(
  merchantCommerceTransitionError({
    currentStatus: "requested",
    nextStatus: "confirmed",
    depositAmountCents: 0,
  }) ?? "",
  /Stripe-verified paid booking/i,
);
assert.equal(
  merchantCommerceTransitionError({
    currentStatus: "paid",
    nextStatus: "confirmed",
    depositAmountCents: 5000,
  }),
  null,
);
assert.match(
  merchantCommerceTransitionError({
    currentStatus: "paid",
    nextStatus: "cancelled",
    depositAmountCents: 5000,
  }) ?? "",
  /refund workflow/i,
);
assert.equal(
  merchantCommerceTransitionError({
    currentStatus: "confirmed",
    nextStatus: "completed",
    depositAmountCents: 5000,
  }),
  null,
);
assert.match(
  merchantCommerceTransitionError({
    currentStatus: "payment_required",
    nextStatus: "cancelled",
    depositAmountCents: 5000,
    hasActiveCheckout: true,
  }) ?? "",
  /Expire the active Stripe Checkout Session/i,
);
assert.equal(
  merchantCommerceTransitionError({
    currentStatus: "payment_required",
    nextStatus: "cancelled",
    depositAmountCents: 5000,
    hasActiveCheckout: false,
  }),
  null,
);

console.log("Merchant booking lifecycle tests passed.");
