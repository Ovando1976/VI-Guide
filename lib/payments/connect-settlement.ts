import { createHash } from "node:crypto";

export type ConnectSettlementEligibilityInput = {
  bookingStatus: unknown;
  paymentStatus: unknown;
  paymentIntegrityStatus: unknown;
  refundStatus: unknown;
  financialHoldStatus?: unknown;
  existingTransferId?: unknown;
  ledgerKind: unknown;
  ledgerStatus: unknown;
  ledgerFeeBps: unknown;
  ledgerFeePolicySource: unknown;
  grossAmountCents: unknown;
  platformFeeCents: unknown;
  merchantSettlementCents: unknown;
  connectedAccountTransferStatus: unknown;
};

export function connectSettlementEligibilityError(
  input: ConnectSettlementEligibilityInput,
) {
  if (clean(input.bookingStatus, 40) !== "completed") {
    return "Only a completed booking can release merchant settlement.";
  }
  if (clean(input.paymentStatus, 40) !== "paid") {
    return "Merchant settlement requires a paid booking.";
  }
  if (clean(input.paymentIntegrityStatus, 40) !== "verified") {
    return "Merchant settlement requires a Stripe-verified payment.";
  }

  const refundStatus = clean(input.refundStatus, 40);
  if (refundStatus && refundStatus !== "not_requested") {
    return "Merchant settlement is blocked because a refund exists or is processing.";
  }

  const financialHoldStatus = clean(input.financialHoldStatus, 80);
  if (financialHoldStatus && financialHoldStatus !== "none") {
    return `Merchant settlement is blocked by ${financialHoldStatus.replaceAll(
      "_",
      " ",
    )}.`;
  }

  if (clean(input.existingTransferId, 220)) {
    return "This booking already has a Stripe merchant transfer.";
  }
  if (input.ledgerKind !== "capture" || input.ledgerStatus !== "held") {
    return "The verified capture is not currently held for merchant settlement.";
  }

  const feeBps = wholeNumber(input.ledgerFeeBps);
  if (
    input.ledgerFeePolicySource !== "environment" ||
    feeBps === null ||
    feeBps <= 0 ||
    feeBps > 10_000
  ) {
    return "The USVI Explorer platform fee policy is not configured for this capture.";
  }

  const gross = nonNegativeMoney(input.grossAmountCents);
  const platformFee = nonNegativeMoney(input.platformFeeCents);
  const merchantSettlement = nonNegativeMoney(input.merchantSettlementCents);
  if (
    gross === null ||
    gross <= 0 ||
    platformFee === null ||
    platformFee <= 0 ||
    merchantSettlement === null ||
    merchantSettlement <= 0 ||
    platformFee + merchantSettlement !== gross
  ) {
    return "The commerce ledger allocation is invalid for merchant settlement.";
  }

  if (clean(input.connectedAccountTransferStatus, 40) !== "active") {
    return "The merchant's Stripe payout account is not transfer-ready yet.";
  }
  return null;
}

export function buildConnectSettlementOperationId(input: {
  bookingId: unknown;
  captureEntryId: unknown;
  destinationAccountId: unknown;
}) {
  const bookingId = clean(input.bookingId, 180);
  const captureEntryId = clean(input.captureEntryId, 120);
  const destinationAccountId = clean(input.destinationAccountId, 220);
  if (!bookingId || !captureEntryId || !destinationAccountId) return "";
  return `commerce_settlement_${digest(
    `${bookingId}:${captureEntryId}:${destinationAccountId}`,
  ).slice(0, 40)}`;
}

export function buildConnectSettlementIdempotencyKey(operationId: unknown) {
  const normalized = clean(operationId, 120);
  if (!normalized) return "";
  return `vi-guide-connect-settlement-${digest(normalized).slice(0, 40)}`;
}

export function buildConnectTransferGroup(bookingId: unknown) {
  const normalized = clean(bookingId, 120);
  if (!normalized) return "";
  return `VI_GUIDE_${digest(normalized).slice(0, 24)}`;
}

function wholeNumber(value: unknown) {
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

function nonNegativeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 100_000_000
    ? amount
    : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
