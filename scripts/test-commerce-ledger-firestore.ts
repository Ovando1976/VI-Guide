import assert from "node:assert/strict";

import { resolveStoredCommerceCaptureEntry } from "../lib/payments/commerce-ledger-firestore";

const validHeld = {
  kind: "capture",
  status: "held",
  bookingId: "booking-1",
  bookingReference: "VI-TOUR-1",
  listingId: "listing-1",
  listingName: "Island Tour One",
  paymentIntentId: "pi_1",
  checkoutSessionId: "cs_1",
  stripeEventId: "evt_1",
  currency: "usd",
  feeBps: 1250,
  feePolicySource: "environment",
  grossAmountCents: 10_000,
  platformFeeCents: 1_250,
  merchantSettlementCents: 8_750,
  unallocatedAmountCents: 0,
  occurredAt: "2026-08-05T20:00:00.000Z",
  createdAt: "2026-08-05T20:00:01.000Z",
  updatedAt: "2026-08-05T20:00:01.000Z",
};

const held = resolveStoredCommerceCaptureEntry({
  id: "commerce_capture_held",
  data: validHeld,
  expectedPaymentIntentId: "pi_1",
  expectedGrossAmountCents: 10_000,
});
assert.ok(held);
assert.equal(held.status, "held");
assert.equal(held.platformFeeCents, 1_250);
assert.equal(held.merchantSettlementCents, 8_750);

const review = resolveStoredCommerceCaptureEntry({
  id: "commerce_capture_review",
  data: {
    ...validHeld,
    status: "review_required",
    grossAmountCents: 0,
    platformFeeCents: 0,
    merchantSettlementCents: 0,
    unallocatedAmountCents: 10_000,
  },
  expectedPaymentIntentId: "pi_1",
  expectedGrossAmountCents: 10_000,
});
assert.ok(review);
assert.equal(review.status, "review_required");
assert.equal(review.unallocatedAmountCents, 10_000);

for (const data of [
  { ...validHeld, paymentIntentId: "pi_other" },
  { ...validHeld, grossAmountCents: 9_999 },
  { ...validHeld, platformFeeCents: 1_251 },
  { ...validHeld, feeBps: -1 },
  { ...validHeld, feeBps: 10_001 },
  { ...validHeld, feePolicySource: "unknown" },
  { ...validHeld, currency: "US" },
  { ...validHeld, bookingId: "" },
  { ...validHeld, occurredAt: "not-a-date" },
  { ...validHeld, status: "posted" },
]) {
  assert.equal(
    resolveStoredCommerceCaptureEntry({
      id: "commerce_capture_invalid",
      data,
      expectedPaymentIntentId: "pi_1",
      expectedGrossAmountCents: 10_000,
    }),
    null,
  );
}

console.log("Commerce ledger Firestore integrity tests passed.");
