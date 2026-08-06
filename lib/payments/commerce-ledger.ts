import { createHash } from "node:crypto";

export type CommerceLedgerPolicySource = "environment" | "unconfigured";
export type CommerceLedgerEntryKind = "capture" | "refund";
export type CommerceLedgerStatus =
  | "held"
  | "posted"
  | "processing"
  | "review_required"
  | "failed";

export type CommerceLedgerPolicy = {
  feeBps: number;
  source: CommerceLedgerPolicySource;
};

export type CommerceCaptureAllocation = {
  grossAmountCents: number;
  platformFeeCents: number;
  merchantSettlementCents: number;
};

export type CommerceLedgerEntry = CommerceCaptureAllocation & {
  id: string;
  kind: CommerceLedgerEntryKind;
  status: CommerceLedgerStatus;
  bookingId: string;
  bookingReference: string;
  listingId: string;
  listingName: string;
  paymentIntentId: string;
  checkoutSessionId: string | null;
  refundId: string | null;
  reversalOfEntryId: string | null;
  stripeEventId: string;
  currency: string;
  feeBps: number;
  feePolicySource: CommerceLedgerPolicySource;
  reportedRefundAmountCents: number | null;
  unallocatedAmountCents: number;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CommerceLedgerSummary = {
  captureCount: number;
  refundCount: number;
  reviewCount: number;
  processingCount: number;
  failedCount: number;
  grossCapturedCents: number;
  grossRefundedCents: number;
  netGrossCents: number;
  platformFeeReserveCents: number;
  merchantSettlementCents: number;
  unallocatedCents: number;
};

const MAX_MONEY_CENTS = 100_000_000;
const MAX_FEE_BPS = 10_000;

export function resolveCommerceLedgerPolicy(value: unknown): CommerceLedgerPolicy {
  if (value === null || value === undefined || value === "") {
    return { feeBps: 0, source: "unconfigured" };
  }

  const feeBps = Number(value);
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > MAX_FEE_BPS) {
    return { feeBps: 0, source: "unconfigured" };
  }

  return { feeBps, source: "environment" };
}

export function commerceCaptureLedgerId(paymentIntentId: unknown) {
  const normalized = clean(paymentIntentId, 220);
  if (!normalized) return "";
  return `commerce_capture_${digest(normalized).slice(0, 40)}`;
}

export function commerceRefundLedgerId(refundId: unknown) {
  const normalized = clean(refundId, 220);
  if (!normalized) return "";
  return `commerce_refund_${digest(normalized).slice(0, 40)}`;
}

export function allocateCommerceCapture(input: {
  grossAmountCents: unknown;
  feeBps: unknown;
}): CommerceCaptureAllocation | null {
  const grossAmountCents = positiveMoney(input.grossAmountCents);
  const feeBps = boundedFeeBps(input.feeBps);
  if (grossAmountCents === null || feeBps === null) return null;

  const platformFeeCents = Math.min(
    grossAmountCents,
    Math.round((grossAmountCents * feeBps) / 10_000),
  );

  return {
    grossAmountCents,
    platformFeeCents,
    merchantSettlementCents: grossAmountCents - platformFeeCents,
  };
}

export function buildCommerceCaptureLedgerEntry(input: {
  bookingId: unknown;
  bookingReference: unknown;
  listingId: unknown;
  listingName: unknown;
  paymentIntentId: unknown;
  checkoutSessionId: unknown;
  stripeEventId: unknown;
  grossAmountCents: unknown;
  currency: unknown;
  policy: CommerceLedgerPolicy;
  verified: boolean;
  occurredAt: unknown;
  now?: Date;
}): CommerceLedgerEntry | null {
  const bookingId = clean(input.bookingId, 180);
  const bookingReference = clean(input.bookingReference, 180);
  const listingId = clean(input.listingId, 180);
  const listingName = clean(input.listingName, 220);
  const paymentIntentId = clean(input.paymentIntentId, 220);
  const checkoutSessionId = clean(input.checkoutSessionId, 220);
  const stripeEventId = clean(input.stripeEventId, 220);
  const currency = normalizeCurrency(input.currency);
  const occurredAt = normalizeIso(input.occurredAt);
  const id = commerceCaptureLedgerId(paymentIntentId);
  const allocation = allocateCommerceCapture({
    grossAmountCents: input.grossAmountCents,
    feeBps: input.policy.feeBps,
  });

  if (
    !bookingId ||
    !bookingReference ||
    !listingId ||
    !listingName ||
    !paymentIntentId ||
    !checkoutSessionId ||
    !stripeEventId ||
    !currency ||
    !occurredAt ||
    !id ||
    !allocation
  ) {
    return null;
  }

  const now = (input.now ?? new Date()).toISOString();
  return {
    id,
    kind: "capture",
    status: input.verified ? "held" : "review_required",
    bookingId,
    bookingReference,
    listingId,
    listingName,
    paymentIntentId,
    checkoutSessionId,
    refundId: null,
    reversalOfEntryId: null,
    stripeEventId,
    currency,
    feeBps: input.policy.feeBps,
    feePolicySource: input.policy.source,
    grossAmountCents: input.verified ? allocation.grossAmountCents : 0,
    platformFeeCents: input.verified ? allocation.platformFeeCents : 0,
    merchantSettlementCents: input.verified
      ? allocation.merchantSettlementCents
      : 0,
    reportedRefundAmountCents: null,
    unallocatedAmountCents: input.verified ? 0 : allocation.grossAmountCents,
    occurredAt,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildCommerceRefundLedgerEntry(input: {
  bookingId: unknown;
  bookingReference: unknown;
  listingId: unknown;
  listingName: unknown;
  paymentIntentId: unknown;
  checkoutSessionId: unknown;
  refundId: unknown;
  stripeEventId: unknown;
  refundStatus: unknown;
  refundAmountCents: unknown;
  currency: unknown;
  paymentIntentMatches: boolean;
  fullRefund: boolean;
  captureEntryId: unknown;
  captureGrossAmountCents: unknown;
  capturePlatformFeeCents: unknown;
  captureMerchantSettlementCents: unknown;
  feeBps: unknown;
  feePolicySource: unknown;
  occurredAt: unknown;
  now?: Date;
}): CommerceLedgerEntry | null {
  const bookingId = clean(input.bookingId, 180);
  const bookingReference = clean(input.bookingReference, 180);
  const listingId = clean(input.listingId, 180);
  const listingName = clean(input.listingName, 220);
  const paymentIntentId = clean(input.paymentIntentId, 220);
  const checkoutSessionId = clean(input.checkoutSessionId, 220);
  const refundId = clean(input.refundId, 220);
  const stripeEventId = clean(input.stripeEventId, 220);
  const currency = normalizeCurrency(input.currency);
  const occurredAt = normalizeIso(input.occurredAt);
  const captureEntryId = clean(input.captureEntryId, 100);
  const id = commerceRefundLedgerId(refundId);
  const refundAmountCents = positiveMoney(input.refundAmountCents);
  const captureGrossAmountCents = positiveMoney(input.captureGrossAmountCents);
  const capturePlatformFeeCents = nonNegativeMoney(input.capturePlatformFeeCents);
  const captureMerchantSettlementCents = nonNegativeMoney(
    input.captureMerchantSettlementCents,
  );
  const feeBps = boundedFeeBps(input.feeBps);
  const feePolicySource = normalizePolicySource(input.feePolicySource);
  const refundStatus = normalizeRefundStatus(input.refundStatus);

  if (
    !bookingId ||
    !bookingReference ||
    !listingId ||
    !listingName ||
    !paymentIntentId ||
    !refundId ||
    !stripeEventId ||
    !currency ||
    !occurredAt ||
    !captureEntryId ||
    !id ||
    refundAmountCents === null ||
    captureGrossAmountCents === null ||
    capturePlatformFeeCents === null ||
    captureMerchantSettlementCents === null ||
    feeBps === null ||
    !feePolicySource ||
    !refundStatus ||
    capturePlatformFeeCents + captureMerchantSettlementCents !==
      captureGrossAmountCents
  ) {
    return null;
  }

  const exactVerifiedReversal = Boolean(
    refundStatus === "succeeded" &&
      input.paymentIntentMatches &&
      input.fullRefund &&
      refundAmountCents === captureGrossAmountCents,
  );
  const status: CommerceLedgerStatus = exactVerifiedReversal
    ? "posted"
    : refundStatus === "pending"
      ? "processing"
      : refundStatus === "failed"
        ? "failed"
        : "review_required";
  const now = (input.now ?? new Date()).toISOString();

  return {
    id,
    kind: "refund",
    status,
    bookingId,
    bookingReference,
    listingId,
    listingName,
    paymentIntentId,
    checkoutSessionId: checkoutSessionId || null,
    refundId,
    reversalOfEntryId: captureEntryId,
    stripeEventId,
    currency,
    feeBps,
    feePolicySource,
    grossAmountCents: exactVerifiedReversal ? -captureGrossAmountCents : 0,
    platformFeeCents: exactVerifiedReversal ? -capturePlatformFeeCents : 0,
    merchantSettlementCents: exactVerifiedReversal
      ? -captureMerchantSettlementCents
      : 0,
    reportedRefundAmountCents: refundAmountCents,
    unallocatedAmountCents:
      refundStatus === "succeeded" && !exactVerifiedReversal
        ? -refundAmountCents
        : 0,
    occurredAt,
    createdAt: now,
    updatedAt: now,
  };
}

export function summarizeCommerceLedger(
  entries: Array<Partial<CommerceLedgerEntry>>,
): CommerceLedgerSummary {
  return entries.reduce<CommerceLedgerSummary>(
    (summary, entry) => {
      const kind = entry.kind;
      const status = entry.status;
      if (kind === "capture") summary.captureCount += 1;
      if (kind === "refund") summary.refundCount += 1;
      if (status === "review_required") summary.reviewCount += 1;
      if (status === "processing") summary.processingCount += 1;
      if (status === "failed") summary.failedCount += 1;

      const gross = signedMoney(entry.grossAmountCents);
      const fee = signedMoney(entry.platformFeeCents);
      const merchant = signedMoney(entry.merchantSettlementCents);
      const unallocated = signedMoney(entry.unallocatedAmountCents);

      if (kind === "capture" && gross > 0) {
        summary.grossCapturedCents += gross;
      }
      if (kind === "refund" && gross < 0) {
        summary.grossRefundedCents += Math.abs(gross);
      }
      summary.netGrossCents += gross;
      summary.platformFeeReserveCents += fee;
      summary.merchantSettlementCents += merchant;
      summary.unallocatedCents += unallocated;
      return summary;
    },
    {
      captureCount: 0,
      refundCount: 0,
      reviewCount: 0,
      processingCount: 0,
      failedCount: 0,
      grossCapturedCents: 0,
      grossRefundedCents: 0,
      netGrossCents: 0,
      platformFeeReserveCents: 0,
      merchantSettlementCents: 0,
      unallocatedCents: 0,
    },
  );
}

function normalizeRefundStatus(value: unknown) {
  return value === "pending" || value === "succeeded" || value === "failed"
    ? value
    : value === "review_required"
      ? value
      : null;
}

function normalizePolicySource(value: unknown): CommerceLedgerPolicySource | null {
  return value === "environment" || value === "unconfigured" ? value : null;
}

function normalizeCurrency(value: unknown) {
  const currency = clean(value, 3).toLowerCase();
  return /^[a-z]{3}$/.test(currency) ? currency : "";
}

function normalizeIso(value: unknown) {
  if (typeof value !== "string") return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function boundedFeeBps(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 && amount <= MAX_FEE_BPS
    ? amount
    : null;
}

function positiveMoney(value: unknown) {
  const amount = nonNegativeMoney(value);
  return amount !== null && amount > 0 ? amount : null;
}

function nonNegativeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) &&
    amount >= 0 &&
    amount <= MAX_MONEY_CENTS
    ? amount
    : null;
}

function signedMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && Math.abs(amount) <= MAX_MONEY_CENTS
    ? amount
    : 0;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
