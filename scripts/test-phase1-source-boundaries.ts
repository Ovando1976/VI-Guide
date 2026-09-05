import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { evaluatePropertyCheckout } from "../lib/property-intelligence-entitlement";

const financialBoundary = readFileSync(
  path.join(process.cwd(), "lib/analytics/financial-event-server.ts"),
  "utf8",
);
assert.match(financialBoundary, /firebase-admin\/firestore/);
assert.match(financialBoundary, /financial_/);
assert.match(financialBoundary, /stripeEventId/);
assert.match(financialBoundary, /providerId/);
assert.match(financialBoundary, /bookingId/);

const ledger = readFileSync(
  path.join(process.cwd(), "lib/payments/commerce-ledger-firestore.ts"),
  "utf8",
);
assert.match(ledger, /recordFinancialEvent/);
assert.match(ledger, /entry\.status !== "held"/);
assert.match(ledger, /entry\.status !== "posted"/);

assert.equal(
  evaluatePropertyCheckout({
    status: "complete",
    paymentStatus: "no_payment_required",
    amountSubtotal: 4900,
    amountTotal: 0,
    amountDiscount: 4900,
  }).entitled,
  true,
  "a completed, fully discounted checkout grants the purchased entitlement",
);
assert.equal(
  evaluatePropertyCheckout({
    status: "complete",
    paymentStatus: "no_payment_required",
    amountSubtotal: 4900,
    amountTotal: 0,
    amountDiscount: 4800,
  }).entitled,
  false,
  "an incompletely discounted unpaid checkout remains fail-closed",
);

const propertyEntitlementRoute = readFileSync(
  path.join(process.cwd(), "app/api/property-intelligence/entitlement/route.ts"),
  "utf8",
);
assert.match(propertyEntitlementRoute, /if \(!checkoutDecision\.complimentary\) \{/);

console.log("Phase 1 source boundaries passed.");
