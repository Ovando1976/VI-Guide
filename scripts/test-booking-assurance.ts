import assert from "node:assert/strict";

import {
  cancellationRefundEstimate,
  normalizeCancellationPolicy,
  resolveCancellationPolicy,
} from "../lib/booking/cancellation-policy";

const verifiedAt = "2026-08-09T12:00:00.000Z";
const flexible = resolveCancellationPolicy("flexible", verifiedAt);
assert.ok(flexible);
assert.equal(flexible.verifiedAt, verifiedAt);
assert.match(flexible.providerTerms, /full refund/i);
assert.equal(resolveCancellationPolicy("provider_custom"), null);

const normalized = normalizeCancellationPolicy({
  code: "standard",
  travelerTerms: "tampered text",
  verifiedAt,
});
assert.ok(normalized);
assert.match(normalized.travelerTerms, /48 hours/i);

assert.deepEqual(
  cancellationRefundEstimate({
    policy: normalized,
    startDate: "2026-08-12",
    preferredTime: "12:00",
    paidAmountCents: 20_000,
    now: new Date("2026-08-09T12:00:00-04:00"),
  }),
  { amountCents: 20_000, disposition: "full" },
);
assert.deepEqual(
  cancellationRefundEstimate({
    policy: normalized,
    startDate: "2026-08-10",
    preferredTime: "18:00",
    paidAmountCents: 20_000,
    now: new Date("2026-08-09T12:00:00-04:00"),
  }),
  { amountCents: 10_000, disposition: "partial" },
);
assert.equal(
  cancellationRefundEstimate({
    policy: normalized,
    startDate: "2026-08-09",
    preferredTime: "18:00",
    paidAmountCents: 20_000,
    now: new Date("2026-08-09T12:00:00-04:00"),
  }).disposition,
  "review_required",
);

console.log("booking assurance tests passed");
