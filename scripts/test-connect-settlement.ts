import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { commerceCheckoutApplicationDecision } from "../lib/payments/commerce-checkout-integrity";
import {
  buildConnectSettlementIdempotencyKey,
  buildConnectSettlementOperationId,
  buildConnectTransferGroup,
  connectSettlementEligibilityError,
} from "../lib/payments/connect-settlement";
import { buildPayout } from "../lib/payouts";
import {
  TAXI_DRIVER_SHARE_BPS,
  TAXI_DRIVER_SIGNUP_FEE_CENTS,
  TAXI_PLATFORM_COMMISSION_BPS,
  splitTaxiRideAmountCents,
} from "../lib/taxi-economics";

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

assert.equal(TAXI_DRIVER_SIGNUP_FEE_CENTS, 0, "drivers must join without a signup fee");
assert.equal(TAXI_PLATFORM_COMMISSION_BPS, 1_500, "taxi platform commission must stay fixed at 15%");
assert.equal(TAXI_DRIVER_SHARE_BPS, 8_500, "taxi driver share must stay fixed at 85%");

const hundredDollarRide = splitTaxiRideAmountCents(10_000);
assert.deepEqual(hundredDollarRide, {
  grossAmountCents: 10_000,
  platformCommissionCents: 1_500,
  driverShareCents: 8_500,
});
assert.equal(
  hundredDollarRide.platformCommissionCents + hundredDollarRide.driverShareCents,
  hundredDollarRide.grossAmountCents,
  "taxi split must conserve every cent",
);

const roundingRide = splitTaxiRideAmountCents(10_001);
assert.equal(
  roundingRide.platformCommissionCents + roundingRide.driverShareCents,
  10_001,
  "taxi split must conserve every cent after rounding",
);

assert.deepEqual(buildPayout({ totalFare: 100 }), {
  grossFare: 100,
  commissionRate: 0.15,
  platformRevenue: 15,
  driverPayout: 85,
});

const taxiSettlementSource = fs.readFileSync(
  path.join(process.cwd(), "lib/taxi-settlement.ts"),
  "utf8",
);
assert.doesNotMatch(
  taxiSettlementSource,
  /TAXI_PLATFORM_COMMISSION_RATE/,
  "taxi economics must not be silently overridden by environment configuration",
);

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
