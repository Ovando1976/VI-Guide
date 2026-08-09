import assert from "node:assert/strict";

import {
  normalizeTrueTripPrice,
  resolveTrueTripPrice,
} from "../lib/booking/true-trip-price";

const price = resolveTrueTripPrice(
  {
    baseCents: 66_000,
    taxesCents: 7_900,
    serviceFeesCents: 2_500,
    propertyFeesCents: 6_000,
    transportCents: 0,
    otherMandatoryFeesCents: 0,
  },
  "2026-08-09T12:00:00.000Z",
);

assert.equal(price?.totalCents, 82_400);
assert.equal(normalizeTrueTripPrice(price)?.totalCents, 82_400);
assert.equal(resolveTrueTripPrice({ ...price, baseCents: -1 }), null);
assert.equal(normalizeTrueTripPrice({ ...price, totalCents: 1 }), null);

console.log("true trip price tests passed");
