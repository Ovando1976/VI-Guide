export const SETTLEMENT_PAYMENT_METHODS = [
  "ach",
  "bank_transfer",
  "cash",
  "check",
  "other",
] as const;

export type SettlementPaymentMethod =
  (typeof SETTLEMENT_PAYMENT_METHODS)[number];

export type SettlementPaymentEvidence = {
  paidAmountCents: number;
  externalPaymentReference: string;
  externalPaymentMethod: SettlementPaymentMethod;
  paymentNote: string | null;
};

type SettlementForPayment = {
  status?: string | null;
  operatorSettlement?: number | null;
};

type RefundForPayment = {
  status?: string | null;
  amount?: number | null;
};

type DisputeForPayment = {
  status?: string | null;
  fundsReinstated?: boolean | null;
};

export function validateSettlementPaymentEvidence(params: {
  settlement?: SettlementForPayment | null;
  financialHoldStatus?: string | null;
  refund?: RefundForPayment | null;
  dispute?: DisputeForPayment | null;
  paidAmountCents: unknown;
  externalPaymentReference: unknown;
  externalPaymentMethod: unknown;
  paymentNote?: unknown;
}): SettlementPaymentEvidence {
  const settlement = params.settlement;
  if (!settlement) {
    throw new Error("This booking does not have a settlement calculation.");
  }
  if (settlement.status !== "approved") {
    throw new Error("Only an approved settlement can be recorded as paid.");
  }

  const expectedAmountCents = dollarsToCents(settlement.operatorSettlement);
  if (expectedAmountCents <= 0) {
    throw new Error("The approved operator settlement amount is invalid.");
  }

  const paidAmountCents = parseWholeCents(params.paidAmountCents);
  if (paidAmountCents !== expectedAmountCents) {
    throw new Error(
      `Recorded payout must equal the approved operator settlement of ${expectedAmountCents} cents.`,
    );
  }

  const financialHoldStatus = cleanText(params.financialHoldStatus, 80);
  if (financialHoldStatus && financialHoldStatus !== "none") {
    throw new Error(
      `Settlement payment is blocked by ${financialHoldStatus.replaceAll("_", " ")}.`,
    );
  }

  const refundStatus = cleanText(params.refund?.status, 80);
  const refundAmount = Number(params.refund?.amount ?? 0);
  const refundClear =
    !refundStatus ||
    (refundStatus === "not_required" && refundAmount === 0) ||
    (refundStatus === "canceled" && refundAmount === 0);
  if (!refundClear) {
    throw new Error("Settlement payment is blocked because a refund exists or is processing.");
  }

  const disputeStatus = cleanText(params.dispute?.status, 80);
  const disputeClear =
    !disputeStatus ||
    (disputeStatus === "won" && params.dispute?.fundsReinstated === true);
  if (!disputeClear) {
    throw new Error("Settlement payment is blocked because a dispute is unresolved.");
  }

  const externalPaymentReference = cleanText(
    params.externalPaymentReference,
    180,
  );
  if (externalPaymentReference.length < 4) {
    throw new Error("An external payout reference is required.");
  }

  const externalPaymentMethod = cleanText(
    params.externalPaymentMethod,
    40,
  ) as SettlementPaymentMethod;
  if (!SETTLEMENT_PAYMENT_METHODS.includes(externalPaymentMethod)) {
    throw new Error("A valid external payout method is required.");
  }

  return {
    paidAmountCents,
    externalPaymentReference,
    externalPaymentMethod,
    paymentNote: cleanText(params.paymentNote, 400) || null,
  };
}

export function dollarsToCents(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

function parseWholeCents(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Paid amount must be a positive whole number of cents.");
  }
  return amount;
}

function cleanText(value: unknown, limit: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}
