import {
  commerceCaptureLedgerId,
  resolveCommerceLedgerPolicy,
  type CommerceLedgerEntry,
  type CommerceLedgerPolicy,
} from "@/lib/payments/commerce-ledger";

export type CommerceLedgerBookingRecord = {
  id: string;
  paymentIntentId?: unknown;
  paymentStatus?: unknown;
  paymentIntegrityStatus?: unknown;
  refundStatus?: unknown;
  commercePlatformFeeBps?: unknown;
  commerceFeePolicySource?: unknown;
};

export type CommerceLedgerListingSummary = {
  listingId: string;
  listingName: string;
  captures: number;
  refunds: number;
  grossCents: number;
  platformFeeCents: number;
  merchantSettlementCents: number;
  unallocatedCents: number;
  reviewCount: number;
  latestAt: string;
};

export function hasCommerceFinancialActivity(
  record: CommerceLedgerBookingRecord,
) {
  const paymentIntentId = clean(record.paymentIntentId, 220);
  const paymentStatus = clean(record.paymentStatus, 40);
  return Boolean(
    paymentIntentId &&
      ["paid", "refund_pending", "refunded", "refund_failed"].includes(
        paymentStatus,
      ),
  );
}

export function resolveStoredCommerceLedgerPolicy(
  record: CommerceLedgerBookingRecord,
): CommerceLedgerPolicy {
  const hasStoredFee = Object.prototype.hasOwnProperty.call(
    record,
    "commercePlatformFeeBps",
  );
  if (!hasStoredFee) return { feeBps: 0, source: "unconfigured" };

  const policy = resolveCommerceLedgerPolicy(record.commercePlatformFeeBps);
  return {
    feeBps: policy.feeBps,
    source:
      record.commerceFeePolicySource === "environment"
        ? "environment"
        : "unconfigured",
  };
}

export function summarizeCommerceLedgerListings(
  entries: Array<Partial<CommerceLedgerEntry>>,
): CommerceLedgerListingSummary[] {
  const listings = new Map<string, CommerceLedgerListingSummary>();

  for (const entry of entries) {
    const listingId = clean(entry.listingId, 180) || "unassigned";
    const listingName =
      clean(entry.listingName, 220) || "VI Guide business";
    const current = listings.get(listingId) ?? {
      listingId,
      listingName,
      captures: 0,
      refunds: 0,
      grossCents: 0,
      platformFeeCents: 0,
      merchantSettlementCents: 0,
      unallocatedCents: 0,
      reviewCount: 0,
      latestAt: "",
    };

    if (entry.kind === "capture") current.captures += 1;
    if (entry.kind === "refund") current.refunds += 1;
    current.grossCents += signedMoney(entry.grossAmountCents);
    current.platformFeeCents += signedMoney(entry.platformFeeCents);
    current.merchantSettlementCents += signedMoney(
      entry.merchantSettlementCents,
    );
    current.unallocatedCents += signedMoney(entry.unallocatedAmountCents);
    if (entry.status === "review_required") current.reviewCount += 1;

    const occurredAt = normalizeIso(entry.occurredAt);
    if (occurredAt && occurredAt > current.latestAt) {
      current.latestAt = occurredAt;
    }
    listings.set(listingId, current);
  }

  return [...listings.values()].sort((left, right) => {
    if (
      right.merchantSettlementCents !== left.merchantSettlementCents
    ) {
      return right.merchantSettlementCents - left.merchantSettlementCents;
    }
    return left.listingName.localeCompare(right.listingName);
  });
}

export function summarizeCommerceLedgerReconciliation(
  bookings: CommerceLedgerBookingRecord[],
  ledgerEntryIds: Iterable<string>,
) {
  const ledgerIds = new Set(ledgerEntryIds);
  let financialBookings = 0;
  let missingCaptureEntries = 0;
  let reviewRequiredBookings = 0;

  for (const booking of bookings) {
    if (!hasCommerceFinancialActivity(booking)) continue;
    financialBookings += 1;

    const paymentIntentId = clean(booking.paymentIntentId, 220);
    const captureEntryId = commerceCaptureLedgerId(paymentIntentId);
    if (captureEntryId && !ledgerIds.has(captureEntryId)) {
      missingCaptureEntries += 1;
    }
    if (
      booking.paymentIntegrityStatus === "review_required" ||
      booking.refundStatus === "review_required"
    ) {
      reviewRequiredBookings += 1;
    }
  }

  return {
    scannedBookings: bookings.length,
    financialBookings,
    missingCaptureEntries,
    reviewRequiredBookings,
  };
}

function normalizeIso(value: unknown) {
  if (typeof value !== "string") return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function signedMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : 0;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
