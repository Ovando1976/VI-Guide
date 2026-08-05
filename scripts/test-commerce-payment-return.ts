import assert from "node:assert/strict";

import { parseCommercePaymentReturn } from "../lib/payments/commerce-payment-return";

assert.deepEqual(
  parseCommercePaymentReturn(
    "success",
    "VI-STAY-ME7F3K-AB12",
  ),
  {
    outcome: "success",
    reference: "VI-STAY-ME7F3K-AB12",
  },
);

assert.deepEqual(
  parseCommercePaymentReturn(
    "cancelled",
    "  vi-tour-me7f3k-cd34  ",
  ),
  {
    outcome: "cancelled",
    reference: "VI-TOUR-ME7F3K-CD34",
  },
);

assert.equal(
  parseCommercePaymentReturn("paid", "VI-EXP-ME7F3K-EF56"),
  null,
);
assert.equal(parseCommercePaymentReturn("success", null), null);
assert.equal(parseCommercePaymentReturn("success", "booking-123"), null);
assert.equal(
  parseCommercePaymentReturn("success", "https://evil.example/VI-STAY-123"),
  null,
);
assert.equal(
  parseCommercePaymentReturn("success", "VI-STAY-<SCRIPT>-AB12"),
  null,
);

console.log("Commerce payment return tests passed.");
