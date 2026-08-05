import assert from "node:assert/strict";

import {
  canManageListing,
  isMerchantOperationsRole,
  managedListingIdsForSession,
  normalizeManagedListingIds,
} from "../lib/merchant-access";

assert.deepEqual(
  normalizeManagedListingIds([
    "  reef-tour  ",
    "reef-tour",
    "island-stay",
    "",
    null,
  ]),
  ["reef-tour", "island-stay"],
  "listing claims must be trimmed, deduplicated, and cleaned",
);

assert.equal(
  normalizeManagedListingIds(
    Array.from({ length: 40 }, (_, index) => `listing-${index}`),
  ).length,
  30,
  "merchant listing claims must stay within the supported scope",
);

const merchant = {
  role: "merchant" as const,
  listingIds: ["reef-tour", "island-stay"],
};
assert.equal(canManageListing(merchant, "reef-tour"), true);
assert.equal(canManageListing(merchant, "other-provider"), false);
assert.deepEqual(managedListingIdsForSession(merchant), [
  "reef-tour",
  "island-stay",
]);

assert.equal(
  canManageListing({ role: "admin" }, "any-listing"),
  true,
  "admins must retain territory-wide access",
);
assert.equal(
  canManageListing({ role: "dispatcher" }, "any-listing"),
  true,
  "dispatchers must retain territory-wide access",
);
assert.equal(canManageListing({ role: "driver" }, "reef-tour"), false);
assert.equal(canManageListing({ role: "rider" }, "reef-tour"), false);
assert.equal(canManageListing(merchant, ""), false);

assert.equal(isMerchantOperationsRole("merchant"), true);
assert.equal(isMerchantOperationsRole("dispatcher"), true);
assert.equal(isMerchantOperationsRole("admin"), true);
assert.equal(isMerchantOperationsRole("driver"), false);
assert.equal(isMerchantOperationsRole("rider"), false);

console.log("Merchant listing access tests passed.");
