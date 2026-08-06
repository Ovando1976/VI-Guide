import assert from "node:assert/strict";

import {
  normalizePartnerApplicationId,
  partnerConversionConflict,
  partnerConversionPatch,
  partnerConversionState,
  resolveApprovedPartnerConversion,
} from "../lib/partners/partner-conversion";

const applicationId = "partner_0123456789abcdef0123456789abcdef";
assert.equal(normalizePartnerApplicationId(applicationId), applicationId);
assert.equal(normalizePartnerApplicationId("partner_bad"), "");

const approved = resolveApprovedPartnerConversion({
  applicationId,
  accountEmail: " Owner@Example.com ",
  record: {
    status: "approved",
    email: "owner@example.com",
    existingListingId: "listing-one",
  },
});
assert.equal(approved.ok, true);
if (!approved.ok) throw new Error(approved.error);
assert.deepEqual(approved.conversion, {
  applicationId,
  email: "owner@example.com",
  listingId: "listing-one",
  convertedAt: null,
  merchantUid: null,
  merchantListingId: null,
});

assert.deepEqual(
  resolveApprovedPartnerConversion({
    applicationId,
    accountEmail: "other@example.com",
    record: {
      status: "approved",
      email: "owner@example.com",
      existingListingId: "listing-one",
    },
  }),
  {
    ok: false,
    error: "The approved application does not match this Firebase account.",
  },
);
assert.deepEqual(
  resolveApprovedPartnerConversion({
    applicationId,
    accountEmail: "owner@example.com",
    record: {
      status: "reviewing",
      email: "owner@example.com",
      existingListingId: "listing-one",
    },
  }),
  { ok: false, error: "The partner application is not approved." },
);
assert.deepEqual(
  resolveApprovedPartnerConversion({
    applicationId,
    accountEmail: "owner@example.com",
    record: {
      status: "approved",
      email: "owner@example.com",
      existingListingId: "",
    },
  }),
  {
    ok: false,
    error: "The approved application does not have a reviewed listing ID.",
  },
);

const converted = resolveApprovedPartnerConversion({
  applicationId,
  accountEmail: "owner@example.com",
  record: {
    status: "approved",
    email: "owner@example.com",
    existingListingId: "listing-one",
    merchantAccessGrantedAt: "2026-08-05T18:00:00.000Z",
    merchantUid: "user-1",
    merchantListingId: "listing-one",
  },
});
assert.equal(converted.ok, true);
if (!converted.ok) throw new Error(converted.error);
assert.equal(
  partnerConversionConflict({ conversion: converted.conversion, targetUid: "user-1" }),
  null,
);
assert.equal(
  partnerConversionConflict({ conversion: converted.conversion, targetUid: "user-2" }),
  "This approved application was already converted to a different Firebase account.",
);
assert.equal(partnerConversionState({ status: "approved" }), "awaiting_onboarding");
assert.equal(
  partnerConversionState({
    status: "approved",
    merchantAccessGrantedAt: "2026-08-05T18:00:00.000Z",
  }),
  "converted",
);
assert.equal(partnerConversionState({ status: "reviewing" }), "not_approved");

assert.deepEqual(
  partnerConversionPatch({
    targetUid: "user-1",
    targetEmail: "owner@example.com",
    listingId: "listing-one",
    actorUid: "admin-1",
    actorEmail: "admin@example.com",
    now: new Date("2026-08-05T18:30:00.000Z"),
  }),
  {
    onboardingState: "merchant_access_granted",
    merchantAccessGrantedAt: "2026-08-05T18:30:00.000Z",
    merchantUid: "user-1",
    merchantEmail: "owner@example.com",
    merchantListingId: "listing-one",
    merchantAccessGrantedByUid: "admin-1",
    merchantAccessGrantedByEmail: "admin@example.com",
    nextFollowUpDate: null,
    updatedAt: "2026-08-05T18:30:00.000Z",
  },
);
assert.equal(
  partnerConversionPatch({
    targetUid: "",
    targetEmail: "owner@example.com",
    listingId: "listing-one",
    actorUid: "admin-1",
  }),
  null,
);

console.log("Partner conversion tests passed.");
