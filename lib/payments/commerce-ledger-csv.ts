import type { CommerceLedgerEntry } from "@/lib/payments/commerce-ledger";

export type CommerceLedgerCsvOptions = {
  listingId?: string | null;
  generatedAt?: Date;
};

const CSV_COLUMNS = [
  "record_type",
  "occurred_at",
  "entry_id",
  "kind",
  "status",
  "booking_reference",
  "listing_id",
  "listing_name",
  "gross_amount_cents",
  "platform_fee_cents",
  "merchant_settlement_cents",
  "unallocated_amount_cents",
  "reported_refund_amount_cents",
  "payment_intent_id",
  "checkout_session_id",
  "refund_id",
  "reversal_of_entry_id",
  "stripe_event_id",
  "currency",
  "fee_bps",
  "fee_policy_source",
  "statement_note",
  "rejected_record_count",
] as const;

export function buildCommerceLedgerCsv(
  entries: Array<Partial<CommerceLedgerEntry>>,
  options: CommerceLedgerCsvOptions = {},
) {
  const listingId = clean(options.listingId, 180);
  const selectedRaw = entries.filter(
    (entry) => !listingId || clean(entry.listingId, 180) === listingId,
  );
  const normalized = selectedRaw.map(normalizeEntry);
  const selected = normalized
    .filter((entry): entry is CommerceLedgerEntry => Boolean(entry))
    .sort((left, right) => {
      const byTime = left.occurredAt.localeCompare(right.occurredAt);
      return byTime || left.id.localeCompare(right.id);
    });
  const rejectedRecordCount = normalized.length - selected.length;
  const generatedAt = (options.generatedAt ?? new Date()).toISOString();
  const statementListingName =
    listingId && selected.length ? selected[0].listingName : "";

  const rows: Array<Array<string | number | null>> = [
    [...CSV_COLUMNS],
    [
      "statement_note",
      generatedAt,
      "",
      "",
      "accounting_evidence_only",
      "",
      listingId,
      statementListingName,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "usd",
      "",
      "",
      "Accounting evidence only; not proof that a merchant payout or settlement occurred.",
      rejectedRecordCount,
    ],
    ...selected.map((entry) => [
      "entry",
      entry.occurredAt,
      entry.id,
      entry.kind,
      entry.status,
      entry.bookingReference,
      entry.listingId,
      entry.listingName,
      entry.grossAmountCents,
      entry.platformFeeCents,
      entry.merchantSettlementCents,
      entry.unallocatedAmountCents,
      entry.reportedRefundAmountCents,
      entry.paymentIntentId,
      entry.checkoutSessionId,
      entry.refundId,
      entry.reversalOfEntryId,
      entry.stripeEventId,
      entry.currency,
      entry.feeBps,
      entry.feePolicySource,
      "",
      "",
    ]),
  ];

  const totals = selected.reduce(
    (summary, entry) => {
      summary.gross += entry.grossAmountCents;
      summary.platformFee += entry.platformFeeCents;
      summary.merchantSettlement += entry.merchantSettlementCents;
      summary.unallocated += entry.unallocatedAmountCents;
      return summary;
    },
    { gross: 0, platformFee: 0, merchantSettlement: 0, unallocated: 0 },
  );

  rows.push([
    "statement_total",
    generatedAt,
    "",
    "",
    rejectedRecordCount ? "review_required" : "validated",
    "",
    listingId,
    statementListingName,
    totals.gross,
    totals.platformFee,
    totals.merchantSettlement,
    totals.unallocated,
    null,
    "",
    "",
    "",
    "",
    "",
    "usd",
    "",
    "",
    rejectedRecordCount
      ? "Totals exclude malformed records; review the rejected record count before relying on this statement."
      : "Totals include every selected validated ledger entry.",
    rejectedRecordCount,
  ]);

  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function commerceLedgerCsvFilename(input: {
  listingId?: unknown;
  generatedAt?: Date;
}) {
  const day = (input.generatedAt ?? new Date()).toISOString().slice(0, 10);
  const listingId = clean(input.listingId, 80)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return listingId
    ? `vi-guide-commerce-ledger-${listingId}-${day}.csv`
    : `vi-guide-commerce-ledger-${day}.csv`;
}

function normalizeEntry(
  value: Partial<CommerceLedgerEntry>,
): CommerceLedgerEntry | null {
  const kind = value.kind === "capture" || value.kind === "refund" ? value.kind : null;
  const status =
    value.status === "held" ||
    value.status === "posted" ||
    value.status === "processing" ||
    value.status === "review_required" ||
    value.status === "failed"
      ? value.status
      : null;
  const id = clean(value.id, 100);
  const bookingId = clean(value.bookingId, 180);
  const bookingReference = clean(value.bookingReference, 180);
  const listingId = clean(value.listingId, 180);
  const listingName = clean(value.listingName, 220);
  const paymentIntentId = clean(value.paymentIntentId, 220);
  const stripeEventId = clean(value.stripeEventId, 220);
  const currency = clean(value.currency, 3).toLowerCase();
  const occurredAt = normalizeIso(value.occurredAt);
  const createdAt = normalizeIso(value.createdAt);
  const updatedAt = normalizeIso(value.updatedAt);
  const feeBps = boundedFeeBps(value.feeBps);
  const grossAmountCents = signedInteger(value.grossAmountCents);
  const platformFeeCents = signedInteger(value.platformFeeCents);
  const merchantSettlementCents = signedInteger(value.merchantSettlementCents);
  const unallocatedAmountCents = signedInteger(value.unallocatedAmountCents);
  const reportedRefundAmountCents =
    value.reportedRefundAmountCents === null ||
    value.reportedRefundAmountCents === undefined
      ? null
      : nonNegativeInteger(value.reportedRefundAmountCents);

  if (
    !kind ||
    !status ||
    !id ||
    !bookingId ||
    !bookingReference ||
    !listingId ||
    !listingName ||
    !paymentIntentId ||
    !stripeEventId ||
    !/^[a-z]{3}$/.test(currency) ||
    !occurredAt ||
    !createdAt ||
    !updatedAt ||
    feeBps === null ||
    grossAmountCents === null ||
    platformFeeCents === null ||
    merchantSettlementCents === null ||
    unallocatedAmountCents === null ||
    (reportedRefundAmountCents === null &&
      value.reportedRefundAmountCents !== null &&
      value.reportedRefundAmountCents !== undefined)
  ) {
    return null;
  }

  return {
    id,
    kind,
    status,
    bookingId,
    bookingReference,
    listingId,
    listingName,
    paymentIntentId,
    checkoutSessionId: clean(value.checkoutSessionId, 220) || null,
    refundId: clean(value.refundId, 220) || null,
    reversalOfEntryId: clean(value.reversalOfEntryId, 100) || null,
    stripeEventId,
    currency,
    feeBps,
    feePolicySource:
      value.feePolicySource === "environment"
        ? "environment"
        : value.feePolicySource === "unconfigured"
          ? "unconfigured"
          : "unconfigured",
    grossAmountCents,
    platformFeeCents,
    merchantSettlementCents,
    reportedRefundAmountCents,
    unallocatedAmountCents,
    occurredAt,
    createdAt,
    updatedAt,
  };
}

function csvCell(value: string | number | null) {
  if (value === null) return "";
  const raw = typeof value === "number" ? String(value) : protectSpreadsheet(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

function protectSpreadsheet(value: string) {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function normalizeIso(value: unknown) {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate(): Date }).toDate();
    return Number.isFinite(date.getTime()) ? date.toISOString() : "";
  }
  return "";
}

function boundedFeeBps(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 10_000
    ? number
    : null;
}

function nonNegativeInteger(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function signedInteger(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
