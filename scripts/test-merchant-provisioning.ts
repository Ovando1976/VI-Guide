import assert from "node:assert/strict";

import {
  merchantClaimsForUpdate,
  merchantDirectoryRecordForUpdate,
  normalizeProvisioningEmail,
} from "../lib/merchant-provisioning";

assert.equal(
  normalizeProvisioningEmail("  MERCHANT@Example.COM  "),
  "merchant@example.com",
);

const unclaimedRider = merchantClaimsForUpdate({
  currentClaims: {},
  enabled: true,
  listingIds: ["hotel-one"],
});
assert.equal(unclaimedRider.ok, true);
if (unclaimedRider.ok) {
  assert.equal(unclaimedRider.currentRole, "rider");
  assert.equal(unclaimedRider.claims.role, "merchant");
  assert.deepEqual(unclaimedRider.listingIds, ["hotel-one"]);
}

const granted = merchantClaimsForUpdate({
  currentClaims: { role: "rider", betaAccess: true },
  enabled: true,
  listingIds: [" hotel-one ", "hotel-one", "tour-two"],
});
assert.equal(granted.ok, true);
if (granted.ok) {
  assert.equal(granted.nextRole, "merchant");
  assert.deepEqual(granted.listingIds, ["hotel-one", "tour-two"]);
  assert.equal(granted.claims.betaAccess, true);
  assert.equal(granted.claims.role, "merchant");
  assert.deepEqual(granted.claims.listingIds, ["hotel-one", "tour-two"]);
}

const updated = merchantClaimsForUpdate({
  currentClaims: {
    role: "merchant",
    listingIds: ["hotel-one"],
    betaAccess: true,
  },
  enabled: true,
  listingIds: ["restaurant-three"],
});
assert.equal(updated.ok, true);
if (updated.ok) {
  assert.deepEqual(updated.previousListingIds, ["hotel-one"]);
  assert.deepEqual(updated.listingIds, ["restaurant-three"]);
  assert.equal(updated.claims.betaAccess, true);
}

const revoked = merchantClaimsForUpdate({
  currentClaims: {
    role: "merchant",
    listingIds: ["hotel-one"],
    betaAccess: true,
  },
  enabled: false,
  listingIds: [],
});
assert.equal(revoked.ok, true);
if (revoked.ok) {
  assert.equal(revoked.nextRole, "rider");
  assert.equal(revoked.claims.role, "rider");
  assert.equal("listingIds" in revoked.claims, false);
  assert.equal(revoked.claims.betaAccess, true);
}

const missingScope = merchantClaimsForUpdate({
  currentClaims: { role: "rider" },
  enabled: true,
  listingIds: [],
});
assert.equal(missingScope.ok, false);

for (const role of ["admin", "dispatcher", "driver"] as const) {
  const protectedRole = merchantClaimsForUpdate({
    currentClaims: { role },
    enabled: true,
    listingIds: ["hotel-one"],
  });
  assert.equal(protectedRole.ok, false);
}

assert.deepEqual(
  merchantDirectoryRecordForUpdate({
    uid: "merchant-uid",
    email: " Merchant@Example.com ",
    displayName: " Island Operator ",
    enabled: true,
    listingIds: [" hotel-one ", "hotel-one", "tour-two"],
    updatedAt: "2026-08-05T16:08:00.000Z",
  }),
  {
    uid: "merchant-uid",
    email: "merchant@example.com",
    displayName: "Island Operator",
    enabled: true,
    role: "merchant",
    listingIds: ["hotel-one", "tour-two"],
    updatedAt: "2026-08-05T16:08:00.000Z",
  },
);

assert.deepEqual(
  merchantDirectoryRecordForUpdate({
    uid: "merchant-uid",
    email: "merchant@example.com",
    enabled: false,
    listingIds: ["hotel-one"],
    updatedAt: "2026-08-05T16:09:00.000Z",
  }),
  {
    uid: "merchant-uid",
    email: "merchant@example.com",
    displayName: null,
    enabled: false,
    role: "rider",
    listingIds: [],
    updatedAt: "2026-08-05T16:09:00.000Z",
  },
);

assert.equal(
  merchantDirectoryRecordForUpdate({
    uid: "merchant-uid",
    email: "merchant@example.com",
    enabled: true,
    listingIds: [],
    updatedAt: "2026-08-05T16:10:00.000Z",
  }),
  null,
);

console.log("Merchant provisioning tests passed.");
