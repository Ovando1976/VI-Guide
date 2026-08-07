import {
  commerceCaptureLedgerId,
  commerceRefundLedgerId,
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
      [
        "paid",
        "merchant_settled",
        "refund_pending",
        "refunded",
        "refund_failed",
      ].includes(paymentStatus),
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
      policy.source === "environment" &&
      record.commerceFeePolicySource === "environment"
        ? "environment"
        : "unconfigured",
  };
}

export function normalizeStoredCommerceLedgerEntry(input: {
  id: unknown;
  data: Partial<CommerceLedgerEntry> | FirebaseFirestore.DocumentData;
}): CommerceLedgerEntry | null {
  const data = input.data;
  const id = clean(input.id, 100);
  const kind = data.kind === "capture" || data.kind === "refund" ? data.kind : null;
  const status = normalizeLedgerStatus(data.status);
  const bookingId = clean(data.bookingId, 180);
  const bookingReference = clean(data.bookingReference, 180);
  const listingId = clean(data.listingId, 180);
  const listingName = clean(data.listingName, 220);
  const paymentIntentId = clean(data.paymentIntentId, 220);
  const checkoutSessionId = clean(data.checkoutSessionId, 220);
  const refundId = clean(data.refundId, 220);
  const reversalOfEntryId = clean(data.reversalOfEntryId, 100);
  const stripeEventId = clean(data.stripeEventId, 220);
  const currency = clean(data.currency, 3).toLowerCase();
  const feeBps = boundedFeeBps(data.feeBps);
  const feePolicySource =
    data.feePolicySource === "environment"
      ? "environment"
      : data.feePolicySource === "unconfigured"
        ? "unconfigured"
        : null;
  const grossAmountCents = boundedSignedMoney(data.grossAmountCents);
  const platformFeeCents = boundedSignedMoney(data.platformFeeCents);
  const merchantSettlementCents = boundedSignedMoney(
    data.merchantSettlementCents,
  );
  const unallocatedAmountCents = boundedSignedMoney(
    data.unallocatedAmountCents,
  );
  const reportedRefundAmountCents =
    data.reportedRefundAmountCents === null ||
    data.reportedRefundAmountCents === undefined
      ? null
      : boundedNonNegativeMoney(data.reportedRefundAmountCents);
  const occurredAt = normalizeIso(data.occurredAt);
  const createdAt = normalizeIso(data.createdAt);
  const updatedAt = normalizeIso(data.updatedAt);

  if (
    !id ||
    !kind ||
    !status ||
    !bookingId ||
    !bookingReference ||
    !listingId ||
    !listingName ||
    !paymentIntentId ||
    !stripeEventId ||
    !/^[a-z]{3}$/.test(currency) ||
    feeBps === null ||
    !feePolicySource ||
    grossAmountCents === null ||
    platformFeeCents === null ||
    merchantSettlementCents === null ||
    unallocatedAmountCents === null ||
    !occurredAt ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  if (kind === "capture") {
    const validId = commerceCaptureLedgerId(paymentIntentId) === id;
    const validReferences = Boolean(
      checkoutSessionId &&
        !refundId &&
        !reversalOfEntryId &&
        reportedRefundAmountCents === null,
    );
    const validHeld = Boolean(
      status === "held" &&
        grossAmountCents > 0 &&
        platformFeeCents >= 0 &&
        merchantSettlementCents >= 0 &&
        platformFeeCents + merchantSettlementCents === grossAmountCents &&
        unallocatedAmountCents === 0,
    );
    const validReview = Boolean(
      status === "review_required" &&
        grossAmountCents === 0 &&
        platformFeeCents === 0 &&
        merchantSettlementCents === 0 &&
        unallocatedAmountCents > 0,
    );
    if (!validId || !validReferences || (!validHeld && !validReview)) {
      return null;
    }
  } else {
    const validId = commerceRefundLedgerId(refundId) === id;
    const validReferences = Boolean(refundId && reversalOfEntryId);
    const hasReportedRefund =
      reportedRefundAmountCents !== null && reportedRefundAmountCents > 0;
    const validPosted = Boolean(
      status === "posted" &&
        hasReportedRefund &&
        grossAmountCents < 0 &&
        platformFeeCents <= 0 &&
        merchantSettlementCents <= 0 &&
        platformFeeCents + merchantSettlementCents === grossAmountCents &&
        Math.abs(grossAmountCents) === reportedRefundAmountCents &&
        unallocatedAmountCents === 0,
    );
    const validNoEffect = Boolean(
      (status === "processing" || status === "failed") &&
        hasReportedRefund &&
        grossAmountCents === 0 &&
        platformFeeCents === 0 &&
        merchantSettlementCents === 0 &&
        unallocatedAmountCents === 0,
    );
    const validReview = Boolean(
      status === "review_required" &&
        hasReportedRefund &&
        grossAmountCents === 0 &&
        platformFeeCents === 0 &&
        merchantSettlementCents === 0 &&
        unallocatedAmountCents <= 0 &&
        Math.abs(unallocatedAmountCents) <= reportedRefundAmountCents,
    );
    if (
      !validId ||
      !validReferences ||
      (!validPosted && !validNoEffect && !validReview)
    ) {
      return null;
    }
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
    checkoutSessionId: checkoutSessionId || null,
    refundId: refundId || null,
    reversalOfEntryId: reversalOfEntryId || null,
    stripeEventId,
    currency,
    feeBps,
    feePolicySource,
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

export function validateStoredCommerceLedgerEntries(
  records: Array<{
    id: unknown;
    data: Partial<CommerceLedgerEntry> | FirebaseFirestore.DocumentData;
  }>,
) {
  const entries: CommerceLedgerEntry[] = [];
  let rejectedRecordCount = 0;

  for (const record of records) {
    const entry = normalizeStoredCommerceLedgerEntry(record);
    if (entry) entries.push(entry);
    else rejectedRecordCount += 1;
  }

  return { entries, rejectedRecordCount };
}

export function summarizeCommerceLedgerListings(
  entries: CommerceLedgerEntry[],
): CommerceLedgerListingSummary[] {
  const listings = new Map<string, CommerceLedgerListingSummary>();

  for (const entry of entries) {
    const current = listings.get(entry.listingId) ?? {
      listingId: entry.listingId,
      listingName: entry.listingName,
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
    current.grossCents += entry.grossAmountCents;
    current.platformFeeCents += entry.platformFeeCents;
    current.merchantSettlementCents += entry.merchantSettlementCents;
    current.unallocatedCents += entry.unallocatedAmountCents;
    if (entry.status === "review_required") current.reviewCount += 1;
    if (entry.occurredAt > current.latestAt) current.latestAt = entry.occurredAt;
    listings.set(entry.listingId, current);
  }

  return [...listings.values()].sort((left, right) => {
    if (right.merchantSettlementCents !== left.merchantSettlementCents) {
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

function normalizeLedgerStatus(value: unknown) {
  return value === "held" ||
    value === "posted" ||
    value === "processing" ||
    value === "review_required" ||
    value === "failed"
    ? value
    : null;
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
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 && amount <= 10_000
    ? amount
    : null;
}

function boundedNonNegativeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 100_000_000
    ? amount
    : null;
}

function boundedSignedMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && Math.abs(amount) <= 100_000_000
    ? amount
    : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
