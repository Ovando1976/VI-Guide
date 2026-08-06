import assert from "node:assert/strict";

import { buildCommerceLedgerCsv } from "../lib/payments/commerce-ledger-csv";
import {
  buildCommerceCaptureLedgerEntry,
  buildCommerceRefundLedgerEntry,
  resolveCommerceLedgerPolicy,
  summarizeCommerceLedger,
} from "../lib/payments/commerce-ledger";

const generatedAt = new Date("2026-08-06T17:45:00.000Z");
const policy = resolveCommerceLedgerPolicy("1000");

assert.deepEqual(policy, {
  feeBps: 1000,
  source: "environment",
});

const capture = buildCommerceCaptureLedgerEntry({
  bookingId: "sandbox-booking-001",
  bookingReference: "VI-SANDBOX-001",
  listingId: "sandbox-island-tour",
  listingName: "Sandbox Island Tour",
  paymentIntentId: "pi_sandbox_vi_guide_001",
  checkoutSessionId: "cs_sandbox_vi_guide_001",
  stripeEventId: "evt_sandbox_capture_001",
  grossAmountCents: 25_000,
  currency: "usd",
  policy,
  verified: true,
  occurredAt: "2026-08-06T17:40:00.000Z",
  now: generatedAt,
});

assert.ok(capture, "Expected the rehearsal capture to be valid.");
assert.equal(capture.status, "held");
assert.equal(capture.grossAmountCents, 25_000);
assert.equal(capture.platformFeeCents, 2_500);
assert.equal(capture.merchantSettlementCents, 22_500);
assert.equal(capture.unallocatedAmountCents, 0);

const refund = buildCommerceRefundLedgerEntry({
  bookingId: capture.bookingId,
  bookingReference: capture.bookingReference,
  listingId: capture.listingId,
  listingName: capture.listingName,
  paymentIntentId: capture.paymentIntentId,
  checkoutSessionId: capture.checkoutSessionId,
  refundId: "re_sandbox_vi_guide_001",
  stripeEventId: "evt_sandbox_refund_001",
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
  occurredAt: "2026-08-06T17:44:00.000Z",
  now: generatedAt,
});

assert.ok(refund, "Expected the rehearsal refund to be valid.");
assert.equal(refund.status, "posted");
assert.equal(refund.grossAmountCents, -25_000);
assert.equal(refund.platformFeeCents, -2_500);
assert.equal(refund.merchantSettlementCents, -22_500);
assert.equal(refund.unallocatedAmountCents, 0);
assert.equal(refund.reversalOfEntryId, capture.id);

const summary = summarizeCommerceLedger([capture, refund]);
assert.deepEqual(summary, {
  captureCount: 1,
  refundCount: 1,
  reviewCount: 0,
  processingCount: 0,
  failedCount: 0,
  grossCapturedCents: 25_000,
  grossRefundedCents: 25_000,
  netGrossCents: 0,
  platformFeeReserveCents: 0,
  merchantSettlementCents: 0,
  unallocatedCents: 0,
});

const csv = buildCommerceLedgerCsv([capture, refund], {
  listingId: capture.listingId,
  generatedAt,
});
const rows = csv
  .replace(/^\uFEFF/, "")
  .trimEnd()
  .split("\r\n")
  .map(parseCsvRow);
const [columns, ...dataRows] = rows;
const statementTotal = dataRows.find(
  (row) => row[columns.indexOf("record_type")] === "statement_total",
);

assert.ok(statementTotal, "Expected a statement-total row in the CSV.");
assert.equal(statementTotal[columns.indexOf("status")], "validated");
assert.equal(statementTotal[columns.indexOf("gross_amount_cents")], "0");
assert.equal(statementTotal[columns.indexOf("platform_fee_cents")], "0");
assert.equal(
  statementTotal[columns.indexOf("merchant_settlement_cents")],
  "0",
);
assert.equal(statementTotal[columns.indexOf("unallocated_amount_cents")], "0");
assert.equal(statementTotal[columns.indexOf("rejected_record_count")], "0");
assert.ok(csv.includes(capture.id));
assert.ok(csv.includes(refund.id));

console.log(
  JSON.stringify(
    {
      result: "passed",
      scenario: "verified capture followed by exact full refund",
      capture: {
        grossAmountCents: capture.grossAmountCents,
        platformFeeCents: capture.platformFeeCents,
        merchantSettlementCents: capture.merchantSettlementCents,
      },
      finalBalances: {
        netGrossCents: summary.netGrossCents,
        platformFeeReserveCents: summary.platformFeeReserveCents,
        merchantSettlementCents: summary.merchantSettlementCents,
        unallocatedCents: summary.unallocatedCents,
      },
      csvStatus: statementTotal[columns.indexOf("status")],
      rejectedRecordCount: Number(
        statementTotal[columns.indexOf("rejected_record_count")],
      ),
    },
    null,
    2,
  ),
);

function parseCsvRow(row: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];

    if (character === '"') {
      if (quoted && row[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      cells.push(cell);
      cell = "";
      continue;
    }

    cell += character;
  }

  cells.push(cell);
  return cells;
}
