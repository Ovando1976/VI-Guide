import assert from "node:assert/strict";

import {
  buildCommerceLedgerCsv,
  commerceLedgerCsvFilename,
} from "../lib/payments/commerce-ledger-csv";
import {
  buildCommerceCaptureLedgerEntry,
  buildCommerceRefundLedgerEntry,
} from "../lib/payments/commerce-ledger";

const capture = buildCommerceCaptureLedgerEntry({
  bookingId: "booking-1",
  bookingReference: "STAY-2026-001",
  listingId: "listing-a",
  listingName: "=Dangerous Business",
  paymentIntentId: "pi_capture_1",
  checkoutSessionId: "cs_capture_1",
  stripeEventId: "evt_capture_1",
  grossAmountCents: 10_000,
  currency: "usd",
  policy: { feeBps: 1000, source: "environment" },
  verified: true,
  occurredAt: "2026-08-05T12:00:00.000Z",
  now: new Date("2026-08-05T12:00:01.000Z"),
});
assert.ok(capture);

const refund = buildCommerceRefundLedgerEntry({
  bookingId: capture.bookingId,
  bookingReference: capture.bookingReference,
  listingId: capture.listingId,
  listingName: capture.listingName,
  paymentIntentId: capture.paymentIntentId,
  checkoutSessionId: capture.checkoutSessionId,
  refundId: "re_refund_1",
  stripeEventId: "evt_refund_1",
  refundStatus: "succeeded",
  refundAmountCents: capture.grossAmountCents,
  currency: capture.currency,
  paymentIntentMatches: true,
  fullRefund: true,
  captureEntryId: capture.id,
  captureGrossAmountCents: capture.grossAmountCents,
  capturePlatformFeeCents: capture.platformFeeCents,
  captureMerchantSettlementCents: capture.merchantSettlementCents,
  feeBps: capture.feeBps,
  feePolicySource: capture.feePolicySource,
  occurredAt: "2026-08-05T13:00:00.000Z",
  now: new Date("2026-08-05T13:00:01.000Z"),
});
assert.ok(refund);

const otherListing = buildCommerceCaptureLedgerEntry({
  bookingId: "booking-2",
  bookingReference: "TOUR-2026-002",
  listingId: "listing-b",
  listingName: "Business B",
  paymentIntentId: "pi_capture_2",
  checkoutSessionId: "cs_capture_2",
  stripeEventId: "evt_capture_2",
  grossAmountCents: 5_000,
  currency: "usd",
  policy: { feeBps: 1000, source: "environment" },
  verified: true,
  occurredAt: "2026-08-05T14:00:00.000Z",
  now: new Date("2026-08-05T14:00:01.000Z"),
});
assert.ok(otherListing);

const malformed = {
  ...capture,
  occurredAt: "not-a-date",
};

const generatedAt = new Date("2026-08-06T00:00:00.000Z");
const csv = buildCommerceLedgerCsv(
  [otherListing, refund, malformed, capture],
  {
    listingId: "listing-a",
    generatedAt,
  },
);

assert.equal(csv.startsWith("\uFEFF"), true);
assert.equal(csv.includes("guest_email"), false);
assert.equal(csv.includes("STAY-2026-001"), true);
assert.equal(csv.includes("TOUR-2026-002"), false);
assert.equal(csv.includes("'=Dangerous Business"), true);
assert.equal(csv.includes('"10000","1000","9000","0"'), true);
assert.equal(csv.includes('"-10000","-1000","-9000","0"'), true);
assert.equal(csv.includes('"statement_note"'), true);
assert.equal(
  csv.includes(
    "Accounting evidence only; not proof that a merchant payout or settlement occurred.",
  ),
  true,
);
assert.equal(csv.includes('"rejected_record_count"'), true);
assert.match(
  csv,
  /"statement_total"[^\r\n]*"review_required"[^\r\n]*"1"/,
);
assert.equal(
  csv.includes(
    "Totals exclude malformed records; review the rejected record count before relying on this statement.",
  ),
  true,
);
assert.equal(
  csv.includes('"0","0","0","0"'),
  true,
  "Full reversal should leave zero statement totals.",
);

const cleanCsv = buildCommerceLedgerCsv([capture, otherListing], {
  generatedAt,
});
assert.equal(cleanCsv.includes("listing-a"), true);
assert.equal(cleanCsv.includes("listing-b"), true);
assert.match(
  cleanCsv,
  /"statement_total"[^\r\n]*"validated"[^\r\n]*"0"/,
);
assert.equal(
  cleanCsv.includes("Totals include every selected validated ledger entry."),
  true,
);

const formulaCapture = buildCommerceCaptureLedgerEntry({
  bookingId: "booking-formula",
  bookingReference: "-2+3",
  listingId: "listing-formula",
  listingName: "@SUM(A1:A2)",
  paymentIntentId: "pi_formula",
  checkoutSessionId: "cs_formula",
  stripeEventId: "evt_formula",
  grossAmountCents: 1_000,
  currency: "usd",
  policy: { feeBps: 0, source: "unconfigured" },
  verified: true,
  occurredAt: "2026-08-05T15:00:00.000Z",
  now: new Date("2026-08-05T15:00:01.000Z"),
});
assert.ok(formulaCapture);
const spreadsheetInjectionCsv = buildCommerceLedgerCsv([formulaCapture], {
  generatedAt,
});
assert.equal(spreadsheetInjectionCsv.includes("'-2+3"), true);
assert.equal(spreadsheetInjectionCsv.includes("'@SUM(A1:A2)"), true);

assert.equal(
  commerceLedgerCsvFilename({ listingId: "Listing A / East", generatedAt }),
  "vi-guide-commerce-ledger-listing-a-east-2026-08-06.csv",
);
assert.equal(
  commerceLedgerCsvFilename({ generatedAt }),
  "vi-guide-commerce-ledger-2026-08-06.csv",
);

console.log("Commerce ledger CSV tests passed.");
