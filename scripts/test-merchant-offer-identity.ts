import assert from "node:assert/strict";

import {
  humanizeOfferListingId,
  resolveMerchantOfferListingIdentity,
} from "../lib/merchant-offer-identity";

assert.equal(humanizeOfferListingId("island-tour-one"), "Island Tour One");
assert.equal(humanizeOfferListingId(""), "VI Guide business");

assert.deepEqual(
  resolveMerchantOfferListingIdentity({
    role: "merchant",
    listingId: "island-tour-one",
    requestedName: "Another Business",
  }),
  {
    listingId: "island-tour-one",
    listingName: "Island Tour One",
  },
);
assert.deepEqual(
  resolveMerchantOfferListingIdentity({
    role: "admin",
    listingId: "island-tour-one",
    requestedName: "Island Tour One LLC",
  }),
  {
    listingId: "island-tour-one",
    listingName: "Island Tour One LLC",
  },
);
assert.deepEqual(
  resolveMerchantOfferListingIdentity({
    role: "admin",
    listingId: "island-tour-one",
    requestedName: "",
  }),
  {
    listingId: "island-tour-one",
    listingName: "Island Tour One",
  },
);
assert.equal(
  resolveMerchantOfferListingIdentity({
    role: "dispatcher",
    listingId: "island-tour-one",
    requestedName: "Island Tour One",
  }),
  null,
);
assert.equal(
  resolveMerchantOfferListingIdentity({
    role: "merchant",
    listingId: "",
    requestedName: "Island Tour One",
  }),
  null,
);

console.log("Merchant offer identity tests passed.");
