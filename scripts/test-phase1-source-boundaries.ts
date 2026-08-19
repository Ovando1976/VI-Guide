import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

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

console.log("Phase 1 source boundaries passed.");
