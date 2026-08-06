import assert from "node:assert/strict";

import { merchantOfferDepositError } from "../lib/merchant-offer-deposit-policy";
import { resolveMerchantOfferDeposit } from "../lib/merchant-offer-deposit";

assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: false,
    requestedValue: undefined,
    offerDepositCents: 5000,
  }),
  {
    amountCents: 5000,
    source: "offer",
    offerAmountCents: 5000,
    overridden: false,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: true,
    requestedValue: "",
    offerDepositCents: 5000,
  }),
  {
    amountCents: 5000,
    source: "offer",
    offerAmountCents: 5000,
    overridden: false,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: true,
    requestedValue: 0,
    offerDepositCents: 5000,
  }),
  {
    amountCents: 5000,
    source: "offer",
    offerAmountCents: 5000,
    overridden: false,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: true,
    requestedValue: 5000,
    offerDepositCents: 5000,
  }),
  {
    amountCents: 5000,
    source: "offer",
    offerAmountCents: 5000,
    overridden: false,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: true,
    requestedValue: 7500,
    offerDepositCents: 5000,
  }),
  {
    amountCents: 7500,
    source: "merchant_override",
    offerAmountCents: 5000,
    overridden: true,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: true,
    requestedValue: 3500,
    offerDepositCents: null,
  }),
  {
    amountCents: 3500,
    source: "manual",
    offerAmountCents: null,
    overridden: false,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: false,
    requestedValue: undefined,
    offerDepositCents: null,
  }),
  {
    amountCents: 0,
    source: "manual",
    offerAmountCents: null,
    overridden: false,
  },
);
assert.deepEqual(
  resolveMerchantOfferDeposit({
    hasRequestedValue: true,
    requestedValue: 99_000_000,
    offerDepositCents: 5000,
  }),
  {
    amountCents: 10_000_000,
    source: "merchant_override",
    offerAmountCents: 5000,
    overridden: true,
  },
);

assert.equal(
  merchantOfferDepositError({
    amountCents: 5000,
    offerPriceCents: 12900,
  }),
  null,
);
assert.equal(
  merchantOfferDepositError({
    amountCents: 12900,
    offerPriceCents: 12900,
  }),
  null,
);
assert.equal(
  merchantOfferDepositError({
    amountCents: 13000,
    offerPriceCents: 12900,
  }),
  "The deposit cannot exceed the verified offer price.",
);
assert.equal(
  merchantOfferDepositError({
    amountCents: 3500,
    offerPriceCents: null,
  }),
  null,
);

console.log("Merchant offer deposit tests passed.");
