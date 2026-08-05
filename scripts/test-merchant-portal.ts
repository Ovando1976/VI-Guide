import assert from "node:assert/strict";

import {
  humanizeListingId,
  resolveMerchantListingSelection,
} from "../lib/merchant-portal";

assert.equal(humanizeListingId("ritz-carlton-st-thomas"), "Ritz Carlton St Thomas");
assert.equal(humanizeListingId("  island_tour_one  "), "Island Tour One");
assert.equal(humanizeListingId(null), "Assigned business");

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "tour-two",
    managedListingIds: ["hotel-one", "tour-two"],
    restricted: true,
  }),
  "tour-two",
);

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "another-business",
    managedListingIds: ["hotel-one", "tour-two"],
    restricted: true,
  }),
  "hotel-one",
);

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "free-form-listing",
    managedListingIds: ["hotel-one"],
    restricted: false,
  }),
  "free-form-listing",
);

assert.equal(
  resolveMerchantListingSelection({
    requestedListingId: "missing",
    managedListingIds: [],
    restricted: true,
  }),
  "",
);

console.log("Merchant portal tests passed.");
