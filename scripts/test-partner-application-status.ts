import assert from "node:assert/strict";

import {
  normalizePartnerApplicationReference,
  normalizePartnerStatusEmail,
  publicPartnerApplicationStatus,
} from "../lib/partners/partner-application-status";

assert.equal(
  normalizePartnerApplicationReference(" vi-partner-20260805-abc123 "),
  "VI-PARTNER-20260805-ABC123",
);
assert.equal(
  normalizePartnerApplicationReference("VI-PARTNER-20260805-ABCDE"),
  "",
);
assert.equal(normalizePartnerApplicationReference("not-a-reference"), "");
assert.equal(
  normalizePartnerStatusEmail(" Partner@Example.COM "),
  "partner@example.com",
);
assert.equal(normalizePartnerStatusEmail("invalid"), "");

assert.deepEqual(publicPartnerApplicationStatus("new"), {
  status: "new",
  label: "Application received",
  message:
    "USVI Explorer received the application and it is waiting for an initial business review.",
  action: "No action is required right now.",
});
assert.equal(
  publicPartnerApplicationStatus("reviewing").label,
  "Under review",
);
assert.equal(
  publicPartnerApplicationStatus("needs_information").action,
  "Check the contact email and respond to the USVI Explorer team.",
);
assert.equal(publicPartnerApplicationStatus("approved").label, "Approved");
assert.equal(
  publicPartnerApplicationStatus("declined").label,
  "Not approved",
);

console.log("Partner application status tests passed.");
