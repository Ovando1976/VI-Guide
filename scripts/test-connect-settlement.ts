import assert from "node:assert/strict";

import { commerceCheckoutApplicationDecision } from "../lib/payments/commerce-checkout-integrity";
import {
  buildConnectSettlementIdempotencyKey,
  buildConnectSettlementOperationId,
  buildConnectTransferGroup,
  connectSettlementEligibilityError,
} from "../lib/payments/connect-settlement";

const eligible = {
  bookingStatus: "completed",
  paymentStatus: "paid",
  paymentIntegrityStatus: "verified",
  refundStatus: "not_requested",
  financialHoldStatus: "none",
  existingTransferId: "",
  ledgerKind: "capture",
  ledgerStatus: "held",
  ledgerFeeBps: 1000,
  ledgerFeePolicySource: "environment",
  grossAmountCents: 25_000,
  platformFeeCents: 2_500,
  merchantSettlementCents: 22_500,
  connectedAccountTransferStatus: "active",
} as const;

assert.equal(connectSettlementEligibilityError(eligible), null);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    bookingStatus: "confirmed",
  }) ?? "",
  /completed booking/i,
);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    refundStatus: "processing",
  }) ?? "",
  /refund/i,
);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    financialHoldStatus: "dispute_open",
  }) ?? "",
  /blocked/i,
);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    existingTransferId: "tr_existing",
  }) ?? "",
  /already has/i,
);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    ledgerFeeBps: 0,
    ledgerFeePolicySource: "unconfigured",
    platformFeeCents: 0,
    merchantSettlementCents: 25_000,
  }) ?? "",
  /platform fee policy/i,
);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    platformFeeCents: 2_499,
  }) ?? "",
  /ledger allocation/i,
);

assert.match(
  connectSettlementEligibilityError({
    ...eligible,
    connectedAccountTransferStatus: "pending",
  }) ?? "",
  /not transfer-ready/i,
);

const operationId = buildConnectSettlementOperationId({
  bookingId: "booking_123",
  captureEntryId: "capture_123",
  destinationAccountId: "acct_123",
});
assert.ok(operationId.startsWith("commerce_settlement_"));
assert.equal(
  operationId,
  buildConnectSettlementOperationId({
    bookingId: "booking_123",
    captureEntryId: "capture_123",
    destinationAccountId: "acct_123",
  }),
);
assert.notEqual(
  operationId,
  buildConnectSettlementOperationId({
    bookingId: "booking_123",
    captureEntryId: "capture_123",
    destinationAccountId: "acct_other",
  }),
);
assert.ok(buildConnectSettlementIdempotencyKey(operationId).startsWith("vi-guide-connect-settlement-"));
assert.ok(buildConnectTransferGroup("booking_123").startsWith("VI_GUIDE_"));

assert.equal(
  commerceCheckoutApplicationDecision({
    bookingStatus: "completed",
    paymentStatus: "merchant_settled",
    refundStatus: "not_requested",
    existingPaymentIntentId: "pi_123",
    incomingPaymentIntentId: "pi_123",
    existingPaidAmountCents: 25_000,
    incomingPaidAmountCents: 25_000,
  }),
  "already_applied",
  "duplicate Stripe checkout events must not disturb a merchant-settled booking",
);

console.log("Stripe Connect marketplace settlement safety tests passed.");
