import assert from "node:assert/strict";

import {
  canTransitionBusinessClaim,
  humanizeBusinessClaimValue,
  normalizeBusinessClaim,
  normalizeBusinessClaimAdminNote,
} from "../lib/partners/business-claim";
import {
  normalizePartnerApplicationReference,
  partnerStatusCollectionForReference,
} from "../lib/partners/partner-application-status";

const now = new Date("2026-08-26T14:00:00.000Z");

const valid = normalizeBusinessClaim(
  {
    businessName: " The Island Shop ",
    existingListingId: " island-shop-stt ",
    contactName: " Alex Doe ",
    email: " OWNER@EXAMPLE.COM ",
    phone: "+1 (340) 555-0199",
    island: "st_thomas",
    claimRole: "owner",
    website: "https://example.com/shop",
    verificationNote: "I am the owner and can verify by phone.",
    consent: true,
    companyFax: "",
    formStartedAt: "2026-08-26T13:59:30.000Z",
  },
  now,
);
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.claim.businessName, "The Island Shop");
  assert.equal(valid.claim.existingListingId, "island-shop-stt");
  assert.equal(valid.claim.email, "owner@example.com");
  assert.equal(valid.claim.claimRole, "owner");
  assert.equal(valid.claim.submittedAt, now.toISOString());
}

assert.deepEqual(
  normalizeBusinessClaim(
    {
      businessName: "Bot Business",
      contactName: "Bot",
      email: "bot@example.com",
      island: "st_croix",
      claimRole: "manager",
      consent: true,
      companyFax: "spam value",
      formStartedAt: "2026-08-26T13:59:30.000Z",
    },
    now,
  ),
  { ok: false, error: "Unable to submit this claim.", spam: true },
);

const tooFast = normalizeBusinessClaim(
  {
    businessName: "Fast Business",
    contactName: "Fast Person",
    email: "fast@example.com",
    island: "st_john",
    claimRole: "manager",
    consent: true,
    formStartedAt: "2026-08-26T13:59:59.000Z",
  },
  now,
);
assert.equal(tooFast.ok, false);
assert.equal(tooFast.ok ? false : tooFast.spam, true);

const badRole = normalizeBusinessClaim(
  {
    businessName: "Role Business",
    contactName: "Role Person",
    email: "role@example.com",
    island: "st_croix",
    claimRole: "customer",
    consent: true,
    formStartedAt: "2026-08-26T13:59:30.000Z",
  },
  now,
);
assert.equal(badRole.ok, false);
assert.equal(
  badRole.ok ? "" : badRole.error,
  "Choose your relationship to the business.",
);

const badListing = normalizeBusinessClaim(
  {
    businessName: "Listing Business",
    existingListingId: "../../admin",
    contactName: "Listing Person",
    email: "listing@example.com",
    island: "st_thomas",
    claimRole: "authorized_representative",
    consent: true,
    formStartedAt: "2026-08-26T13:59:30.000Z",
  },
  now,
);
assert.equal(badListing.ok, false);
assert.equal(
  badListing.ok ? "" : badListing.error,
  "Enter a valid USVI Explorer listing ID or leave it blank.",
);

const noConsent = normalizeBusinessClaim(
  {
    businessName: "Consent Business",
    contactName: "Consent Person",
    email: "consent@example.com",
    island: "territory_wide",
    claimRole: "owner",
    consent: false,
    formStartedAt: "2026-08-26T13:59:30.000Z",
  },
  now,
);
assert.equal(noConsent.ok, false);
assert.equal(
  noConsent.ok ? "" : noConsent.error,
  "Consent is required before submitting the claim.",
);

assert.equal(canTransitionBusinessClaim("new", "reviewing"), true);
assert.equal(canTransitionBusinessClaim("reviewing", "approved"), true);
assert.equal(canTransitionBusinessClaim("approved", "reviewing"), false);
assert.equal(canTransitionBusinessClaim("declined", "reviewing"), true);
assert.equal(canTransitionBusinessClaim("new", "new"), false);
assert.equal(
  normalizeBusinessClaimAdminNote("  Verified by business phone.  "),
  "Verified by business phone.",
);
assert.equal(
  humanizeBusinessClaimValue("authorized_representative"),
  "Authorized Representative",
);

assert.equal(
  normalizePartnerApplicationReference("vi-claim-20260826-a1b2c3"),
  "VI-CLAIM-20260826-A1B2C3",
);
assert.equal(
  partnerStatusCollectionForReference("VI-CLAIM-20260826-A1B2C3"),
  "businessClaims",
);
assert.equal(
  partnerStatusCollectionForReference("VI-PARTNER-20260826-A1B2C3"),
  "partnerApplications",
);
assert.equal(normalizePartnerApplicationReference("VI-CLAIM-INVALID"), "");

console.log("Business claim tests passed.");
