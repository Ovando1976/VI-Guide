import assert from "node:assert/strict";

import {
  buildCommerceLedgerCsv,
  commerceLedgerCsvFilename,
} from "../lib/payments/commerce-ledger-csv";
import type { CommerceLedgerEntry } from "../lib/payments/commerce-ledger";

const capture: CommerceLedgerEntry = {
  id: "capture-1",
  kind: "capture",
  status: "held",
  bookingId: "booking-1",
  bookingReference: "STAY-2026-001",
  listingId: "listing-a",
  listingName: "=Dangerous Business",
  paymentIntentId: "pi_capture_1",
  checkoutSessionId: "cs_capture_1",
  refundId: null,
  reversalOfEntryId: null,
  stripeEventId: "evt_capture_1",
  currency: "usd",
  feeBps: 1000,
  feePolicySource: "environment",
  grossAmountCents: 10_000,
  platformFeeCents: 1_000,
  merchantSettlementCents: 9_000,
  reportedRefundAmountCents: null,
  unallocatedAmountCents: 0,
  occurredAt: "2026-08-05T12:00:00.000Z",
  createdAt: "2026-08-05T12:00:01.000Z",
  updatedAt: "2026-08-05T12:00:01.000Z",
};

const refund: CommerceLedgerEntry = {
  ...capture,
  id: "refund-1",
  kind: "refund",
  status: "posted",
  refundId: "re_refund_1",
  reversalOfEntryId: capture.id,
  stripeEventId: "evt_refund_1",
  grossAmountCents: -10_000,
  platformFeeCents: -1_000,
  merchantSettlementCents: -9_000,
  reportedRefundAmountCents: 10_000,
  occurredAt: "2026-08-05T13:00:00.000Z",
  createdAt: "2026-08-05T13:00:01.000Z",
  updatedAt: "2026-08-05T13:00:01.000Z",
};

const otherListing: CommerceLedgerEntry = {
  ...capture,
  id: "capture-2",
  bookingId: "booking-2",
  bookingReference: "TOUR-2026-002",
  listingId: "listing-b",
  listingName: "Business B",
  paymentIntentId: "pi_capture_2",
  checkoutSessionId: "cs_capture_2",
  stripeEventId: "evt_capture_2",
  grossAmountCents: 5_000,
  platformFeeCents: 500,
  merchantSettlementCents: 4_500,
};

const malformed = {
  ...capture,
  id: "capture-malformed",
  bookingId: "booking-malformed",
  bookingReference: "BAD-2026-001",
  paymentIntentId: "pi_malformed",
  stripeEventId: "evt_malformed",
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
assert.equal(csv.includes("BAD-2026-001"), false);
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
assert.match(cleanCsv, /"statement_total"[^\r\n]*"validated"[^\r\n]*"0"/);
assert.equal(
  cleanCsv.includes("Totals include every selected validated ledger entry."),
  true,
);

const spreadsheetInjectionCsv = buildCommerceLedgerCsv(
  [
    {
      ...capture,
      id: "capture-formula",
      bookingId: "booking-formula",
      bookingReference: "-2+3",
      listingName: "@SUM(A1:A2)",
      paymentIntentId: "pi_formula",
      stripeEventId: "evt_formula",
    },
  ],
  { generatedAt },
);
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
