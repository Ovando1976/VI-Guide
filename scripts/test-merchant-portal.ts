import assert from "node:assert/strict";

import {
  buildProviderAvailabilityDays,
  humanizeListingId,
  resolveMerchantListingSelection,
} from "../lib/merchant-portal";

assert.equal(
  humanizeListingId("ritz-carlton-st-thomas"),
  "Ritz Carlton St Thomas",
);
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

const availabilityDays = buildProviderAvailabilityDays(12, "2026-08-05");
assert.equal(availabilityDays.length, 14);
assert.deepEqual(availabilityDays[0], {
  date: "2026-08-05",
  isOpen: true,
  capacity: 12,
  startTime: "09:00",
  endTime: "17:00",
});
assert.equal(availabilityDays[13]?.date, "2026-08-18");
assert.equal(buildProviderAvailabilityDays(900, "2026-12-25")[0]?.capacity, 500);
assert.equal(buildProviderAvailabilityDays(Number.NaN, "2026-12-31")[1]?.date, "2027-01-01");

console.log("Merchant portal tests passed.");
