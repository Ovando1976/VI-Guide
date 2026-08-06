import assert from "node:assert/strict";

import {
  merchantOfferDemandPatch,
  merchantOfferDemandSummary,
  normalizeMerchantOfferLastRequestedAt,
  normalizeMerchantOfferRequestCount,
} from "../lib/merchant-offer-demand";

assert.equal(normalizeMerchantOfferRequestCount(0), 0);
assert.equal(normalizeMerchantOfferRequestCount(4), 4);
assert.equal(normalizeMerchantOfferRequestCount("4"), 4);
assert.equal(normalizeMerchantOfferRequestCount(-1), 0);
assert.equal(normalizeMerchantOfferRequestCount(1.5), 0);
assert.equal(normalizeMerchantOfferRequestCount("invalid"), 0);

assert.deepEqual(
  merchantOfferDemandPatch(
    { requestCount: 4 },
    new Date("2026-08-05T18:45:00.000Z"),
  ),
  {
    requestCount: 5,
    lastRequestedAt: "2026-08-05T18:45:00.000Z",
  },
);
assert.deepEqual(
  merchantOfferDemandPatch(
    { requestCount: "invalid" },
    new Date("2026-08-05T18:46:00.000Z"),
  ),
  {
    requestCount: 1,
    lastRequestedAt: "2026-08-05T18:46:00.000Z",
  },
);

assert.deepEqual(
  merchantOfferDemandSummary([
    { requestCount: 0 },
    { requestCount: 3 },
    { requestCount: "2" },
    { requestCount: -1 },
  ]),
  {
    requests: 5,
    offersWithDemand: 2,
    highestRequestCount: 3,
  },
);

assert.equal(
  normalizeMerchantOfferLastRequestedAt("2026-08-05T18:45:00.000Z"),
  "2026-08-05T18:45:00.000Z",
);
assert.equal(normalizeMerchantOfferLastRequestedAt("not-a-date"), null);
assert.equal(normalizeMerchantOfferLastRequestedAt(null), null);

console.log("Merchant offer demand tests passed.");
