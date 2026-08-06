import assert from "node:assert/strict";

import {
  dollarsToCents,
  validateSettlementPaymentEvidence,
} from "../lib/settlement-payment-evidence";

const valid = validateSettlementPaymentEvidence({
  settlement: {
    status: "approved",
    operatorSettlement: 225,
  },
  financialHoldStatus: "none",
  refund: {
    status: "not_required",
    amount: 0,
  },
  paidAmountCents: 22500,
  externalPaymentReference: "bank-reference-1234",
  externalPaymentMethod: "bank_transfer",
  paymentNote: "Operator confirmed receipt.",
});

assert.deepEqual(valid, {
  paidAmountCents: 22500,
  externalPaymentReference: "bank-reference-1234",
  externalPaymentMethod: "bank_transfer",
  paymentNote: "Operator confirmed receipt.",
});
assert.equal(dollarsToCents(225), 22500);
assert.equal(dollarsToCents(22.505), 2251);

assertBlocked(
  {
    settlement: { status: "pending_review", operatorSettlement: 225 },
    paidAmountCents: 22500,
    externalPaymentReference: "bank-reference-1234",
    externalPaymentMethod: "bank_transfer",
  },
  "approved settlement",
);
assertBlocked(
  {
    settlement: { status: "approved", operatorSettlement: 225 },
    paidAmountCents: 22499,
    externalPaymentReference: "bank-reference-1234",
    externalPaymentMethod: "bank_transfer",
  },
  "22500 cents",
);
assertBlocked(
  {
    settlement: { status: "approved", operatorSettlement: 225 },
    financialHoldStatus: "manual_review",
    paidAmountCents: 22500,
    externalPaymentReference: "bank-reference-1234",
    externalPaymentMethod: "bank_transfer",
  },
  "manual review",
);
assertBlocked(
  {
    settlement: { status: "approved", operatorSettlement: 225 },
    refund: { status: "succeeded", amount: 22500 },
    paidAmountCents: 22500,
    externalPaymentReference: "bank-reference-1234",
    externalPaymentMethod: "bank_transfer",
  },
  "refund exists",
);
assertBlocked(
  {
    settlement: { status: "approved", operatorSettlement: 225 },
    dispute: { status: "needs_response", fundsReinstated: false },
    paidAmountCents: 22500,
    externalPaymentReference: "bank-reference-1234",
    externalPaymentMethod: "bank_transfer",
  },
  "dispute is unresolved",
);
assertBlocked(
  {
    settlement: { status: "approved", operatorSettlement: 225 },
    paidAmountCents: 22500,
    externalPaymentReference: "x",
    externalPaymentMethod: "bank_transfer",
  },
  "reference is required",
);
assertBlocked(
  {
    settlement: { status: "approved", operatorSettlement: 225 },
    paidAmountCents: 22500,
    externalPaymentReference: "bank-reference-1234",
    externalPaymentMethod: "crypto",
  },
  "valid external payout method",
);

console.log("Settlement payment evidence tests passed.");

function assertBlocked(
  input: Parameters<typeof validateSettlementPaymentEvidence>[0],
  expectedMessage: string,
) {
  assert.throws(
    () => validateSettlementPaymentEvidence(input),
    (error: unknown) =>
      error instanceof Error && error.message.includes(expectedMessage),
  );
}
