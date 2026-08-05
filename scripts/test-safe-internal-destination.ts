import assert from "node:assert/strict";

import { safeInternalDestination } from "../lib/safe-internal-destination";

const origin = "https://vi-guide.vercel.app";

assert.equal(safeInternalDestination(null, origin), "/");
assert.equal(safeInternalDestination("", origin), "/");
assert.equal(safeInternalDestination("planner", origin), "/");
assert.equal(safeInternalDestination("//evil.example", origin), "/");
assert.equal(safeInternalDestination("/\\evil.example", origin), "/");
assert.equal(safeInternalDestination("https://evil.example/account", origin), "/");
assert.equal(
  safeInternalDestination("/planner?island=stt#day-one", origin),
  "/planner?island=stt#day-one",
);
assert.equal(
  safeInternalDestination("/checkout/booking-123?step=payment", origin),
  "/checkout/booking-123?step=payment",
);

console.log("Safe internal destination tests passed.");
