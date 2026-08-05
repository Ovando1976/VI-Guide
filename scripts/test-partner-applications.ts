import assert from "node:assert/strict";

import {
  canTransitionPartnerApplication,
  humanizePartnerValue,
  normalizePartnerAdminNote,
  normalizePartnerApplication,
  partnerApplicationDayKey,
} from "../lib/partners/partner-application";

const now = new Date("2026-08-05T17:00:00.000Z");
const valid = normalizePartnerApplication(
  {
    businessName: " Island Adventures ",
    contactName: " Alex Doe ",
    email: " PARTNER@EXAMPLE.COM ",
    phone: "+1 (340) 555-0199",
    island: "st_thomas",
    category: "tour_activity",
    website: "https://example.com/partner",
    existingListingId: " island-adventures ",
    services:
      "Guided island tours, beach transfers, and private cultural experiences.",
    goals: "Increase direct bookings and concierge referrals.",
    interests: [
      "booking_requests",
      "concierge_referrals",
      "booking_requests",
      "invalid",
    ],
    referralSource: "word of mouth",
    consent: true,
    companyFax: "",
    formStartedAt: "2026-08-05T16:59:30.000Z",
  },
  now,
);
assert.equal(valid.ok, true);
if (valid.ok) {
  assert.equal(valid.application.businessName, "Island Adventures");
  assert.equal(valid.application.email, "partner@example.com");
  assert.equal(valid.application.website, "https://example.com/partner");
  assert.deepEqual(valid.application.interests, [
    "booking_requests",
    "concierge_referrals",
  ]);
  assert.equal(valid.application.submittedAt, now.toISOString());
}

assert.deepEqual(
  normalizePartnerApplication(
    {
      businessName: "Bot Business",
      contactName: "Bot",
      email: "bot@example.com",
      island: "st_thomas",
      category: "other",
      services: "This description is long enough to pass validation.",
      interests: ["listing_visibility"],
      consent: true,
      companyFax: "spam value",
      formStartedAt: "2026-08-05T16:59:30.000Z",
    },
    now,
  ),
  { ok: false, error: "Unable to submit this application.", spam: true },
);

const tooFast = normalizePartnerApplication(
  {
    businessName: "Fast Business",
    contactName: "Fast Person",
    email: "fast@example.com",
    island: "st_john",
    category: "food_drink",
    services: "A full description of the business services offered.",
    interests: ["listing_visibility"],
    consent: true,
    formStartedAt: "2026-08-05T16:59:59.000Z",
  },
  now,
);
assert.equal(tooFast.ok, false);
assert.equal(tooFast.ok ? false : tooFast.spam, true);

const invalidWebsite = normalizePartnerApplication(
  {
    businessName: "Website Business",
    contactName: "Website Person",
    email: "web@example.com",
    island: "st_croix",
    category: "retail_service",
    website: "javascript:alert(1)",
    services: "A full description of the business services offered.",
    interests: ["promotions"],
    consent: true,
    formStartedAt: "2026-08-05T16:59:30.000Z",
  },
  now,
);
assert.deepEqual(invalidWebsite, {
  ok: false,
  error: "Enter a complete website address beginning with http:// or https://.",
});

const noConsent = normalizePartnerApplication(
  {
    businessName: "Consent Business",
    contactName: "Consent Person",
    email: "consent@example.com",
    island: "territory_wide",
    category: "community_organization",
    services: "A full description of the organization and its services.",
    interests: ["concierge_referrals"],
    consent: false,
    formStartedAt: "2026-08-05T16:59:30.000Z",
  },
  now,
);
assert.equal(noConsent.ok, false);
assert.equal(noConsent.ok ? "" : noConsent.error, "Consent is required before submitting the application.");

assert.equal(canTransitionPartnerApplication("new", "reviewing"), true);
assert.equal(canTransitionPartnerApplication("reviewing", "approved"), true);
assert.equal(canTransitionPartnerApplication("approved", "reviewing"), false);
assert.equal(canTransitionPartnerApplication("declined", "reviewing"), true);
assert.equal(canTransitionPartnerApplication("new", "new"), false);
assert.equal(normalizePartnerAdminNote("  Follow up next week.  "), "Follow up next week.");
assert.equal(partnerApplicationDayKey(now), "2026-08-05");
assert.equal(humanizePartnerValue("tour_activity"), "Tour Activity");

console.log("Partner application tests passed.");
