import assert from "node:assert/strict";

import {
  calculateProviderReliability,
  cleanInsightProperties,
  redactSensitiveText,
} from "../lib/customer-insights";

assert.equal(redactSensitiveText("Email me at person@example.com or 340-555-1212"), "Email me at [email] or [phone]");
assert.deepEqual(cleanInsightProperties({ valid_key: "ok", "bad key": "no", nested: { no: true } }), { valid_key: "ok" });
assert.equal(calculateProviderReliability({ completed: 10, confirmed: 10, cancelledByProvider: 0, priceAccurate: 10, onTime: 10, complaints: 0, resolvedComplaints: 0 }), 100);
assert.ok(calculateProviderReliability({ completed: 5, confirmed: 10, cancelledByProvider: 5, priceAccurate: 3, onTime: 2, complaints: 4, resolvedComplaints: 1 }) < 60);

console.log("customer insight tests passed");
