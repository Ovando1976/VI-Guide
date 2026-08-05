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

const generatedAt = new Date("2026-08-06T00:00:00.000Z");
const csv = buildCommerceLedgerCsv([otherListing, refund, capture], {
  listingId: "listing-a",
  generatedAt,
});

assert.equal(csv.startsWith("\uFEFF"), true);
assert.equal(csv.includes("guest_email"), false);
assert.equal(csv.includes("STAY-2026-001"), true);
assert.equal(csv.includes("TOUR-2026-002"), false);
assert.equal(csv.includes("'=Dangerous Business"), true);
assert.equal(csv.includes('"10000","1000","9000","0"'), true);
assert.equal(csv.includes('"-10000","-1000","-9000","0"'), true);
assert.equal(csv.includes('"statement_total"'), true);
assert.equal(
  csv.includes('"0","0","0","0"'),
  true,
  "Full reversal should leave zero statement totals.",
);

const allCsv = buildCommerceLedgerCsv([capture, otherListing], { generatedAt });
assert.equal(allCsv.includes("listing-a"), true);
assert.equal(allCsv.includes("listing-b"), true);

assert.equal(
  commerceLedgerCsvFilename({ listingId: "Listing A / East", generatedAt }),
  "vi-guide-commerce-ledger-listing-a-east-2026-08-06.csv",
);
assert.equal(
  commerceLedgerCsvFilename({ generatedAt }),
  "vi-guide-commerce-ledger-2026-08-06.csv",
);

console.log("Commerce ledger CSV tests passed.");
